import { useEffect, useMemo, useState } from 'react'
import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { getFirebaseFirestore } from '../../../firebase/config'
import { usePersonalAuth } from '../../../context/PersonalAuthContext'
import { getISTDateString } from '../../../utils/ist'

export function useDailyLog({ dateStr } = {}) {
  const { userProfile } = usePersonalAuth()
  const firestore = getFirebaseFirestore()

  const effectiveDateStr = dateStr || useMemo(() => getISTDateString(new Date()), [])

  const docId = useMemo(() => {
    if (!userProfile?.childId) return null
    return `${userProfile.childId}_${effectiveDateStr}`
  }, [userProfile?.childId, effectiveDateStr])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dailyLog, setDailyLog] = useState(null)

  useEffect(() => {
    async function load() {
      if (!firestore || !docId) return
      setLoading(true)
      setError('')
      try {
        const ref = doc(firestore, 'personal_daily_log', docId)
        const snap = await getDoc(ref)
        if (!snap.exists()) {
          setDailyLog({
            childId: userProfile.childId,
            date: effectiveDateStr,
            completedSlots: [],
            skippedSlots: [],
            notes: '',
            loggedByUid: userProfile.uid,
            updatedAt: null,
          })
          return
        }
        const data = snap.data()
        setDailyLog({
          ...data,
          completedSlots: data.completedSlots || [],
          skippedSlots: data.skippedSlots || [],
        })
      } catch (e) {
        console.error('[personal-app] daily log load error:', e)
        setError(e?.message || 'Failed to load daily log')
      } finally {
        setLoading(false)
      }
    }

    if (docId) load()
  }, [firestore, docId, userProfile?.childId, userProfile?.uid, effectiveDateStr])

  async function markSlotCompletion({ slotId, kind }) {
    if (!firestore || !docId || !slotId) return
    if (kind !== 'done' && kind !== 'skip') return

    const ref = doc(firestore, 'personal_daily_log', docId)

    await runTransaction(firestore, async (tx) => {
      const snap = await tx.get(ref)
      const existing = snap.exists() ? snap.data() : null

      const completed = Array.isArray(existing?.completedSlots) ? existing.completedSlots : []
      const skipped = Array.isArray(existing?.skippedSlots) ? existing.skippedSlots : []

      const nextCompleted = new Set(completed)
      const nextSkipped = new Set(skipped)

      if (kind === 'done') {
        nextCompleted.add(slotId)
        nextSkipped.delete(slotId)
      } else {
        nextSkipped.add(slotId)
        nextCompleted.delete(slotId)
      }

      if (!snap.exists()) {
        // Create document if missing.
        tx.set(ref, {
          childId: userProfile.childId,
          date: effectiveDateStr,
          completedSlots: Array.from(nextCompleted),
          skippedSlots: Array.from(nextSkipped),
          notes: '',
          loggedByUid: userProfile.uid,
          updatedAt: serverTimestamp(),
        })
      } else {
        tx.update(ref, {
          completedSlots: Array.from(nextCompleted),
          skippedSlots: Array.from(nextSkipped),
          loggedByUid: userProfile.uid,
          updatedAt: serverTimestamp(),
        })
      }
    })

    setDailyLog((prev) => {
      if (!prev) return prev
      const completed = new Set(prev.completedSlots || [])
      const skipped = new Set(prev.skippedSlots || [])
      if (kind === 'done') {
        completed.add(slotId)
        skipped.delete(slotId)
      } else {
        skipped.add(slotId)
        completed.delete(slotId)
      }
      return { ...prev, completedSlots: Array.from(completed), skippedSlots: Array.from(skipped) }
    })
  }

  async function updateNotes(notes) {
    if (!firestore || !docId) return
    const ref = doc(firestore, 'personal_daily_log', docId)
    const snap = await getDoc(ref)

    if (!snap.exists()) {
      await setDoc(
        ref,
        {
          childId: userProfile.childId,
          date: effectiveDateStr,
          completedSlots: [],
          skippedSlots: [],
          notes: notes || '',
          loggedByUid: userProfile.uid,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    } else {
      await updateDoc(ref, {
        notes: notes || '',
        loggedByUid: userProfile.uid,
        updatedAt: serverTimestamp(),
      })
    }

    setDailyLog((prev) => (prev ? { ...prev, notes: notes || '' } : prev))
  }

  return {
    loading,
    error,
    dailyLog,
    effectiveDateStr,
    markSlotCompletion,
    updateNotes,
  }
}


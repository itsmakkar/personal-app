import { useEffect, useMemo, useState } from 'react'
import { doc, getDoc, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore'
import { getFirebaseFirestore } from '../../../firebase/config'
import { usePersonalAuth } from '../../../context/PersonalAuthContext'
import { getISTDateString } from '../../../utils/ist'

export function useDietLog({ dateStr } = {}) {
  const { userProfile } = usePersonalAuth()
  const firestore = getFirebaseFirestore()

  const effectiveDateStr = dateStr || useMemo(() => getISTDateString(new Date()), [])
  const docId = useMemo(() => {
    if (!userProfile?.childId) return null
    return `${userProfile.childId}_${effectiveDateStr}`
  }, [userProfile?.childId, effectiveDateStr])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [entries, setEntries] = useState([])

  useEffect(() => {
    async function load() {
      if (!firestore || !docId) return
      setLoading(true)
      setError('')
      try {
        const ref = doc(firestore, 'personal_diet_log', docId)
        const snap = await getDoc(ref)
        if (!snap.exists()) {
          setEntries([])
          return
        }
        const data = snap.data()
        setEntries(Array.isArray(data?.entries) ? data.entries : [])
      } catch (e) {
        console.error('[personal-app] diet log load error:', e)
        setError(e?.message || 'Failed to load diet log')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [firestore, docId])

  const entryByMealId = useMemo(() => {
    const map = new Map()
    for (const e of entries) {
      if (e?.mealId) map.set(e.mealId, e)
    }
    return map
  }, [entries])

  async function logMeal({ mealId, type, description, adherent }) {
    if (!firestore || !docId) return
    await runTransaction(firestore, async (tx) => {
      const ref = doc(firestore, 'personal_diet_log', docId)
      const snap = await tx.get(ref)
      const existing = snap.exists() ? snap.data() : null
      const prevEntries = Array.isArray(existing?.entries) ? existing.entries : []

      const nextEntries = prevEntries.filter((e) => e?.mealId !== mealId)
      nextEntries.push({
        mealId: mealId || null,
        type: type || '',
        description: description || '',
        adherent: !!adherent,
        loggedByUid: userProfile.uid,
        loggedAt: serverTimestamp(),
      })

      if (!snap.exists()) {
        tx.set(ref, {
          childId: userProfile.childId,
          date: effectiveDateStr,
          entries: nextEntries,
        })
      } else {
        tx.update(ref, { entries: nextEntries })
      }
    })

    // Optimistic update
    setEntries((prev) => {
      const next = prev.filter((e) => e?.mealId !== mealId)
      next.push({
        mealId: mealId || null,
        type: type || '',
        description: description || '',
        adherent: !!adherent,
        loggedByUid: userProfile.uid,
        loggedAt: { _optimistic: true },
      })
      return next
    })
  }

  return { loading, error, entries, entryByMealId, effectiveDateStr, logMeal }
}


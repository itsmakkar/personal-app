import { useEffect, useState } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { getFirebaseFirestore } from '../../../firebase/config'
import { usePersonalAuth } from '../../../context/PersonalAuthContext'

export function useTimetable() {
  const { userProfile } = usePersonalAuth()
  const firestore = getFirebaseFirestore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timetable, setTimetable] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        if (!firestore || !userProfile?.childId) {
          setTimetable({ childId: userProfile?.childId, slots: [] })
          return
        }

        const ref = doc(firestore, 'personal_timetable', userProfile.childId)
        const snap = await getDoc(ref)
        if (!snap.exists()) {
          setTimetable({ childId: userProfile.childId, slots: [] })
          return
        }
        setTimetable({ ...snap.data(), slots: snap.data().slots || [] })
      } catch (e) {
        console.error('[personal-app] timetable load error:', e)
        setError(e?.message || 'Failed to load timetable')
      } finally {
        setLoading(false)
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestore, userProfile?.childId])

  async function updateTimetableSlots(slots) {
    if (!firestore || !userProfile?.childId) return
    const ref = doc(firestore, 'personal_timetable', userProfile.childId)
    await setDoc(
      ref,
      {
        childId: userProfile.childId,
        updatedAt: serverTimestamp(),
        updatedByUid: userProfile.uid,
        slots,
      },
      { merge: true }
    )
    setTimetable((prev) => ({ ...(prev || {}), slots }))
  }

  return { loading, error, timetable, updateTimetableSlots }
}


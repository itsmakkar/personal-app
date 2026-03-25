import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { getFirebaseFirestore } from '../../../firebase/config'
import { usePersonalAuth } from '../../../context/usePersonalAuth'

export function useDietPlan() {
  const { userProfile } = usePersonalAuth()
  const firestore = getFirebaseFirestore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dietPlan, setDietPlan] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        if (!firestore || !userProfile?.childId) {
          setDietPlan(null)
          return
        }
        const q = query(collection(firestore, 'personal_diet_plan'), where('childId', '==', userProfile.childId))
        const snap = await getDocs(q)
        if (snap.empty) {
          setDietPlan(null)
          return
        }

        const arr = []
        snap.forEach((d) => arr.push({ planId: d.id, ...d.data() }))
        // Pick latest by uploadedAt (if present), else last doc
        arr.sort((a, b) => (b.uploadedAt?._seconds || 0) - (a.uploadedAt?._seconds || 0))
        setDietPlan(arr[0])
      } catch (e) {
        console.error('[personal-app] diet plan load error:', e)
        setError(e?.message || 'Failed to load diet plan')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [firestore, userProfile?.childId])

  return { loading, error, dietPlan }
}


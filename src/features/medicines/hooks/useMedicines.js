import { useEffect, useState } from 'react'
import { addDoc, collection, doc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { getFirebaseFirestore } from '../../../firebase/config'
import { usePersonalAuth } from '../../../context/PersonalAuthContext'

export function useMedicines() {
  const { userProfile } = usePersonalAuth()
  const firestore = getFirebaseFirestore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [medicines, setMedicines] = useState([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        if (!firestore || !userProfile?.childId) {
          setMedicines([])
          return
        }
        const q = query(
          collection(firestore, 'personal_medicines'),
          where('childId', '==', userProfile.childId),
          where('active', '==', true)
        )
        const snap = await getDocs(q)
        const arr = []
        snap.forEach((d) => arr.push({ medicineId: d.id, ...d.data() }))
        setMedicines(arr)
      } catch (e) {
        console.error('[personal-app] medicines load error:', e)
        setError(e?.message || 'Failed to load medicines')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [firestore, userProfile?.childId])

  async function addMedicine({ name, dosage, times, instructions, active = true }) {
    if (!firestore || !userProfile?.childId) return
    const medicineName = String(name || '').trim()
    const dosageStr = String(dosage || '').trim()
    const instructionsStr = String(instructions || '').trim()
    const cleanTimes = Array.isArray(times) ? times : []

    if (!medicineName) throw new Error('Medicine name is required')
    if (cleanTimes.length === 0) throw new Error('At least one scheduled time is required')

    const medicineId = `med_${Date.now()}_${Math.random().toString(16).slice(2)}`
    const ref = doc(firestore, 'personal_medicines', medicineId)
    await setDoc(
      ref,
      {
        medicineId,
        childId: userProfile.childId,
        name: medicineName,
        dosage: dosageStr,
        times: cleanTimes,
        instructions: instructionsStr,
        active: !!active,
        createdAt: serverTimestamp(),
        createdByUid: userProfile.uid,
      },
      { merge: false }
    )

    setMedicines((prev) => [
      ...prev,
      {
        medicineId,
        name: medicineName,
        dosage: dosageStr,
        times: cleanTimes,
        instructions: instructionsStr,
        active: !!active,
      },
    ])
  }

  return { loading, error, medicines, addMedicine }
}


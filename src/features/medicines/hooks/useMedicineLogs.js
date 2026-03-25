import { useEffect, useMemo, useState } from 'react'
import { collection, getDocs, query, where, doc, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { getFirebaseFirestore } from '../../../firebase/config'
import { usePersonalAuth } from '../../../context/usePersonalAuth'
import { getISTDateString } from '../../../utils/ist'

function buildKey(medicineId, scheduledTime) {
  return `${medicineId}__${scheduledTime}`
}

export function useMedicineLogs({ dateStr } = {}) {
  const { userProfile } = usePersonalAuth()
  const firestore = getFirebaseFirestore()

  const todayStr = useMemo(() => getISTDateString(new Date()), [])
  const effectiveDateStr = dateStr || todayStr

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [logs, setLogs] = useState([]) // raw list

  const statusByKey = useMemo(() => {
    const map = new Map()
    for (const l of logs) {
      map.set(buildKey(l.medicineId, l.scheduledTime), l)
    }
    return map
  }, [logs])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        if (!firestore || !userProfile?.childId) {
          setLogs([])
          return
        }

        const q = query(
          collection(firestore, 'personal_medicine_log'),
          where('childId', '==', userProfile.childId),
          where('scheduledDate', '==', effectiveDateStr)
        )
        const snap = await getDocs(q)
        const arr = []
        snap.forEach((d) => arr.push({ medicineLogId: d.id, ...d.data() }))
        setLogs(arr)
      } catch (e) {
        console.error('[personal-app] medicine logs load error:', e)
        setError(e?.message || 'Failed to load medicine logs')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [firestore, userProfile?.childId, effectiveDateStr])

  async function setMedicineStatus({ medicineId, medicineName, scheduledTime, status }) {
    if (!firestore || !userProfile?.childId || !medicineId || !scheduledTime) return
    if (status !== 'given' && status !== 'missed') return

    const key = buildKey(medicineId, scheduledTime)
    const existing = statusByKey.get(key)

    if (existing?.medicineLogId) {
      const ref = doc(firestore, 'personal_medicine_log', existing.medicineLogId)
      await updateDoc(ref, {
        status,
        givenAt: status === 'given' ? serverTimestamp() : null,
        givenByUid: status === 'given' ? userProfile.uid : null,
        givenByName: status === 'given' ? userProfile.name || '' : null,
        // updatedAt not in schema; keep consistent with spec fields
      })
      setLogs((prev) =>
        prev.map((l) =>
          l.medicineLogId === existing.medicineLogId
            ? {
                ...l,
                status,
                givenAt: status === 'given' ? l.givenAt : null,
                givenByUid: status === 'given' ? userProfile.uid : null,
                givenByName: status === 'given' ? userProfile.name || '' : null,
              }
            : l
        )
      )
      return
    }

    // If reminder didn't create a pending log yet, create one now.
    await addDoc(collection(firestore, 'personal_medicine_log'), {
      childId: userProfile.childId,
      medicineId,
      medicineName: medicineName || '',
      scheduledDate: effectiveDateStr,
      scheduledTime,
      status,
      givenAt: status === 'given' ? serverTimestamp() : null,
      givenByUid: status === 'given' ? userProfile.uid : null,
      givenByName: status === 'given' ? userProfile.name || '' : null,
      createdAt: serverTimestamp(),
    })

    // Reload to refresh statusByKey.
    const q = query(
      collection(firestore, 'personal_medicine_log'),
      where('childId', '==', userProfile.childId),
      where('scheduledDate', '==', effectiveDateStr)
    )
    const snap = await getDocs(q)
    const arr = []
    snap.forEach((d) => arr.push({ medicineLogId: d.id, ...d.data() }))
    setLogs(arr)
  }

  return { loading, error, logs, statusByKey, effectiveDateStr, setMedicineStatus }
}


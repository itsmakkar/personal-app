import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { getFirebaseFirestore } from '../../../firebase/config'
import { usePersonalAuth } from '../../../context/PersonalAuthContext'
import { getISTDateString, nowInIST } from '../../../utils/ist'

function subtractDaysInIST(days) {
  const istNow = nowInIST()
  const start = new Date(istNow)
  start.setDate(start.getDate() - days)
  return start
}

export function useBehaviourLogs({ dateStr } = {}) {
  const { userProfile } = usePersonalAuth()
  const firestore = getFirebaseFirestore()

  const todayStr = useMemo(() => dateStr || getISTDateString(nowInIST()), [])
  const startDate = useMemo(() => subtractDaysInIST(13), [])
  const startStr = useMemo(() => getISTDateString(startDate), [startDate])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [logs, setLogs] = useState([])

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
          collection(firestore, 'personal_behaviour_logs'),
          where('childId', '==', userProfile.childId),
          where('date', '>=', startStr),
          where('date', '<=', todayStr)
        )
        const snap = await getDocs(q)
        const arr = []
        snap.forEach((d) => arr.push({ logId: d.id, ...d.data() }))
        arr.sort((a, b) => (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0))
        setLogs(arr)
      } catch (e) {
        console.error('[personal-app] behaviour logs load error:', e)
        setError(e?.message || 'Failed to load behaviour logs')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [firestore, userProfile?.childId, startStr, todayStr])

  async function createBehaviourLog(payload) {
    if (!firestore || !userProfile?.childId) return
    const date = payload?.date || todayStr
    const logId = `beh_${Date.now()}_${Math.random().toString(16).slice(2)}`

    const docRef = doc(firestore, 'personal_behaviour_logs', logId)
    await setDoc(docRef, {
      logId,
      childId: userProfile.childId,
      loggedByUid: userProfile.uid,
      loggedByName: userProfile.name || '',
      date,
      mood: payload.mood,
      energy: payload.energy,
      focus: payload.focus,
      sleep: payload.sleep,
      meltdowns: payload.meltdowns,
      socialEngagement: payload.socialEngagement,
      sessionNotes: payload.sessionNotes,
      whatWorked: payload.whatWorked,
      whatDidntWork: payload.whatDidntWork,
      createdAt: serverTimestamp(),
    })

    // Optimistic prepend (createdAt will be null until server timestamp resolves).
    setLogs((prev) => [
      {
        logId,
        childId: userProfile.childId,
        loggedByUid: userProfile.uid,
        loggedByName: userProfile.name || '',
        date,
        mood: payload.mood,
        energy: payload.energy,
        focus: payload.focus,
        sleep: payload.sleep,
        meltdowns: payload.meltdowns,
        socialEngagement: payload.socialEngagement,
        sessionNotes: payload.sessionNotes,
        whatWorked: payload.whatWorked,
        whatDidntWork: payload.whatDidntWork,
        createdAt: { _seconds: Date.now() / 1000 },
      },
      ...prev,
    ])
  }

  return { loading, error, logs, todayStr, startStr, createBehaviourLog }
}


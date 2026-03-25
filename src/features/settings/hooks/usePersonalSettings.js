import { useEffect, useMemo, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { getFirebaseFirestore } from '../../../firebase/config'
import { usePersonalAuth } from '../../../context/usePersonalAuth'

export function usePersonalSettings() {
  const { userProfile } = usePersonalAuth()
  const firestore = getFirebaseFirestore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const userRef = useMemo(() => {
    if (!firestore || !userProfile?.uid) return null
    return doc(firestore, 'personal_users', userProfile.uid)
  }, [firestore, userProfile?.uid])

  const childRef = useMemo(() => {
    if (!firestore || !userProfile?.childId) return null
    return doc(firestore, 'personal_children', userProfile.childId)
  }, [firestore, userProfile?.childId])

  const settingsRef = useMemo(() => {
    if (!firestore || !userProfile?.uid) return null
    return doc(firestore, 'personal_settings', userProfile.uid)
  }, [firestore, userProfile?.uid])

  const [userDoc, setUserDoc] = useState(null)
  const [childDoc, setChildDoc] = useState(null)
  const [settingsDoc, setSettingsDoc] = useState(null)

  useEffect(() => {
    async function load() {
      setError('')
      setLoading(true)
      try {
        if (!firestore) {
          setUserDoc(userProfile || null)
          setChildDoc(null)
          setSettingsDoc(null)
          return
        }

        if (userRef) {
          const snap = await getDoc(userRef)
          setUserDoc(snap.exists() ? snap.data() : userProfile)
        }

        if (childRef) {
          const snap = await getDoc(childRef)
          setChildDoc(snap.exists() ? snap.data() : null)
        }

        if (settingsRef) {
          const snap = await getDoc(settingsRef)
          setSettingsDoc(snap.exists() ? snap.data() : null)
        }
      } catch (e) {
        console.error('[personal-app] load settings error:', e)
        setError(e?.message || 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestore, userRef, childRef, settingsRef])

  async function updateUser(partial) {
    if (!firestore || !userRef) return
    await setDoc(userRef, partial, { merge: true })
    setUserDoc((prev) => (prev ? { ...prev, ...partial } : partial))
  }

  async function updateChild(partial) {
    if (!firestore || !childRef) return
    await setDoc(childRef, partial, { merge: true })
    setChildDoc((prev) => (prev ? { ...prev, ...partial } : partial))
  }

  async function updatePersonalSettings(partial) {
    if (!firestore || !settingsRef) return
    await setDoc(settingsRef, partial, { merge: true })
    setSettingsDoc((prev) => (prev ? { ...prev, ...partial } : partial))
  }

  return {
    loading,
    error,
    userDoc,
    childDoc,
    settingsDoc,
    updateUser,
    updateChild,
    updatePersonalSettings,
  }
}


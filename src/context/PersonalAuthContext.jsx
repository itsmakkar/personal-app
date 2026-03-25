import { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseFirestore } from '../firebase/config'
import { ensurePersonalDocsAfterOtpLogin } from './personalAuthHelpers'
import { PersonalAuthContext } from './personalAuthContextBase'

export function PersonalAuthProvider({ children }) {
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    const auth = getFirebaseAuth()
    if (!auth) {
      setLoading(false)
      setUserProfile(null)
      return
    }

    return onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (!fbUser) {
          setUserProfile(null)
          return
        }

        const firestore = getFirebaseFirestore()
        if (!firestore) {
          setUserProfile({ uid: fbUser.uid })
          return
        }

        const snap = await getDoc(doc(firestore, 'personal_users', fbUser.uid))
        if (!snap.exists()) {
          setUserProfile({ uid: fbUser.uid })
          return
        }

        setUserProfile({ uid: fbUser.uid, ...snap.data() })
      } catch (e) {
        console.error('[personal-app] Auth profile load error:', e)
        setUserProfile({ uid: fbUser?.uid })
      } finally {
        setLoading(false)
      }
    })
  }, [])

  const value = useMemo(
    () => ({
      loading,
      userProfile,
      signOut: () => {
        const auth = getFirebaseAuth()
        if (!auth) return Promise.resolve()
        return signOut(auth)
      },
      // P2: called after OTP verification.
      ensurePersonalDocsAfterOtpLogin,
    }),
    [loading, userProfile]
  )

  return <PersonalAuthContext.Provider value={value}>{children}</PersonalAuthContext.Provider>
}

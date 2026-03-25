import { arrayUnion, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { getFirebaseFirestore } from '../firebase/config'

export async function ensurePersonalDocsAfterOtpLogin({ uid, phone, childId }) {
  const firestore = getFirebaseFirestore()
  if (!firestore) return

  const userRef = doc(firestore, 'personal_users', uid)
  await setDoc(
    userRef,
    {
      uid,
      phone,
      role: 'personal_parent',
      childId,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  )

  const childRef = doc(firestore, 'personal_children', childId)
  const existing = await getDoc(childRef)
  if (!existing.exists()) {
    await setDoc(
      childRef,
      {
        childId,
        parentUids: [uid],
        createdAt: serverTimestamp(),
      },
      { merge: true }
    )
    return
  }

  const existingData = existing.data()
  const parentUids = Array.isArray(existingData?.parentUids) ? existingData.parentUids : []
  if (!parentUids.includes(uid)) {
    await updateDoc(childRef, { parentUids: arrayUnion(uid) })
  }
}


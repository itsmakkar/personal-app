import { useEffect, useMemo, useState } from 'react'
import { collection, getDocs, query, doc, setDoc, where, serverTimestamp, limit } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getFirebaseFirestore, getFirebaseStorage, getFirebaseFunctions, httpsCallable } from '../../../firebase/config'
import { usePersonalAuth } from '../../../context/usePersonalAuth'

function detectFileType({ file, fileName }) {
  const n = String(fileName || file?.name || '').toLowerCase()
  const t = file?.type || ''
  if (t.includes('pdf') || n.endsWith('.pdf')) return 'pdf'
  if (t.startsWith('image/') || /\.(png|jpg|jpeg|webp|gif)$/.test(n)) return 'image'
  if (t.startsWith('text/') || n.endsWith('.txt') || n.endsWith('.md')) return 'text'
  return 'text'
}

export function useDocuments() {
  const { userProfile } = usePersonalAuth()
  const firestore = getFirebaseFirestore()
  const storage = getFirebaseStorage()
  const functions = getFirebaseFunctions()

  const childId = userProfile?.childId

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [documents, setDocuments] = useState([])

  const canUse = !!firestore && !!storage && !!functions && !!childId

  useEffect(() => {
    async function load() {
      if (!firestore || !childId) return
      setLoading(true)
      setError('')
      try {
        const q = query(collection(firestore, 'personal_documents'), where('childId', '==', childId), limit(50))
        const snap = await getDocs(q)
        const arr = []
        snap.forEach((d) => arr.push({ docId: d.id, ...d.data() }))
        arr.sort((a, b) => (b.uploadedAt?._seconds || 0) - (a.uploadedAt?._seconds || 0))
        setDocuments(arr)
      } catch (e) {
        console.error('[personal-app] documents load error:', e)
        setError(e?.message || 'Failed to load documents')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [firestore, childId])

  const starterUploadCategoryOptions = useMemo(
    () => ['therapy_guide', 'medical_report', 'assessment', 'diet_plan', 'home_plan', 'research', 'other'],
    []
  )

  async function uploadAndProcessDocument({ file, category, description }) {
    if (!canUse) throw new Error('Firebase is not configured.')
    if (!file) throw new Error('Pick a file first.')

    const docId = `doc_${Date.now()}_${Math.random().toString(16).slice(2)}`
    const fileType = detectFileType({ file, fileName: file.name })
    const mimeType = fileType === 'text' ? file.type || 'text/plain' : file.type || 'application/octet-stream'
    const storagePath = `personal-docs/${childId}/${docId}_${file.name}`
    const storageRef = ref(storage, storagePath)

    setError('')
    // Create Firestore doc with processing status.
    await setDoc(
      doc(firestore, 'personal_documents', docId),
      {
        docId,
        childId,
        uploadedByUid: userProfile.uid,
        uploadedAt: serverTimestamp(),
        fileName: file.name,
        fileType,
        storageUrl: null,
        linkUrl: null,
        category: category || 'other',
        description: description || '',
        geminiStatus: 'processing',
        geminiProcessedAt: null,
        chunkCount: 0,
      },
      { merge: false }
    )

    // Upload to Storage
    await uploadBytes(storageRef, file)
    const downloadUrl = await getDownloadURL(storageRef)
    await setDoc(
      doc(firestore, 'personal_documents', docId),
      {
        storageUrl: downloadUrl,
      },
      { merge: true }
    )

    const callable = httpsCallable(functions, 'processPersonalDocument')
    await callable({
      docId,
      childId,
      storagePath,
      mimeType,
      fileType,
      category: category || 'other',
    })

    // Refresh list
    const q = query(collection(firestore, 'personal_documents'), where('childId', '==', childId), limit(50))
    const snap = await getDocs(q)
    const arr = []
    snap.forEach((d) => arr.push({ docId: d.id, ...d.data() }))
    arr.sort((a, b) => (b.uploadedAt?._seconds || 0) - (a.uploadedAt?._seconds || 0))
    setDocuments(arr)
  }

  return { loading, error, documents, uploadAndProcessDocument, starterUploadCategoryOptions }
}


import { useEffect, useState } from 'react'
import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import { httpsCallable, getFirebaseFirestore, getFirebaseFunctions } from '../../../firebase/config'
import { usePersonalAuth } from '../../../context/usePersonalAuth'

export function useChat() {
  const { userProfile } = usePersonalAuth()
  const firestore = getFirebaseFirestore()
  const functions = getFirebaseFunctions()
  const childId = userProfile?.childId

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([]) // exchanges

  useEffect(() => {
    async function load() {
      if (!firestore || !childId) return
      setLoading(true)
      setError('')
      try {
        const q = query(collection(firestore, 'personal_chat_history'), where('childId', '==', childId), limit(30))
        const snap = await getDocs(q)
        const arr = []
        snap.forEach((d) => arr.push({ chatId: d.id, ...d.data() }))
        arr.sort((a, b) => (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0))
        setHistory(arr)
      } catch (e) {
        console.error('[personal-app] chat history load error:', e)
        setError(e?.message || 'Failed to load chat history')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [firestore, childId])

  async function sendQuestion(question) {
    if (!functions || !childId) throw new Error('Firebase is not configured.')
    const callable = httpsCallable(functions, 'personalChatQuery')
    const res = await callable({ question, childId })
    const { answer, sourceType, webSources } = res.data || {}

    const exchange = {
      chatId: `local_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      childId,
      askedByUid: userProfile.uid,
      question,
      answer,
      sourceType,
      webSources: Array.isArray(webSources) ? webSources : [],
      createdAt: { _seconds: Date.now() / 1000 },
    }
    setHistory((prev) => [exchange, ...prev])
    return exchange
  }

  return { loading, error, history, sendQuestion }
}


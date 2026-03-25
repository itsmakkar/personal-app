import { useMemo, useState } from 'react'
import { useChat } from './hooks/useChat'

function badgeStyle({ kind }) {
  if (kind === 'web') {
    return {
      display: 'inline-block',
      padding: '6px 10px',
      borderRadius: 999,
      border: '1px solid #cbd5e1',
      color: '#64748b',
      fontWeight: 900,
      fontSize: 12,
      background: '#f8fafc',
      maxWidth: 220,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }
  }
  return {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: 999,
    border: '1px solid #93c5fd',
    color: '#0ea5e9',
    fontWeight: 900,
    fontSize: 12,
    background: '#eff6ff',
    maxWidth: 220,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }
}

export default function ChatbotPage() {
  const { loading, error, history, sendQuestion } = useChat()
  const [question, setQuestion] = useState('')
  const [sending, setSending] = useState(false)
  const [chatError, setChatError] = useState('')

  const starters = useMemo(
    () => [
      'What therapies work best for my child based on their history?',
      "What does today's behaviour log suggest?",
      'What activities have worked best for my child over the past month?',
    ],
    []
  )

  async function handleSend(q) {
    const trimmed = String(q || '').trim()
    if (!trimmed || sending) return
    setChatError('')
    setSending(true)
    try {
      setQuestion('')
      await sendQuestion(trimmed)
    } catch (e) {
      setChatError(e?.message || 'Chat failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: 14,
        }}
      >
        <div style={{ fontSize: 14, color: '#64748b', fontWeight: 900 }}>Chat</div>
        <div style={{ marginTop: 4, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>Ask for support (documents + context)</div>
        <div style={{ marginTop: 8, fontSize: 13, color: '#64748b', fontWeight: 800 }}>
          The assistant helps organize and recall patterns. It is not a medical device.
        </div>
      </div>

      {error ? <div style={{ color: '#dc2626', fontSize: 13 }}>{error}</div> : null}
      {chatError ? <div style={{ color: '#dc2626', fontSize: 13 }}>{chatError}</div> : null}

      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: 14,
          minHeight: 420,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {loading && !history.length ? <div style={{ color: '#64748b' }}>Loading chat history...</div> : null}

        {!loading && !history.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 800 }}>
              Suggested questions:
            </div>
            {starters.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                style={{
                  height: 48,
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  fontWeight: 900,
                  textAlign: 'left',
                  padding: '0 12px',
                  color: '#0f172a',
                }}
                disabled={sending}
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}

        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 6 }}>
          {history.map((m) => {
            const sourceKind = m.sourceType === 'web' ? 'web' : 'documents'
            const webUrl = m.webSources?.[0]?.url || ''
            const badgeText = m.sourceType === 'web' ? `Web: ${webUrl ? webUrl.replace(/^https?:\/\//, '') : 'source'}` : 'Your documents'

            return (
              <div key={m.chatId} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div
                    style={{
                      maxWidth: '85%',
                      background: '#0ea5e9',
                      color: 'white',
                      borderRadius: 14,
                      padding: '10px 12px',
                      fontSize: 13,
                      fontWeight: 800,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {m.question}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      maxWidth: '85%',
                      background: '#f1f5f9',
                      color: '#0f172a',
                      borderRadius: 14,
                      padding: '10px 12px',
                      fontSize: 13,
                      fontWeight: 800,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {m.answer}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span style={badgeStyle({ kind: sourceKind })}>{badgeText}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type your question..."
          disabled={sending}
          style={{
            flex: 1,
            height: 52,
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            background: 'white',
            padding: '0 14px',
            fontSize: 15,
            fontWeight: 700,
            boxSizing: 'border-box',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend(question)
          }}
        />
        <button
          style={{
            width: 120,
            height: 52,
            background: '#0ea5e9',
            border: 'none',
            borderRadius: 14,
            color: 'white',
            cursor: 'pointer',
            fontWeight: 900,
            opacity: sending ? 0.7 : 1,
          }}
          disabled={sending || !question.trim()}
          onClick={() => handleSend(question)}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}


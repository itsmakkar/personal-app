import { useMemo, useState } from 'react'

function moodColor(mood) {
  const m = mood || ''
  if (m === 'great') return '#16a34a'
  if (m === 'good') return '#22c55e'
  if (m === 'average') return '#0ea5e9'
  if (m === 'difficult') return '#d97706'
  if (m === 'very_difficult') return '#dc2626'
  return '#94a3b8'
}

function Modal({ title, children, onClose }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.35)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && onClose) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              height: 36,
              padding: '0 12px',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              background: '#ffffff',
              cursor: 'pointer',
              fontWeight: 900,
            }}
          >
            Close
          </button>
        </div>
        <div style={{ marginTop: 12 }}>{children}</div>
      </div>
    </div>
  )
}

function dateRangeDays(startStr, endStr) {
  // startStr/endStr are YYYY-MM-DD strings (IST).
  const start = new Date(startStr + 'T00:00:00')
  const end = new Date(endStr + 'T00:00:00')
  const days = []
  const cur = new Date(start)
  while (cur <= end) {
    days.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

export default function BehaviourTrend({ logs, startStr, todayStr }) {
  const [selectedDate, setSelectedDate] = useState(null)

  const logsByDate = useMemo(() => {
    const map = new Map()
    for (const l of logs || []) {
      if (!map.has(l.date)) map.set(l.date, [])
      map.get(l.date).push(l)
    }
    // keep most recent first
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0))
      map.set(k, arr)
    }
    return map
  }, [logs])

  const days = useMemo(() => dateRangeDays(startStr, todayStr), [startStr, todayStr])

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>Last 14 days trend</div>
        <div style={{ fontSize: 12, color: '#64748b' }}>Tap a dot to view details</div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12, overflowX: 'auto', paddingBottom: 6 }}>
        {days.map((d) => {
          const dayLogs = logsByDate.get(d) || []
          const mood = dayLogs[0]?.mood
          const active = selectedDate === d
          return (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                background: moodColor(mood),
                border: active ? '3px solid #0ea5e9' : '2px solid rgba(226,232,240,1)',
                cursor: 'pointer',
                flex: '0 0 auto',
              }}
              title={mood ? `${d} • ${mood}` : d}
            />
          )
        })}
      </div>

      {selectedDate ? (
        <Modal
          title={`Behaviour log — ${selectedDate}`}
          onClose={() => {
            setSelectedDate(null)
          }}
        >
          {(() => {
            const dayLogs = logsByDate.get(selectedDate) || []
            if (!dayLogs.length) {
              return <div style={{ fontSize: 13, color: '#64748b' }}>No log for this day.</div>
            }
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {dayLogs.map((l, idx) => (
                  <div key={`${l.logId}_${idx}`} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>
                      Mood: {l.mood} • Energy: {l.energy} • Focus: {l.focus} • Sleep: {l.sleep}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, color: '#64748b' }}>
                      Meltdowns: {l.meltdowns} • Social: {l.socialEngagement}
                    </div>
                    {l.whatWorked ? (
                      <div style={{ marginTop: 8, fontSize: 13, color: '#0f172a' }}>
                        <b>What worked:</b> {l.whatWorked}
                      </div>
                    ) : null}
                    {l.whatDidntWork ? (
                      <div style={{ marginTop: 8, fontSize: 13, color: '#0f172a' }}>
                        <b>What didn&apos;t work:</b> {l.whatDidntWork}
                      </div>
                    ) : null}
                    {l.sessionNotes ? (
                      <div style={{ marginTop: 8, fontSize: 13, color: '#0f172a' }}>
                        <b>Notes:</b> {l.sessionNotes}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )
          })()}
        </Modal>
      ) : null}
    </div>
  )
}


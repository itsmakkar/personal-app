import { useMemo, useState } from 'react'

const MOODS = [
  { value: 'great', label: 'Great' },
  { value: 'good', label: 'Good' },
  { value: 'average', label: 'Average' },
  { value: 'difficult', label: 'Difficult' },
  { value: 'very_difficult', label: 'Very difficult' },
]

const ENERGIES = [
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
]

const FOCUS = [
  { value: 'sharp', label: 'Sharp' },
  { value: 'average', label: 'Average' },
  { value: 'scattered', label: 'Scattered' },
]

const SLEEP = [
  { value: 'good', label: 'Good' },
  { value: 'average', label: 'Average' },
  { value: 'poor', label: 'Poor' },
]

const SOCIAL = [
  { value: 'engaged', label: 'Engaged' },
  { value: 'average', label: 'Average' },
  { value: 'withdrawn', label: 'Withdrawn' },
]

export default function BehaviourLogForm({ todayStr, onSubmit, disabled }) {
  const [mood, setMood] = useState('good')
  const [energy, setEnergy] = useState('normal')
  const [focus, setFocus] = useState('average')
  const [sleep, setSleep] = useState('average')
  const [meltdowns, setMeltdowns] = useState(0)
  const [socialEngagement, setSocialEngagement] = useState('average')

  const [sessionNotes, setSessionNotes] = useState('')
  const [whatWorked, setWhatWorked] = useState('')
  const [whatDidntWork, setWhatDidntWork] = useState('')

  const canSubmit = useMemo(() => {
    // Keep it simple: allow submit even if free-text fields are empty.
    return !!todayStr && !disabled
  }, [todayStr, disabled])

  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>Log today&apos;s session</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <label style={{ flex: 1, fontSize: 13, color: '#64748b' }}>
            Mood
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              disabled={disabled}
              style={{ width: '100%', marginTop: 6, height: 48, borderRadius: 10, border: '1px solid #d1d5db', background: 'white' }}
            >
              {MOODS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label style={{ flex: 1, fontSize: 13, color: '#64748b' }}>
            Energy
            <select
              value={energy}
              onChange={(e) => setEnergy(e.target.value)}
              disabled={disabled}
              style={{ width: '100%', marginTop: 6, height: 48, borderRadius: 10, border: '1px solid #d1d5db', background: 'white' }}
            >
              {ENERGIES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <label style={{ flex: 1, fontSize: 13, color: '#64748b' }}>
            Focus
            <select
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              disabled={disabled}
              style={{ width: '100%', marginTop: 6, height: 48, borderRadius: 10, border: '1px solid #d1d5db', background: 'white' }}
            >
              {FOCUS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label style={{ flex: 1, fontSize: 13, color: '#64748b' }}>
            Sleep
            <select
              value={sleep}
              onChange={(e) => setSleep(e.target.value)}
              disabled={disabled}
              style={{ width: '100%', marginTop: 6, height: 48, borderRadius: 10, border: '1px solid #d1d5db', background: 'white' }}
            >
              {SLEEP.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <label style={{ flex: 1, fontSize: 13, color: '#64748b' }}>
            Meltdowns today
            <select
              value={String(meltdowns)}
              onChange={(e) => {
                const v = e.target.value
                setMeltdowns(v === '3' ? 3 : Number(v))
              }}
              disabled={disabled}
              style={{ width: '100%', marginTop: 6, height: 48, borderRadius: 10, border: '1px solid #d1d5db', background: 'white' }}
            >
              <option value="0">0</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3+</option>
            </select>
          </label>
          <label style={{ flex: 1, fontSize: 13, color: '#64748b' }}>
            Social engagement
            <select
              value={socialEngagement}
              onChange={(e) => setSocialEngagement(e.target.value)}
              disabled={disabled}
              style={{ width: '100%', marginTop: 6, height: 48, borderRadius: 10, border: '1px solid #d1d5db', background: 'white' }}
            >
              {SOCIAL.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label style={{ fontSize: 13, color: '#64748b' }}>
          What worked (optional)
          <textarea
            value={whatWorked}
            onChange={(e) => setWhatWorked(e.target.value)}
            disabled={disabled}
            style={{
              width: '100%',
              marginTop: 6,
              minHeight: 90,
              border: '1px solid #d1d5db',
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 15,
              boxSizing: 'border-box',
              background: 'white',
            }}
          />
        </label>

        <label style={{ fontSize: 13, color: '#64748b' }}>
          What didn&apos;t work (optional)
          <textarea
            value={whatDidntWork}
            onChange={(e) => setWhatDidntWork(e.target.value)}
            disabled={disabled}
            style={{
              width: '100%',
              marginTop: 6,
              minHeight: 90,
              border: '1px solid #d1d5db',
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 15,
              boxSizing: 'border-box',
              background: 'white',
            }}
          />
        </label>

        <label style={{ fontSize: 13, color: '#64748b' }}>
          Notes (what happened today)
          <textarea
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            disabled={disabled}
            style={{
              width: '100%',
              marginTop: 6,
              minHeight: 90,
              border: '1px solid #d1d5db',
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 15,
              boxSizing: 'border-box',
              background: 'white',
            }}
          />
        </label>

        <button
          disabled={!canSubmit}
          style={{
            height: 52,
            background: canSubmit ? '#0ea5e9' : '#94a3b8',
            color: 'white',
            border: 'none',
            borderRadius: 14,
            fontWeight: 900,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            marginTop: 2,
          }}
          onClick={() =>
            onSubmit({
              date: todayStr,
              mood,
              energy,
              focus,
              sleep,
              meltdowns,
              socialEngagement,
              sessionNotes,
              whatWorked,
              whatDidntWork,
            })
          }
        >
          {disabled ? 'Saving...' : 'Save log'}
        </button>
      </div>
    </div>
  )
}


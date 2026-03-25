import { useEffect, useMemo, useState } from 'react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function OtSharingSettings({ value, onSave, loading }) {
  const data = value || {}

  const [enabled, setEnabled] = useState(!!data.otScheduleSharingEnabled)
  const [sendDay, setSendDay] = useState(data.otScheduleSendDay || 'Sunday')
  const [sendTime, setSendTime] = useState(data.otScheduleSendTime || '19:00')

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setEnabled(!!data.otScheduleSharingEnabled)
    setSendDay(data.otScheduleSendDay || 'Sunday')
    setSendTime(data.otScheduleSendTime || '19:00')
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [data.otScheduleSharingEnabled, data.otScheduleSendDay, data.otScheduleSendTime])

  const dayOptions = useMemo(() => DAYS, [])

  async function handleSave() {
    await onSave({
      otScheduleSharingEnabled: enabled,
      otScheduleSendDay: sendDay,
      otScheduleSendTime: sendTime,
    })
  }

  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>OT sharing</div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontSize: 13, color: '#64748b' }}>
          Share weekly therapy schedule with the OT trainer
        </div>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          style={{ width: 22, height: 22 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 12, opacity: enabled ? 1 : 0.6 }}>
        <label style={{ flex: 1, display: 'block', fontSize: 13, color: '#64748b' }}>
          Send day
          <select
            disabled={!enabled}
            value={sendDay}
            onChange={(e) => setSendDay(e.target.value)}
            style={{
              width: '100%',
              marginTop: 6,
              height: 48,
              padding: '0 12px',
              border: '1px solid #d1d5db',
              borderRadius: 10,
              fontSize: 15,
              boxSizing: 'border-box',
              background: 'white',
            }}
          >
            {dayOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label style={{ flex: 1, display: 'block', fontSize: 13, color: '#64748b' }}>
          Send time (IST)
          <input
            disabled={!enabled}
            type="time"
            value={sendTime}
            onChange={(e) => setSendTime(e.target.value)}
            style={{
              width: '100%',
              marginTop: 6,
              height: 48,
              padding: '0 12px',
              border: '1px solid #d1d5db',
              borderRadius: 10,
              fontSize: 15,
              boxSizing: 'border-box',
              background: 'white',
            }}
          />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button
          style={{
            width: '100%',
            height: 48,
            background: '#0ea5e9',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            fontWeight: 800,
            cursor: 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}


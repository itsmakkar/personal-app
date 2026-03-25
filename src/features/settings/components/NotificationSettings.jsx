import { useEffect, useState } from 'react'

export default function NotificationSettings({ value, onSave, loading }) {
  const data = value || {}

  const [morningEnabled, setMorningEnabled] = useState(!!data.morningDigestEnabled)
  const [morningTime, setMorningTime] = useState(data.morningDigestTime || '07:30')
  const [medicineRemindersEnabled, setMedicineRemindersEnabled] = useState(
    data.medicineRemindersEnabled !== undefined ? !!data.medicineRemindersEnabled : true
  )

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setMorningEnabled(!!data.morningDigestEnabled)
    setMorningTime(data.morningDigestTime || '07:30')
    setMedicineRemindersEnabled(
      data.medicineRemindersEnabled !== undefined ? !!data.medicineRemindersEnabled : true
    )
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [data.morningDigestEnabled, data.morningDigestTime, data.medicineRemindersEnabled])

  async function handleSave() {
    await onSave({
      morningDigestEnabled: morningEnabled,
      morningDigestTime: morningTime,
      medicineRemindersEnabled,
    })
  }

  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>Notifications</div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontSize: 13, color: '#64748b' }}>
          Morning digest via WhatsApp
        </div>
        <input
          type="checkbox"
          checked={morningEnabled}
          onChange={(e) => setMorningEnabled(e.target.checked)}
          style={{ width: 22, height: 22 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 12, opacity: morningEnabled ? 1 : 0.6 }}>
        <label style={{ flex: 1, display: 'block', fontSize: 13, color: '#64748b' }}>
          Digest time (IST)
          <input
            disabled={!morningEnabled}
            type="time"
            value={morningTime}
            onChange={(e) => setMorningTime(e.target.value)}
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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14 }}>
        <div style={{ fontSize: 13, color: '#64748b' }}>Medicine reminders</div>
        <input
          type="checkbox"
          checked={medicineRemindersEnabled}
          onChange={(e) => setMedicineRemindersEnabled(e.target.checked)}
          style={{ width: 22, height: 22 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
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


import { useEffect, useState } from 'react'

export default function ChildProfile({ value, onSave, loading }) {
  const data = value || {}

  const [childName, setChildName] = useState(data.childName || '')
  const [dateOfBirth, setDateOfBirth] = useState(data.dateOfBirth || '')
  const [diagnosis, setDiagnosis] = useState(data.diagnosis || '')
  const [otTrainerName, setOtTrainerName] = useState(data.otTrainerName || '')
  const [otTrainerPhone, setOtTrainerPhone] = useState(data.otTrainerPhone || '')

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setChildName(data.childName || '')
    setDateOfBirth(data.dateOfBirth || '')
    setDiagnosis(data.diagnosis || '')
    setOtTrainerName(data.otTrainerName || '')
    setOtTrainerPhone(data.otTrainerPhone || '')
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [data.childName, data.dateOfBirth, data.diagnosis, data.otTrainerName, data.otTrainerPhone])

  async function handleSave() {
    const p10 = String(otTrainerPhone || '').replace(/\D/g, '')
    const normalizedPhone = p10.length === 10 ? p10 : ''
    await onSave({
      childName: childName.trim(),
      dateOfBirth,
      diagnosis: diagnosis.trim(),
      otTrainerName: otTrainerName.trim(),
      otTrainerPhone: normalizedPhone,
    })
  }

  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>Child profile</div>

      <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 6 }}>
        Child name
        <input
          style={{
            width: '100%',
            marginTop: 6,
            height: 48,
            padding: '0 12px',
            border: '1px solid #d1d5db',
            borderRadius: 10,
            fontSize: 15,
            boxSizing: 'border-box',
          }}
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
          placeholder="e.g. Rishav Jr."
        />
      </label>

      <div style={{ display: 'flex', gap: 10 }}>
        <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginTop: 8, flex: 1 }}>
          DOB
          <input
            style={{
              width: '100%',
              marginTop: 6,
              height: 48,
              padding: '0 12px',
              border: '1px solid #d1d5db',
              borderRadius: 10,
              fontSize: 15,
              boxSizing: 'border-box',
            }}
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
        </label>

        <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginTop: 8, flex: 1 }}>
          Diagnosis
          <input
            style={{
              width: '100%',
              marginTop: 6,
              height: 48,
              padding: '0 12px',
              border: '1px solid #d1d5db',
              borderRadius: 10,
              fontSize: 15,
              boxSizing: 'border-box',
            }}
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="e.g. ASD"
          />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginTop: 8, flex: 1 }}>
          OT trainer name
          <input
            style={{
              width: '100%',
              marginTop: 6,
              height: 48,
              padding: '0 12px',
              border: '1px solid #d1d5db',
              borderRadius: 10,
              fontSize: 15,
              boxSizing: 'border-box',
            }}
            value={otTrainerName}
            onChange={(e) => setOtTrainerName(e.target.value)}
            placeholder="e.g. Ms. Priya"
          />
        </label>

        <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginTop: 8, flex: 1 }}>
          OT trainer phone (10-digit)
          <input
            style={{
              width: '100%',
              marginTop: 6,
              height: 48,
              padding: '0 12px',
              border: '1px solid #d1d5db',
              borderRadius: 10,
              fontSize: 15,
              boxSizing: 'border-box',
            }}
            value={otTrainerPhone}
            onChange={(e) => setOtTrainerPhone(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            maxLength={10}
            placeholder="e.g. 9953032028"
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


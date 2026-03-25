import { useEffect, useState } from 'react'

export default function MealCard({ meal, existingEntry, onLog, disabled }) {
  const [desc, setDesc] = useState(existingEntry?.description || '')
  const [adherent, setAdherent] = useState(existingEntry?.adherent ?? true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDesc(existingEntry?.description || '')
    setAdherent(existingEntry?.adherent ?? true)
  }, [existingEntry?.description, existingEntry?.adherent])

  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>
            {meal.type === 'breakfast'
              ? 'Breakfast'
              : meal.type === 'lunch'
                ? 'Lunch'
                : meal.type === 'dinner'
                  ? 'Dinner'
                  : meal.type === 'snack'
                    ? 'Snacks'
                    : meal.type}
          </div>
          <div style={{ marginTop: 4, fontSize: 13, color: '#64748b', fontWeight: 800 }}>
            Default time: {meal.defaultTime || '—'}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 13, color: '#0f172a', fontWeight: 900 }}>Planned items</div>
      <div style={{ marginTop: 6, fontSize: 13, color: '#64748b', fontWeight: 800 }}>{meal.items || ''}</div>

      {meal.avoid ? (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 900 }}>Avoid</div>
          <div style={{ marginTop: 6, fontSize: 13, color: '#64748b', fontWeight: 800 }}>{meal.avoid}</div>
        </div>
      ) : null}

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>Log what was eaten</div>

        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          disabled={disabled || saving}
          style={{
            width: '100%',
            marginTop: 6,
            minHeight: 90,
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #d1d5db',
            fontSize: 15,
            boxSizing: 'border-box',
            background: 'white',
          }}
          placeholder="e.g. Idli + chutney"
        />

        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 10 }}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 900 }}>Followed plan?</div>
          <input
            type="checkbox"
            checked={adherent}
            onChange={(e) => setAdherent(e.target.checked)}
            disabled={disabled || saving}
            style={{ width: 22, height: 22 }}
          />
        </label>

        <button
          style={{
            marginTop: 12,
            width: '100%',
            height: 48,
            background: '#0ea5e9',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            fontWeight: 900,
            cursor: 'pointer',
            opacity: disabled || saving ? 0.7 : 1,
          }}
          disabled={disabled || saving}
          onClick={async () => {
            setSaving(true)
            try {
              await onLog({ mealId: meal.mealId, type: meal.type, description: desc, adherent })
            } finally {
              setSaving(false)
            }
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}


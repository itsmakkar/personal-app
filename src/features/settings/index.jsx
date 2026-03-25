import { useEffect, useMemo, useState } from 'react'
import { usePersonalAuth } from '../../context/usePersonalAuth'
import { usePersonalSettings } from './hooks/usePersonalSettings'
import ChildProfile from './components/ChildProfile'
import OtSharingSettings from './components/OtSharingSettings'
import NotificationSettings from './components/NotificationSettings'

export default function SettingsPage() {
  const { userProfile } = usePersonalAuth()
  const { loading, error, userDoc, childDoc, settingsDoc, updateUser, updateChild, updatePersonalSettings } =
    usePersonalSettings()

  const [savingUser, setSavingUser] = useState(false)
  const [nameDraft, setNameDraft] = useState('')

  useEffect(() => {
    setNameDraft(userDoc?.name || '')
  }, [userDoc?.name])

  const canSaveName = useMemo(() => (nameDraft || '').trim().length > 0 && nameDraft !== (userDoc?.name || ''), [nameDraft, userDoc?.name])
  const [savingChild, setSavingChild] = useState(false)
  const [savingOt, setSavingOt] = useState(false)
  const [savingNotif, setSavingNotif] = useState(false)

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
        <div style={{ fontSize: 14, color: '#64748b' }}>Settings</div>
        <div style={{ marginTop: 4, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
          {loading ? 'Loading...' : 'Your profile & preferences'}
        </div>
      </div>

      {error ? (
        <div style={{ color: '#dc2626', fontSize: 13, padding: 10, background: '#fff' }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>Account</div>

          <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 6 }}>
            Your name (Rishav / Spouse)
            <input
              disabled={!userProfile}
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
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="e.g. Rishav"
            />
          </label>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              style={{
                width: '100%',
                height: 48,
                background: canSaveName ? '#0ea5e9' : '#94a3b8',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontWeight: 800,
                cursor: canSaveName ? 'pointer' : 'not-allowed',
                opacity: savingUser ? 0.7 : 1,
              }}
              disabled={!canSaveName || savingUser}
              onClick={async () => {
                try {
                  setSavingUser(true)
                  await updateUser({ name: nameDraft.trim() })
                } finally {
                  setSavingUser(false)
                }
              }}
            >
              {savingUser ? 'Saving...' : 'Save name'}
            </button>
          </div>

          <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
            WhatsApp number: {userDoc?.phone || userProfile?.phone || '—'}
          </div>

          {savingUser ? <div style={{ marginTop: 8, fontSize: 13, color: '#64748b' }}>Saving...</div> : null}
        </div>

        <ChildProfile
          value={childDoc}
          loading={savingChild}
          onSave={async (partial) => {
            setSavingChild(true)
            try {
              await updateChild(partial)
            } finally {
              setSavingChild(false)
            }
          }}
        />

        <OtSharingSettings
          value={childDoc}
          loading={savingOt}
          onSave={async (partial) => {
            setSavingOt(true)
            try {
              await updateChild(partial)
            } finally {
              setSavingOt(false)
            }
          }}
        />

        <NotificationSettings
          value={settingsDoc}
          loading={savingNotif}
          onSave={async (partial) => {
            setSavingNotif(true)
            try {
              await updatePersonalSettings(partial)
            } finally {
              setSavingNotif(false)
            }
          }}
        />
      </div>
    </div>
  )
}


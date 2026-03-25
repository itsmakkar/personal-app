import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePersonalAuth } from '../../context/PersonalAuthContext'
import { useTimetable } from './hooks/useTimetable'
import { useDailyLog } from './hooks/useDailyLog'
import { getISTDateString, getISTDayName, isTimeWithinNextMinutes, nowInIST, timeStringToMinutes } from '../../utils/ist'
import { useMedicines } from '../medicines/hooks/useMedicines'
import { useMedicineLogs } from '../medicines/hooks/useMedicineLogs'

function typeColor(type) {
  const t = (type || '').toLowerCase()
  if (t === 'therapy') return '#0ea5e9' // blue
  if (t === 'meal') return '#16a34a' // green
  if (t === 'medicine') return '#f59e0b' // orange
  if (t === 'rest') return '#94a3b8' // grey
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
        zIndex: 50,
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
          maxWidth: 560,
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: 16,
          boxSizing: 'border-box',
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

function newSlotId() {
  return `slot_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export default function TodayPage() {
  const navigate = useNavigate()
  const { userProfile } = usePersonalAuth()
  const { loading: timetableLoading, timetable, updateTimetableSlots } = useTimetable()

  const todayDateStr = useMemo(() => getISTDateString(nowInIST()), [])
  const dayName = useMemo(() => getISTDayName(nowInIST()), [])

  const { dailyLog, markSlotCompletion } = useDailyLog({ dateStr: todayDateStr })
  const { loading: medicinesLoading, medicines } = useMedicines()
  const { statusByKey, setMedicineStatus } = useMedicineLogs({ dateStr: todayDateStr })

  const medicineNameById = useMemo(() => {
    const map = new Map()
    for (const m of medicines || []) map.set(m.medicineId, m.name)
    return map
  }, [medicines])

  const todaySlots = useMemo(() => {
    const slots = timetable?.slots || []
    return slots
      .filter((s) => s.day === dayName)
      .slice()
      .sort((a, b) => timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime))
  }, [timetable?.slots, dayName])

  const [weeklyEditorOpen, setWeeklyEditorOpen] = useState(false)
  const [slotEditId, setSlotEditId] = useState(null)
  const [slotDraft, setSlotDraft] = useState({
    day: dayName,
    startTime: '08:00',
    endTime: '09:00',
    type: 'activity',
    title: '',
    description: '',
    medicineId: null,
  })

  const dueSoonMedicines = useMemo(() => {
    if (!todaySlots?.length) return []
    const istNow = nowInIST()
    const res = []
    for (const slot of todaySlots) {
      if ((slot.type || '').toLowerCase() !== 'medicine') continue
      const scheduledTime = slot.startTime
      const due = isTimeWithinNextMinutes({ timeHHMM: scheduledTime, fromDate: istNow, withinMinutes: 60 })
      if (!due) continue
      const key = `${slot.medicineId}__${scheduledTime}`
      const log = statusByKey?.get(key)
      if (log?.status === 'given' || log?.status === 'missed') continue
      res.push({
        slotId: slot.id,
        medicineId: slot.medicineId,
        scheduledTime,
        title: slot.title || medicineNameById.get(slot.medicineId) || 'Medicine',
      })
    }
    res.sort((a, b) => timeStringToMinutes(a.scheduledTime) - timeStringToMinutes(b.scheduledTime))
    return res
  }, [todaySlots, statusByKey, medicineNameById])

  function isDone(slotId) {
    return (dailyLog?.completedSlots || []).includes(slotId)
  }
  function isSkipped(slotId) {
    return (dailyLog?.skippedSlots || []).includes(slotId)
  }

  async function handleGivenMissed(slot, status) {
    await setMedicineStatus({
      medicineId: slot.medicineId,
      medicineName: medicineNameById.get(slot.medicineId) || slot.title || 'Medicine',
      scheduledTime: slot.startTime,
      status,
    })
    await markSlotCompletion({ slotId: slot.id, kind: status === 'given' ? 'done' : 'skip' })
  }

  if (timetableLoading) {
    return (
      <div style={{ padding: 6 }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
          Loading timetable...
        </div>
      </div>
    )
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
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 14, color: '#64748b' }}>Today</div>
            <div style={{ marginTop: 4, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{dayName} • {todayDateStr}</div>
            <div style={{ marginTop: 6, fontSize: 13, color: '#64748b' }}>
              Mark slots as Done/Skip and medicines as Given/Missed.
            </div>
          </div>
          <button
            onClick={() => setWeeklyEditorOpen(true)}
            style={{
              height: 44,
              padding: '0 14px',
              background: '#e0f2fe',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              cursor: 'pointer',
              fontWeight: 900,
              color: '#0ea5e9',
            }}
          >
            Weekly
          </button>
        </div>
      </div>

      {dueSoonMedicines.length ? (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 12,
            padding: 12,
            color: '#9a3412',
          }}
        >
          Medicines due soon:
          <div style={{ marginTop: 6, fontSize: 14, fontWeight: 800 }}>
            {dueSoonMedicines.map((m) => (
              <div key={`${m.slotId}_${m.scheduledTime}`}>
                {m.scheduledTime} — {m.title}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {todaySlots.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: 14,
          }}
        >
          No slots scheduled for {dayName}. Add slots in Weekly editor.
        </div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {todaySlots.map((slot) => {
          const color = typeColor(slot.type)
          const done = isDone(slot.id)
          const skipped = isSkipped(slot.id)

          return (
            <div
              key={slot.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex' }}>
                <div style={{ width: 10, background: color }} />
                <div style={{ padding: 12, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 900 }}>
                        {slot.startTime} – {slot.endTime}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                        {slot.title || slot.type}
                      </div>
                      {slot.description ? (
                        <details style={{ marginTop: 6 }}>
                          <summary style={{ cursor: 'pointer', color: '#0f172a', fontWeight: 900 }}>Instructions</summary>
                          <div style={{ marginTop: 6, fontSize: 13, color: '#64748b' }}>{slot.description}</div>
                        </details>
                      ) : null}
                    </div>

                    {slot.type?.toLowerCase() === 'medicine' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 150 }}>
                        <button
                          style={{
                            height: 48,
                            background: done ? '#16a34a' : '#0ea5e9',
                            color: 'white',
                            border: 'none',
                            borderRadius: 12,
                            cursor: 'pointer',
                            fontWeight: 900,
                            opacity: medicinesLoading ? 0.7 : 1,
                          }}
                          onClick={() => handleGivenMissed(slot, 'given')}
                          disabled={done}
                        >
                          Given
                        </button>
                        <button
                          style={{
                            height: 48,
                            background: skipped ? '#94a3b8' : '#f1f5f9',
                            color: '#0f172a',
                            border: '1px solid #e2e8f0',
                            borderRadius: 12,
                            cursor: 'pointer',
                            fontWeight: 900,
                            opacity: medicinesLoading ? 0.7 : 1,
                          }}
                          onClick={() => handleGivenMissed(slot, 'missed')}
                          disabled={skipped}
                        >
                          Missed
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 150 }}>
                        <button
                          style={{
                            height: 48,
                            background: done ? '#16a34a' : '#0ea5e9',
                            color: 'white',
                            border: 'none',
                            borderRadius: 12,
                            cursor: 'pointer',
                            fontWeight: 900,
                          }}
                          onClick={() => markSlotCompletion({ slotId: slot.id, kind: 'done' })}
                          disabled={done}
                        >
                          Done
                        </button>
                        <button
                          style={{
                            height: 48,
                            background: skipped ? '#94a3b8' : '#f1f5f9',
                            color: '#0f172a',
                            border: '1px solid #e2e8f0',
                            borderRadius: 12,
                            cursor: 'pointer',
                            fontWeight: 900,
                          }}
                          onClick={() => markSlotCompletion({ slotId: slot.id, kind: 'skip' })}
                          disabled={skipped}
                        >
                          Skip
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button
        style={{
          height: 56,
          background: '#0ea5e9',
          color: 'white',
          border: 'none',
          borderRadius: 14,
          fontWeight: 900,
          cursor: 'pointer',
          marginTop: 8,
        }}
        onClick={() => navigate('/track?section=behaviour')}
      >
        Log today&apos;s session
      </button>

      {weeklyEditorOpen ? (
        <Modal
          title="Weekly schedule editor (slot CRUD)"
          onClose={() => {
            setWeeklyEditorOpen(false)
            setSlotEditId(null)
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <label style={{ flex: 1, fontSize: 13, color: '#64748b' }}>
                Day
                <select
                  value={slotDraft.day}
                  onChange={(e) => setSlotDraft((d) => ({ ...d, day: e.target.value }))}
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
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ flex: 1, fontSize: 13, color: '#64748b' }}>
                Type
                <select
                  value={slotDraft.type}
                  onChange={(e) => setSlotDraft((d) => ({ ...d, type: e.target.value }))}
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
                  {['therapy', 'meal', 'medicine', 'activity', 'school', 'rest', 'other'].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <label style={{ flex: 1, fontSize: 13, color: '#64748b' }}>
                Start
                <input
                  type="time"
                  value={slotDraft.startTime}
                  onChange={(e) => setSlotDraft((d) => ({ ...d, startTime: e.target.value }))}
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
              <label style={{ flex: 1, fontSize: 13, color: '#64748b' }}>
                End
                <input
                  type="time"
                  value={slotDraft.endTime}
                  onChange={(e) => setSlotDraft((d) => ({ ...d, endTime: e.target.value }))}
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

            {slotDraft.type.toLowerCase() === 'medicine' ? (
              <label style={{ fontSize: 13, color: '#64748b' }}>
                Medicine
                <select
                  value={slotDraft.medicineId || ''}
                  onChange={(e) => setSlotDraft((d) => ({ ...d, medicineId: e.target.value || null }))}
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
                  <option value="">Select</option>
                  {(medicines || []).map((m) => (
                    <option key={m.medicineId} value={m.medicineId}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label style={{ fontSize: 13, color: '#64748b' }}>
              Title
              <input
                value={slotDraft.title}
                onChange={(e) => setSlotDraft((d) => ({ ...d, title: e.target.value }))}
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
                placeholder="e.g. Morning OT exercises"
              />
            </label>

            <label style={{ fontSize: 13, color: '#64748b' }}>
              Description (optional)
              <textarea
                value={slotDraft.description}
                onChange={(e) => setSlotDraft((d) => ({ ...d, description: e.target.value }))}
                style={{
                  width: '100%',
                  marginTop: 6,
                  minHeight: 96,
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 10,
                  fontSize: 15,
                  boxSizing: 'border-box',
                  background: 'white',
                }}
                placeholder="Quick instructions for this slot"
              />
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                style={{
                  flex: 1,
                  height: 48,
                  background: '#0ea5e9',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  const newSlots = (timetable?.slots || []).slice()
                  if (slotEditId) {
                    const idx = newSlots.findIndex((s) => s.id === slotEditId)
                    if (idx >= 0) {
                      newSlots[idx] = {
                        ...newSlots[idx],
                        day: slotDraft.day,
                        startTime: slotDraft.startTime,
                        endTime: slotDraft.endTime,
                        type: slotDraft.type,
                        title: slotDraft.title || newSlots[idx].title,
                        description: slotDraft.description || '',
                        medicineId: slotDraft.type.toLowerCase() === 'medicine' ? slotDraft.medicineId : null,
                      }
                    }
                  } else {
                    newSlots.push({
                      id: newSlotId(),
                      day: slotDraft.day,
                      startTime: slotDraft.startTime,
                      endTime: slotDraft.endTime,
                      type: slotDraft.type,
                      title: slotDraft.title || 'Untitled',
                      description: slotDraft.description || '',
                      medicineId: slotDraft.type.toLowerCase() === 'medicine' ? slotDraft.medicineId : null,
                      mealId: null,
                      fromHomePlan: false,
                    })
                  }
                  updateTimetableSlots(newSlots)
                  setSlotEditId(null)
                  setSlotDraft({
                    day: dayName,
                    startTime: '08:00',
                    endTime: '09:00',
                    type: 'activity',
                    title: '',
                    description: '',
                    medicineId: null,
                  })
                }}
              >
                {slotEditId ? 'Save changes' : 'Add slot'}
              </button>

              {slotEditId ? (
                <button
                  style={{
                    flex: 1,
                    height: 48,
                    background: '#ffffff',
                    color: '#0f172a',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    const newSlots = (timetable?.slots || []).filter((s) => s.id !== slotEditId)
                    updateTimetableSlots(newSlots)
                    setSlotEditId(null)
                  }}
                >
                  Delete slot
                </button>
              ) : null}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: -4 }}>
              Tip: slot CRUD is basic for now (P15 import and richer reordering comes later).
            </div>

            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 900 }}>Existing slots</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10, maxHeight: 340, overflow: 'auto' }}>
                {(timetable?.slots || [])
                  .slice()
                  .sort(
                    (a, b) =>
                      (a.day || '').localeCompare(b.day || '') || timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime)
                  )
                  .map((slot) => (
                    <div
                      key={slot.id}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: 10,
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 900 }}>
                          {slot.day} • {slot.startTime}–{slot.endTime}
                        </div>
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {slot.title}
                        </div>
                      </div>
                      <button
                        style={{
                          height: 40,
                          padding: '0 12px',
                          border: '1px solid #e2e8f0',
                          background: '#ffffff',
                          borderRadius: 10,
                          fontWeight: 900,
                          cursor: 'pointer',
                          flex: '0 0 auto',
                        }}
                        onClick={() => {
                          setSlotEditId(slot.id)
                          setSlotDraft({
                            day: slot.day,
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                            type: slot.type,
                            title: slot.title || '',
                            description: slot.description || '',
                            medicineId: slot.medicineId || null,
                          })
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}


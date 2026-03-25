import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getISTDateString, getISTDayName, nowInIST, timeStringToMinutes } from '../../utils/ist'
import { useDailyLog } from '../timetable/hooks/useDailyLog'
import { useTimetable } from '../timetable/hooks/useTimetable'
import { useMedicines } from '../medicines/hooks/useMedicines'
import { useMedicineLogs } from '../medicines/hooks/useMedicineLogs'
import { useBehaviourLogs } from '../behaviour/hooks/useBehaviourLogs'
import BehaviourLogForm from '../behaviour/components/BehaviourLogForm'
import BehaviourTrend from '../behaviour/components/BehaviourTrend'
import { useDietPlan } from '../diet/hooks/useDietPlan'
import { useDietLog } from '../diet/hooks/useDietLog'
import MealCard from '../diet/components/MealCard'

function sectionFromQuery(search) {
  const params = new URLSearchParams(search || '')
  const s = params.get('section')
  if (!s) return 'medicines'
  if (s === 'behaviour' || s === 'medicines' || s === 'diet') return s
  return 'medicines'
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

function parseTimesInput(str) {
  // Accept "08:00,20:00" or "08:00 20:00"
  return String(str || '')
    .split(/[,\\s]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((t) => timeStringToMinutes(t) != null)
}

export default function TrackPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const section = sectionFromQuery(location.search)

  const todayDateStr = useMemo(() => getISTDateString(nowInIST()), [])
  const todayDayName = useMemo(() => getISTDayName(nowInIST()), [])

  const { timetable } = useTimetable()
  const todayMedicineSlots = useMemo(() => {
    const slots = timetable?.slots || []
    return slots
      .filter((s) => s.day === todayDayName && (s.type || '').toLowerCase() === 'medicine')
      .slice()
      .sort((a, b) => timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime))
  }, [timetable?.slots, todayDayName])

  const { dailyLog, markSlotCompletion } = useDailyLog({ dateStr: todayDateStr })
  const { medicines, addMedicine } = useMedicines()
  const { statusByKey, setMedicineStatus } = useMedicineLogs({ dateStr: todayDateStr })

  const [addMedicineOpen, setAddMedicineOpen] = useState(false)
  const [medDraft, setMedDraft] = useState({
    name: '',
    dosage: '',
    timesStr: '',
    instructions: '',
    active: true,
  })
  const [medError, setMedError] = useState('')
  const [medSaving, setMedSaving] = useState(false)

  const {
    logs: behaviourLogs,
    startStr,
    todayStr,
    createBehaviourLog,
    loading: behaviourLoading,
    error: behaviourError,
  } = useBehaviourLogs()

  const [behSaving, setBehSaving] = useState(false)
  const [behError, setBehError] = useState('')

  const {
    loading: dietPlanLoading,
    error: dietPlanError,
    dietPlan,
  } = useDietPlan()
  const {
    loading: dietLogLoading,
    error: dietLogError,
    entryByMealId,
    logMeal,
  } = useDietLog({ dateStr: todayDateStr })

  function goSection(next) {
    navigate(`/track?section=${next}`)
  }

  async function handleSetMedicine(status, medicine, scheduledTime) {
    await setMedicineStatus({
      medicineId: medicine.medicineId,
      medicineName: medicine.name,
      scheduledTime,
      status,
    })

    const matching = todayMedicineSlots.filter((s) => s.medicineId === medicine.medicineId && s.startTime === scheduledTime)
    for (const slot of matching) {
      await markSlotCompletion({ slotId: slot.id, kind: status === 'given' ? 'done' : 'skip' })
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
        <div style={{ fontSize: 14, color: '#64748b', fontWeight: 900 }}>Track</div>
        <div style={{ marginTop: 4, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>
          Medicines + Behaviour + Diet
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
          <button
            style={{
              flex: 1,
              height: 44,
              background: section === 'medicines' ? '#e0f2fe' : '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              cursor: 'pointer',
              fontWeight: 900,
              color: section === 'medicines' ? '#0ea5e9' : '#0f172a',
            }}
            onClick={() => goSection('medicines')}
          >
            Medicines
          </button>
          <button
            style={{
              flex: 1,
              height: 44,
              background: section === 'behaviour' ? '#e0f2fe' : '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              cursor: 'pointer',
              fontWeight: 900,
              color: section === 'behaviour' ? '#0ea5e9' : '#0f172a',
            }}
            onClick={() => goSection('behaviour')}
          >
            Behaviour
          </button>
          <button
            style={{
              flex: 1,
              height: 44,
              background: section === 'diet' ? '#e0f2fe' : '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              cursor: 'pointer',
              fontWeight: 900,
              color: section === 'diet' ? '#0ea5e9' : '#0f172a',
            }}
            onClick={() => goSection('diet')}
          >
            Diet
          </button>
        </div>
      </div>

      {section === 'medicines' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>Active medicines</div>
            <button
              style={{
                height: 44,
                padding: '0 14px',
                background: '#0ea5e9',
                border: 'none',
                color: 'white',
                borderRadius: 12,
                fontWeight: 900,
                cursor: 'pointer',
              }}
              onClick={() => setAddMedicineOpen(true)}
            >
              Add medicine
            </button>
          </div>

          {medicines?.length ? null : (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, color: '#64748b' }}>
              No active medicines yet. Add one, then create medicine slots in Weekly schedule.
            </div>
          )}

          {(medicines || [])
            .slice()
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            .map((medicine) => (
              <div
                key={medicine.medicineId}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 1000, color: '#0f172a' }}>{medicine.name}</div>
                    <div style={{ marginTop: 4, fontSize: 13, color: '#64748b', fontWeight: 800 }}>{medicine.dosage}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 900 }}>Today</div>
                </div>

                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(medicine.times || []).slice().sort((a, b) => timeStringToMinutes(a) - timeStringToMinutes(b)).map((t) => {
                    const key = `${medicine.medicineId}__${t}`
                    const log = statusByKey?.get(key)
                    const status = log?.status || 'pending'
                    const label =
                      status === 'given' ? 'Given' : status === 'missed' ? 'Missed' : 'Pending'

                    const color = status === 'given' ? '#16a34a' : status === 'missed' ? '#94a3b8' : '#f59e0b'

                    return (
                      <div key={`${medicine.medicineId}_${t}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 10, height: 36, background: color, borderRadius: 999 }} />
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{t}</div>
                            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 800 }}>{label}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            style={{
                              height: 42,
                              padding: '0 12px',
                              background: status === 'given' ? '#16a34a' : '#0ea5e9',
                              color: 'white',
                              border: 'none',
                              borderRadius: 12,
                              cursor: 'pointer',
                              fontWeight: 900,
                              opacity: status === 'given' ? 0.8 : 1,
                            }}
                            onClick={() => handleSetMedicine('given', medicine, t)}
                            disabled={status === 'given'}
                          >
                            Given
                          </button>
                          <button
                            style={{
                              height: 42,
                              padding: '0 12px',
                              background: status === 'missed' ? '#94a3b8' : '#f1f5f9',
                              color: '#0f172a',
                              border: '1px solid #e2e8f0',
                              borderRadius: 12,
                              cursor: 'pointer',
                              fontWeight: 900,
                              opacity: status === 'missed' ? 0.8 : 1,
                            }}
                            onClick={() => handleSetMedicine('missed', medicine, t)}
                            disabled={status === 'missed'}
                          >
                            Missed
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {medicine.instructions ? (
                  <div style={{ marginTop: 10, fontSize: 13, color: '#64748b', fontWeight: 800 }}>
                    Instructions: {medicine.instructions}
                  </div>
                ) : null}
              </div>
            ))}
        </div>
      ) : null}

      {section === 'behaviour' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {behaviourError ? (
            <div style={{ color: '#dc2626', fontSize: 13, padding: 10, background: '#fff' }}>{behaviourError}</div>
          ) : null}

          <BehaviourLogForm
            todayStr={todayStr}
            disabled={behSaving || behaviourLoading}
            onSubmit={async (payload) => {
              setBehError('')
              setBehSaving(true)
              try {
                await createBehaviourLog(payload)
              } catch (e) {
                setBehError(e?.message || 'Failed to save log')
              } finally {
                setBehSaving(false)
              }
            }}
          />

          {behError ? <div style={{ color: '#dc2626', fontSize: 13 }}>{behError}</div> : null}

          <BehaviourTrend logs={behaviourLogs} startStr={startStr} todayStr={todayStr} />
        </div>
      ) : null}

      {section === 'diet' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {dietPlanError ? (
            <div style={{ color: '#dc2626', fontSize: 13, padding: 10, background: '#fff' }}>{dietPlanError}</div>
          ) : null}
          {dietLogError ? (
            <div style={{ color: '#dc2626', fontSize: 13, padding: 10, background: '#fff' }}>{dietLogError}</div>
          ) : null}

          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: 14,
              color: '#64748b',
            }}
          >
            {dietPlanLoading || dietLogLoading ? 'Loading diet plan...' : dietPlan ? `Diet plan for today (${todayDateStr})` : 'No diet plan found yet.'}
          </div>

          {dietPlan
            ? (() => {
                const meals = Array.isArray(dietPlan.meals) ? dietPlan.meals : []
                const orderedTypes = ['breakfast', 'lunch', 'dinner', 'snack']
                const byType = new Map()
                for (const m of meals) byType.set(m.type, m)

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {orderedTypes.map((t) => {
                      const meal = byType.get(t)
                      if (!meal) return null
                      const existingEntry = meal?.mealId ? entryByMealId.get(meal.mealId) : null
                      return (
                        <MealCard
                          key={meal.mealId}
                          meal={meal}
                          existingEntry={existingEntry}
                          disabled={dietPlanLoading || dietLogLoading}
                          onLog={async (payload) => {
                            await logMeal({
                              mealId: payload.mealId,
                              type: payload.type,
                              description: payload.description,
                              adherent: payload.adherent,
                            })
                          }}
                        />
                      )
                    })}
                  </div>
                )
              })()
            : null}
        </div>
      ) : null}

      {addMedicineOpen ? (
        <Modal
          title="Add medicine"
          onClose={() => {
            setAddMedicineOpen(false)
            setMedError('')
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: 13, color: '#64748b' }}>
              Name
              <input
                value={medDraft.name}
                onChange={(e) => setMedDraft((d) => ({ ...d, name: e.target.value }))}
                style={{ width: '100%', marginTop: 6, height: 48, padding: '0 12px', borderRadius: 10, border: '1px solid #d1d5db' }}
              />
            </label>
            <label style={{ fontSize: 13, color: '#64748b' }}>
              Dosage
              <input
                value={medDraft.dosage}
                onChange={(e) => setMedDraft((d) => ({ ...d, dosage: e.target.value }))}
                style={{ width: '100%', marginTop: 6, height: 48, padding: '0 12px', borderRadius: 10, border: '1px solid #d1d5db' }}
              />
            </label>
            <label style={{ fontSize: 13, color: '#64748b' }}>
              Scheduled times (IST)
              <input
                value={medDraft.timesStr}
                onChange={(e) => setMedDraft((d) => ({ ...d, timesStr: e.target.value }))}
                placeholder="e.g. 08:00,20:00"
                style={{ width: '100%', marginTop: 6, height: 48, padding: '0 12px', borderRadius: 10, border: '1px solid #d1d5db' }}
              />
            </label>
            <label style={{ fontSize: 13, color: '#64748b' }}>
              Instructions (optional)
              <textarea
                value={medDraft.instructions}
                onChange={(e) => setMedDraft((d) => ({ ...d, instructions: e.target.value }))}
                placeholder="e.g. Give with food"
                style={{ width: '100%', marginTop: 6, minHeight: 90, padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}
              />
            </label>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 900 }}>Active</div>
              <input
                type="checkbox"
                checked={!!medDraft.active}
                onChange={(e) => setMedDraft((d) => ({ ...d, active: e.target.checked }))}
                style={{ width: 22, height: 22 }}
              />
            </div>

            {medError ? <div style={{ color: '#dc2626', fontSize: 13 }}>{medError}</div> : null}

            <button
              style={{
                height: 52,
                background: '#0ea5e9',
                color: 'white',
                border: 'none',
                borderRadius: 14,
                fontWeight: 900,
                cursor: 'pointer',
                opacity: medSaving ? 0.8 : 1,
              }}
              disabled={medSaving}
              onClick={async () => {
                setMedError('')
                setMedSaving(true)
                try {
                  const times = parseTimesInput(medDraft.timesStr)
                  await addMedicine({
                    name: medDraft.name,
                    dosage: medDraft.dosage,
                    times,
                    instructions: medDraft.instructions,
                    active: medDraft.active,
                  })
                  setAddMedicineOpen(false)
                  setMedDraft({ name: '', dosage: '', timesStr: '', instructions: '', active: true })
                } catch (e) {
                  setMedError(e?.message || 'Failed to add medicine')
                } finally {
                  setMedSaving(false)
                }
              }}
            >
              {medSaving ? 'Saving...' : 'Save medicine'}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}


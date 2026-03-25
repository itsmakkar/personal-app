export function getISTDateString(d = new Date()) {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) // YYYY-MM-DD
}

export function getISTDayName(d = new Date()) {
  const ist = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour12: false }))
  return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'long' }).format(ist)
}

export function nowInIST() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour12: false }))
}

export function timeStringToMinutes(t) {
  const [hh, mm] = String(t || '')
    .trim()
    .split(':')
    .map((x) => Number(x))
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null
  return hh * 60 + mm
}

export function isTimeWithinNextMinutes({ timeHHMM, fromDate = new Date(), withinMinutes }) {
  const now = new Date(fromDate)
  const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour12: false }))
  const minutesNow = istNow.getHours() * 60 + istNow.getMinutes()

  const minutesTarget = timeStringToMinutes(timeHHMM)
  if (minutesTarget == null) return false

  const diff = minutesTarget - minutesNow
  return diff >= 0 && diff <= withinMinutes
}


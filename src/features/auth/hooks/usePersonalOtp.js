import { httpsCallable, getFirebaseFunctions } from '../../../firebase/config'

export function usePersonalOtp() {
  async function requestOtp(phoneDigits) {
    const functions = getFirebaseFunctions()
    if (!functions) {
      throw new Error('Firebase is not configured. Add VITE_FIREBASE_* env vars.')
    }

    const req = httpsCallable(functions, 'requestParentOtp')
    const res = await req({ phone: phoneDigits })
    return res.data
  }

  async function verifyOtp(phoneDigits, otp) {
    const functions = getFirebaseFunctions()
    if (!functions) {
      throw new Error('Firebase is not configured. Add VITE_FIREBASE_* env vars.')
    }

    const req = httpsCallable(functions, 'verifyParentOtp')
    const res = await req({ phone: phoneDigits, otp })
    return res.data
  }

  return { requestOtp, verifyOtp }
}


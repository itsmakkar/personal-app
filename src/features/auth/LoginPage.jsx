import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { signInWithCustomToken } from 'firebase/auth'
import { getFirebaseAuth } from '../../firebase/config'
import { usePersonalOtp } from './hooks/usePersonalOtp'
import { usePersonalAuth } from '../../context/usePersonalAuth'
import logo from '../../assets/logo.svg'

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  border: '1px solid #d1d5db',
  borderRadius: 10,
  fontSize: 16,
  fontFamily: 'inherit',
  height: 48,
  boxSizing: 'border-box',
}

const btnPrimary = {
  width: '100%',
  padding: '12px',
  background: '#0ea5e9',
  color: 'white',
  border: 'none',
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
  height: 48,
}

const btnSecondary = {
  width: '100%',
  padding: '12px',
  background: '#ffffff',
  color: '#0f172a',
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  height: 48,
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { userProfile, loading, ensurePersonalDocsAfterOtpLogin } = usePersonalAuth()
  const { requestOtp, verifyOtp } = usePersonalOtp()

  const [step, setStep] = useState(1)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loadingOtp, setLoadingOtp] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const phoneDigits = useMemo(() => phone.replace(/\D/g, ''), [phone])
  const otpCode = otp.join('')

  useEffect(() => {
    if (userProfile) navigate('/', { replace: true })
  }, [userProfile, navigate])

  function maskPhone(p) {
    if (!p || p.length < 4) return p
    return 'XXXXXX' + p.slice(-4)
  }

  async function handleSendOtp() {
    setError('')
    if (phoneDigits.length !== 10) {
      setError('Enter a valid 10-digit WhatsApp number')
      return
    }

    setLoadingOtp(true)
    try {
      await requestOtp(phoneDigits)
      setStep(2)
      setResendCooldown(60)
    } catch (err) {
      setError(err?.message || 'Failed to send OTP')
    } finally {
      setLoadingOtp(false)
    }
  }

  function handleOtpChange(idx, val) {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[idx] = val.slice(-1)
    setOtp(next)

    if (val && idx < 5) {
      const inp = document.getElementById(`otp-${idx + 1}`)
      if (inp) inp.focus()
    }
  }

  async function handleVerifyOtp() {
    setError('')
    if (otpCode.length !== 6) {
      setError('Enter all 6 digits')
      return
    }

    setLoadingOtp(true)
    try {
      const auth = getFirebaseAuth()
      if (!auth) throw new Error('Firebase is not configured.')

      const res = await verifyOtp(phoneDigits, otpCode)
      const { customToken, childId } = res || {}
      if (!customToken || !childId) {
        throw new Error('OTP verification returned an invalid response.')
      }

      const cred = await signInWithCustomToken(auth, customToken)
      await ensurePersonalDocsAfterOtpLogin({
        uid: cred.user.uid,
        phone: phoneDigits,
        childId,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err?.message || 'Invalid OTP')
    } finally {
      setLoadingOtp(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading...
      </div>
    )
  }

  if (userProfile) return <Navigate to="/" replace />

  return (
    <div style={{ minHeight: '100svh', background: '#f8fafc', padding: 18 }}>
      <div style={{ maxWidth: 420, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <img src={logo} alt="Hum Honge Kamyaab" style={{ width: 56, height: 56 }} />
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>Hum Honge Kamyaab</div>
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            WhatsApp OTP login for parents
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16 }}>
          {step === 1 && (
            <>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                Sign in with WhatsApp
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
                Enter the WhatsApp number linked to your child.
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 16, color: '#64748b' }}>+91</span>
                <input
                  style={inputStyle}
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              {error ? (
                <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</div>
              ) : null}

              <button style={btnPrimary} onClick={handleSendOtp} disabled={loadingOtp}>
                {loadingOtp ? 'Sending...' : 'Send OTP'}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                Enter verification code
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
                We sent a 6-digit code to WhatsApp {maskPhone(phoneDigits)}.
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
                {otp.map((d, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    style={{ ...inputStyle, width: 46, padding: 0, textAlign: 'center' }}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !e.currentTarget.value && idx > 0) {
                        const inp = document.getElementById(`otp-${idx - 1}`)
                        if (inp) inp.focus()
                      }
                    }}
                  />
                ))}
              </div>

              {error ? (
                <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</div>
              ) : null}

              <button style={btnPrimary} onClick={handleVerifyOtp} disabled={loadingOtp || otpCode.length !== 6}>
                {loadingOtp ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <div style={{ marginTop: 10 }}>
                <button
                  style={btnSecondary}
                  onClick={() => {
                    setStep(1)
                    setOtp(['', '', '', '', '', ''])
                    setError('')
                    setResendCooldown(0)
                  }}
                  disabled={loadingOtp}
                >
                  Change number
                </button>

                <div style={{ marginTop: 8, fontSize: 13, color: '#64748b', textAlign: 'center' }}>
                  {resendCooldown > 0 ? (
                    <>Resend available in {resendCooldown}s</>
                  ) : (
                    <>To resend, go back and send OTP again</>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}


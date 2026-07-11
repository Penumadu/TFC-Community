'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Phone, ArrowRight, RotateCcw, ShieldCheck, UserCircle } from 'lucide-react'
import { auth, signInAnonymously } from '@/lib/firebase/client'
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/index'
import { useT } from '@/lib/i18n/LanguageContext'

type Step = 'phone' | 'otp'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/directory'
  const { t } = useT()

  const [step, setStep]           = useState<Step>('phone')
  const [phone, setPhone]         = useState('')
  const [otp, setOtp]             = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
  
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  // Setup Recaptcha once
  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      })
    }
  }, [])

  // Format phone to E.164 (+1XXXXXXXXXX)
  const formatPhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, '')
    if (digits.startsWith('1') && digits.length === 11) return `+${digits}`
    if (digits.length === 10) return `+1${digits}`
    return `+${digits}`
  }

  const isValidCanadianPhone = (raw: string): boolean => {
    const digits = raw.replace(/\D/g, '')
    if (digits.length === 10) return true
    if (digits.length === 11 && digits.startsWith('1')) return true
    return false
  }

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    if (!isValidCanadianPhone(phone)) {
      setError(t('auth.phone_error_invalid'))
      return
    }

    const formatted = formatPhone(phone)
    if (!formatted.startsWith('+1')) {
      setError(t('auth.phone_error_non_canadian'))
      return
    }

    setLoading(true)
    try {
      const appVerifier = window.recaptchaVerifier
      const confirmation = await signInWithPhoneNumber(auth, formatted, appVerifier)
      setConfirmationResult(confirmation)
      setStep('otp')
      setCountdown(60)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (otp.length !== 6) {
      setError('Please enter the 6-digit code sent to your phone.')
      return
    }

    setLoading(true)
    try {
      if (!confirmationResult) throw new Error('No OTP session found.')
      const result = await confirmationResult.confirm(otp)
      
      const idToken = await result.user.getIdToken()
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })

      router.push(redirectTo)
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Invalid code. Please check and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestLogin = async () => {
    setError(null)
    setLoading(true)
    try {
      const result = await signInAnonymously(auth)
      const idToken = await result.user.getIdToken()
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })

      router.push(redirectTo)
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to login as guest.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div id="recaptcha-container"></div>

      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-teal flex items-center justify-center shadow-glow-teal">
            <span className="text-white font-heading font-bold text-2xl">T</span>
          </div>
          <span className="font-heading font-bold text-text text-xl">TFC Community Portal</span>
        </Link>
      </div>

      {/* Card */}
      <div className="bg-surface rounded-xl shadow-elevated border border-gray-100 overflow-hidden">
        <div className="bg-gradient-teal px-6 py-5 text-white">
          <div className="flex items-center gap-3 mb-1">
            <ShieldCheck className="w-5 h-5 text-primary" aria-hidden="true" />
            <h1 className="font-heading font-bold text-xl">
              {step === 'phone' ? t('auth.login_title') : t('auth.verify_title')}
            </h1>
          </div>
          <p className="text-white/75 text-sm">
            {step === 'phone'
              ? t('auth.login_subtitle')
              : `${t('auth.otp_sent')} ${phone}`}
          </p>
        </div>

        <div className="px-6 py-6">
          <div className="flex items-start gap-2 bg-secondary/5 border border-secondary/15 rounded-md p-3 mb-5">
            <Badge variant="teal" className="mt-0.5 flex-shrink-0">Tier 1</Badge>
            <p className="text-xs text-text-muted">
              Sign-in is restricted to <strong>Canadian mobile numbers</strong>.
              This ensures only verified Halton/GTA community members can access the portal.
            </p>
          </div>

          {error && (
            <div role="alert" className="bg-danger/10 border border-danger/30 text-danger rounded-md px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          {step === 'phone' && (
            <form onSubmit={handleSendOtp} noValidate>
              <label htmlFor="phone" className="block text-sm font-semibold text-text mb-1.5">
                {t('auth.phone_label')}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
                <input
                  id="phone"
                  type="tel"
                  className="input pl-10"
                  placeholder={t('auth.phone_placeholder')}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  autoComplete="tel"
                  inputMode="tel"
                  required
                />
              </div>
              <p className="text-xs text-text-muted mt-2 mb-4">
                Canadian numbers only (+1). Example: (416) 555-0100
              </p>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Send Verification Code
              </Button>
              
              <div className="my-6 flex items-center gap-4 before:h-px before:flex-1 before:bg-gray-200 after:h-px after:flex-1 after:bg-gray-200">
                <span className="text-sm text-text-muted uppercase tracking-wider font-semibold">OR</span>
              </div>
              
              <Button
                type="button"
                variant="outline"
                fullWidth
                loading={loading}
                onClick={handleGuestLogin}
                rightIcon={<UserCircle className="w-4 h-4" />}
              >
                Continue as Guest
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} noValidate>
              <label htmlFor="otp" className="block text-sm font-semibold text-text mb-1.5">
                {t('auth.otp_label')}
              </label>
              <input
                id="otp"
                type="text"
                className="input text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="• • • • • •"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                disabled={otp.length !== 6}
                className="mt-4"
              >
                Verify & Sign In
              </Button>

              <div className="flex items-center justify-between mt-4 text-sm">
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setOtp(''); setError(null) }}
                  className="flex items-center gap-1 text-text-muted hover:text-text transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Change number
                </button>

                {countdown > 0 ? (
                  <span className="text-text-muted">
                    {t('auth.otp_resend_in')} {countdown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setError(null); handleSendOtp() }}
                    className="text-secondary hover:text-secondary-light font-medium transition-colors"
                  >
                    {t('auth.otp_resend')}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        <div className="px-6 pb-5 text-center">
          <p className="text-xs text-text-muted">
            By signing in, you agree to our community guidelines and privacy policy.
          </p>
        </div>
      </div>

      <p className="text-center text-sm text-text-muted mt-6">
        <Link href="/" className="text-secondary hover:text-secondary-light font-medium">
          ← Back to home
        </Link>
      </p>
    </div>
  )
}

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export default function LoginPage() {
  return (
    <main className="min-h-dvh bg-gradient-warm flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="animate-pulse text-text-muted">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  )
}

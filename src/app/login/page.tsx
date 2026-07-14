'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Phone, ArrowRight, RotateCcw, ShieldCheck, UserCircle, Mail, Key } from 'lucide-react'
import { auth, signInAnonymously } from '@/lib/firebase/client'
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/index'
import { useT } from '@/lib/i18n/LanguageContext'

type Step = 'main' | 'phone' | 'otp' | 'email' | 'register'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/directory'
  const { t } = useT()

  const [step, setStep]           = useState<Step>('main')
  const [phone, setPhone]         = useState('')
  const [otp, setOtp]             = useState('')
  
  // Email states
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')

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
    const digits = raw.replace(/\\D/g, '')
    if (digits.startsWith('1') && digits.length === 11) return `+${digits}`
    if (digits.length === 10) return `+1${digits}`
    return `+${digits}`
  }

  const isValidCanadianPhone = (raw: string): boolean => {
    const digits = raw.replace(/\\D/g, '')
    if (digits.length === 10) return true
    if (digits.length === 11 && digits.startsWith('1')) return true
    return false
  }

  const createSession = async (idToken: string) => {
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    })
    router.push(redirectTo)
    router.refresh()
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
      await createSession(idToken)
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
      await createSession(idToken)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to login as guest.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const idToken = await result.user.getIdToken()
      await createSession(idToken)
    } catch (err: any) {
      console.error(err)
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Failed to login with Google.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const idToken = await result.user.getIdToken()
      await createSession(idToken)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      const idToken = await result.user.getIdToken()
      await createSession(idToken)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to register account.')
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
              {step === 'otp' ? t('auth.verify_title') : 'Sign In'}
            </h1>
          </div>
          <p className="text-white/75 text-sm">
            {step === 'otp'
              ? `${t('auth.otp_sent')} ${phone}`
              : 'Join the Halton & GTA Telugu community'}
          </p>
        </div>

        <div className="px-6 py-6">
          {error && (
            <div role="alert" className="bg-danger/10 border border-danger/30 text-danger rounded-md px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          {step === 'main' && (
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                fullWidth
                loading={loading}
                onClick={handleGoogleLogin}
                className="bg-white border-gray-200 text-text hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>

              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => setStep('email')}
                leftIcon={<Mail className="w-5 h-5" />}
              >
                Continue with Email
              </Button>

              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => setStep('phone')}
                leftIcon={<Phone className="w-5 h-5" />}
              >
                Continue with Phone
              </Button>

              <div className="my-6 flex items-center gap-4 before:h-px before:flex-1 before:bg-gray-200 after:h-px after:flex-1 after:bg-gray-200">
                <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">OR</span>
              </div>
              
              <Button
                type="button"
                variant="outline"
                fullWidth
                loading={loading}
                onClick={handleGuestLogin}
                rightIcon={<UserCircle className="w-4 h-4" />}
                className="border-primary/30 text-primary hover:bg-primary/5"
              >
                Continue as Guest
              </Button>
            </div>
          )}

          {step === 'phone' && (
            <form onSubmit={handleSendOtp} noValidate>
              <div className="flex items-start gap-2 bg-secondary/5 border border-secondary/15 rounded-md p-3 mb-5">
                <Badge variant="teal" className="mt-0.5 flex-shrink-0">Tier 1</Badge>
                <p className="text-xs text-text-muted">
                  Sign-in is restricted to <strong>Canadian mobile numbers</strong> for enhanced community security.
                </p>
              </div>

              <label htmlFor="phone" className="block text-sm font-semibold text-text mb-1.5">
                {t('auth.phone_label')}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
                <input
                  id="phone"
                  type="tel"
                  className="input pl-10 w-full"
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

              <button
                type="button"
                onClick={() => { setStep('main'); setError(null) }}
                className="mt-4 text-sm text-text-muted hover:text-text mx-auto block"
              >
                ← Back to options
              </button>
            </form>
          )}

          {(step === 'email' || step === 'register') && (
            <form onSubmit={step === 'email' ? handleEmailLogin : handleEmailRegister} noValidate>
              <div className="space-y-4 mb-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-text mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
                    <input
                      id="email"
                      type="email"
                      className="input pl-10 w-full"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-text mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
                    <input
                      id="password"
                      type="password"
                      className="input pl-10 w-full"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
              >
                {step === 'email' ? 'Sign In' : 'Create Account'}
              </Button>

              <div className="flex flex-col gap-2 mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setStep(step === 'email' ? 'register' : 'email'); setError(null) }}
                  className="text-sm text-secondary hover:text-secondary-light"
                >
                  {step === 'email' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('main'); setError(null) }}
                  className="text-sm text-text-muted hover:text-text"
                >
                  ← Back to options
                </button>
              </div>
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
                className="input text-center text-2xl tracking-[0.5em] font-mono w-full"
                placeholder="• • • • • •"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\\D/g, '').slice(0, 6))}
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

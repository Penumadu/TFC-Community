'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { auth } from '@/lib/firebase/client'
import { signOut } from 'firebase/auth'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import Button from '@/components/ui/Button'
import {
  Menu,
  X,
  Users,
  Building2,
  Baby,
  Clock,
  LogIn,
  User,
  Globe,
  AlertTriangle,
  ChevronDown,
  ShieldAlert,
  LogOut,
} from 'lucide-react'

const navItems = [
  { key: 'directory', href: '/directory', icon: Users },
  { key: 'venues',    href: '/venues',    icon: Building2 },
  { key: 'childcare', href: '/childcare', icon: Baby },
  { key: 'coop',      href: '/coop',      icon: Clock },
]

interface HeaderProps {
  isAuthenticated?: boolean
  userDisplayName?: string
  isAdmin?: boolean
}

export default function Header({ isAuthenticated = false, userDisplayName, isAdmin = false }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { locale, dict, toggleLanguage, isLoading: langLoading } = useLanguage()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled]     = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut(auth)
      await fetch('/api/auth/session', { method: 'DELETE' })
      router.push('/login')
      router.refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Scroll shadow effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  const t = (key: string) => {
    const keys = key.split('.')
    let v: unknown = dict
    for (const k of keys) {
      if (v && typeof v === 'object' && k in (v as object))
        v = (v as Record<string, unknown>)[k]
      else return key
    }
    return typeof v === 'string' ? v : key
  }

  return (
    <header
      className={clsx(
        'sticky top-0 z-50 safe-top transition-all duration-300',
        scrolled
          ? 'bg-surface/95 backdrop-blur-md border-b border-gray-100 shadow-sm'
          : 'bg-surface border-b border-gray-100'
      )}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ───────────────────────────────────────────────── */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
            aria-label="TFC Community Portal – Home"
          >
            <div
              className="w-9 h-9 rounded-lg bg-gradient-teal flex items-center justify-center
                         shadow-sm group-hover:shadow-glow-teal transition-shadow duration-300"
              aria-hidden="true"
            >
              <span className="text-white font-heading font-bold text-lg leading-none">T</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-heading font-bold text-text text-lg leading-tight">
                TFC
              </span>
              <span className="block text-xs text-text-muted leading-tight -mt-0.5">
                Community Portal
              </span>
            </div>
          </Link>

          {/* ── Desktop Nav ─────────────────────────────────────────── */}
          <nav
            className="hidden md:flex items-center gap-1"
            role="navigation"
            aria-label="Main navigation"
          >
            {navItems.map(({ key, href, icon: Icon }) => {
              const active = pathname?.startsWith(href)
              return (
                <Link
                  key={key}
                  href={href}
                  className={clsx(
                    'flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-secondary/10 text-secondary font-semibold'
                      : 'text-text-muted hover:text-text hover:bg-surface-muted'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {t(`nav.${key}`)}
                </Link>
              )
            })}
          </nav>

          {/* ── Right Controls ───────────────────────────────────────── */}
          <div className="flex items-center gap-2">

            {/* Language Toggle — permanent 1-click as required */}
            <button
              onClick={toggleLanguage}
              disabled={langLoading}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold',
                'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                locale === 'te'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-secondary border-secondary hover:bg-secondary/5',
                langLoading && 'opacity-60 cursor-wait'
              )}
              aria-label={locale === 'en' ? 'Switch to Telugu' : 'తెలుగు నుండి English కి మారండి'}
              title={locale === 'en' ? 'తెలుగుకు మారు' : 'Switch to English'}
            >
              <Globe className="w-3.5 h-3.5" aria-hidden="true" />
              <span aria-hidden="true">{locale === 'en' ? 'తె' : 'EN'}</span>
            </button>

            {/* Emergency Help */}
            <Link
              href="/directory?filter=emergency"
              className={clsx(
                'hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                'bg-danger/10 text-danger border border-danger/30 text-xs font-bold',
                'hover:bg-danger/20 transition-colors duration-200',
                'animate-pulse-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger'
              )}
              aria-label="Emergency help — find available tradespeople now"
            >
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden lg:block">
                {t('nav.emergency')}
              </span>
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Link href="/admin">
                    <button
                      className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10
                                 text-primary text-sm font-semibold hover:bg-primary/20
                                 transition-colors duration-200 focus-visible:outline-none"
                    >
                      <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                      <span>Admin</span>
                    </button>
                  </Link>
                )}
                <Link href="/profile">
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/10
                               text-secondary text-sm font-semibold hover:bg-secondary/20
                               transition-colors duration-200 focus-visible:outline-none
                               focus-visible:ring-2 focus-visible:ring-secondary"
                  >
                    <User className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden sm:block max-w-[100px] truncate">
                      {userDisplayName || t('nav.profile')}
                    </span>
                  </button>
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-danger/10
                             text-danger text-sm font-semibold hover:bg-danger/20
                             transition-colors duration-200 focus-visible:outline-none
                             focus-visible:ring-2 focus-visible:ring-danger disabled:opacity-50"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="primary" size="sm" leftIcon={<LogIn className="w-4 h-4" />}>
                  {t('nav.login')}
                </Button>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden p-2 rounded-md text-text-muted hover:text-text hover:bg-surface-muted
                         transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ─────────────────────────────────────────────────────── */}
      <div
        id="mobile-nav"
        role="navigation"
        aria-label="Mobile navigation"
        className={clsx(
          'md:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-gray-100',
          mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-4 py-3 space-y-1 bg-surface safe-bottom">
          {navItems.map(({ key, href, icon: Icon }) => {
            const active = pathname?.startsWith(href)
            return (
              <Link
                key={key}
                href={href}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-md text-[17px] font-medium transition-colors',
                  active
                    ? 'bg-secondary/10 text-secondary font-semibold'
                    : 'text-text hover:bg-surface-muted'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                {t(`nav.${key}`)}
              </Link>
            )
          })}
          <Link
            href="/directory?filter=emergency"
            className="flex items-center gap-3 px-4 py-3 rounded-md text-[17px] font-bold text-danger hover:bg-danger/5 transition-colors"
          >
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            {t('nav.emergency')}
          </Link>
        </div>
      </div>
    </header>
  )
}

import Link from 'next/link'
import { Users, Building2, Baby, Clock, Star, ShieldCheck, Globe, Zap, ArrowRight, CheckCircle } from 'lucide-react'
import Header from '@/components/layout/Header'
import Button from '@/components/ui/Button'
import { Card, Badge } from '@/components/ui/index'
import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebase/server'
import { db } from '@/lib/firebase/client'
import { collection, query, where, getCountFromServer } from 'firebase/firestore'

export default async function HomePage() {
  const sessionCookie = (await cookies()).get('session')?.value || ''
  let user = null;
  if (sessionCookie) {
    user = { uid: sessionCookie }
  }

  // Fetch stats for display
  const [
    profilesCount,
    tradespeopleCount,
    venuesCount,
  ] = await Promise.all([
    getCountFromServer(collection(db, 'profiles')),
    getCountFromServer(query(collection(db, 'tradespeople'), where('is_active', '==', true))),
    getCountFromServer(query(collection(db, 'venues'), where('is_active', '==', true), where('admin_verified', '==', true))),
  ])

  const memberCount = profilesCount.data().count
  const tradespersonCount = tradespeopleCount.data().count
  const venueCount = venuesCount.data().count


  return (
    <>
      <Header isAuthenticated={!!user} />

      <main id="main-content">

        {/* ── HERO ──────────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden bg-gradient-hero text-white"
          aria-labelledby="hero-heading"
        >
          {/* Decorative background elements */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/10 blur-3xl translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-secondary-light/20 blur-2xl -translate-x-1/4 translate-y-1/4" />
            {/* Subtle marigold pattern */}
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, #F5A623 1px, transparent 0)`,
                backgroundSize: '32px 32px',
              }}
            />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 lg:py-36">
            <div className="max-w-3xl">
              {/* Pre-heading badge */}
              <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary-light rounded-full px-4 py-1.5 text-sm font-semibold mb-6 animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
                Serving Halton Region & GTA Telugu Community
              </div>

              <h1
                id="hero-heading"
                className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-fade-in"
                style={{ animationDelay: '0.1s' }}
              >
                Your Telugu{' '}
                <span className="text-primary relative">
                  Community Hub
                  <span
                    className="absolute inset-x-0 -bottom-1 h-0.5 bg-primary/60 rounded-full"
                    aria-hidden="true"
                  />
                </span>
              </h1>

              <p
                className="text-lg sm:text-xl text-white/80 leading-relaxed mb-10 max-w-2xl animate-fade-in"
                style={{ animationDelay: '0.2s' }}
              >
                Connect with trusted Telugu-speaking tradespeople, find culturally-aware community
                venues, and coordinate childcare — all within a{' '}
                <strong className="text-white">secure, verified</strong> community network
                in Milton, Oakville, Burlington & across the GTA.
              </p>

              <div
                className="flex flex-wrap gap-4 animate-fade-in"
                style={{ animationDelay: '0.3s' }}
              >
                <Link href="/directory">
                  <Button
                    size="lg"
                    variant="primary"
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                    className="shadow-glow"
                  >
                    Find a Tradesperson
                  </Button>
                </Link>
                <Link href="/venues">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/40 text-white hover:bg-white/10 hover:border-white/60"
                  >
                    Browse Venues
                  </Button>
                </Link>
              </div>

              {/* Trust signals */}
              <div
                className="flex flex-wrap gap-5 mt-10 text-sm text-white/70 animate-fade-in"
                style={{ animationDelay: '0.4s' }}
              >
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-primary" aria-hidden="true" />
                  Canadian phone-verified members only
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-primary" aria-hidden="true" />
                  HRPS Vulnerable Sector Check for childcare
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-primary" aria-hidden="true" />
                  Two-way encrypted contact sharing
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS BAR ────────────────────────────────────────────── */}
        <section className="bg-secondary text-white py-8" aria-label="Community statistics">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { value: memberCount ?? '—', label: 'Community Members' },
                { value: tradespersonCount ?? '—', label: 'Trusted Tradespeople' },
                { value: venueCount ?? '—', label: 'Verified Venues' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <div className="text-2xl sm:text-3xl font-heading font-bold text-primary">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </div>
                  <div className="text-xs sm:text-sm text-white/70 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── MODULES GRID ─────────────────────────────────────────── */}
        <section className="py-16 md:py-24 bg-bg" aria-labelledby="modules-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 id="modules-heading" className="section-title">
                Everything Your Community Needs
              </h2>
              <p className="section-subtitle max-w-2xl mx-auto mt-3">
                Purpose-built for Telugu families in Halton — culturally aware, privacy-first, community-trusted.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {modules.map((mod) => (
                <Link key={mod.href} href={mod.href} className="group">
                  <Card
                    hover
                    className="h-full p-6 transition-all duration-300 group-hover:border-primary/30"
                    as="article"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${mod.iconBg}`}
                      aria-hidden="true"
                    >
                      <mod.icon className={`w-6 h-6 ${mod.iconColor}`} />
                    </div>
                    <h3 className="font-heading font-bold text-lg text-text mb-2 group-hover:text-secondary transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-text-muted text-sm leading-relaxed mb-4">
                      {mod.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {mod.badges.map((badge) => (
                        <Badge key={badge.text} variant={badge.variant as 'gold' | 'teal' | 'green' | 'orange'}>
                          {badge.text}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── CIRCLE OF TRUST ──────────────────────────────────────── */}
        <section className="py-16 md:py-24 bg-gradient-warm" aria-labelledby="trust-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge variant="teal" icon={<ShieldCheck className="w-3 h-3" />} className="mb-4">
                  Circle of Trust
                </Badge>
                <h2 id="trust-heading" className="section-title mb-4">
                  Three Tiers of Verified Safety
                </h2>
                <p className="text-text-muted leading-relaxed mb-8">
                  Every member goes through a verified onboarding process designed specifically
                  to protect families — especially children.
                </p>
                <div className="space-y-4">
                  {tiers.map((tier) => (
                    <div
                      key={tier.label}
                      className="flex gap-4 p-4 bg-surface rounded-lg border border-gray-100 shadow-card"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${tier.color}`}
                        aria-hidden="true"
                      >
                        {tier.num}
                      </div>
                      <div>
                        <div className="font-semibold text-text">{tier.label}</div>
                        <div className="text-sm text-text-muted mt-0.5">{tier.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="card-elevated p-8 bg-gradient-card">
                  <h3 className="font-heading font-bold text-xl text-text mb-6">
                    Privacy-First Design
                  </h3>
                  <ul className="space-y-4">
                    {privacyFeatures.map((f) => (
                      <li key={f.title} className="flex gap-3">
                        <div
                          className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-0.5"
                          aria-hidden="true"
                        >
                          <f.icon className="w-4 h-4 text-secondary" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-text">{f.title}</div>
                          <div className="text-xs text-text-muted mt-0.5">{f.description}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <section className="py-16 bg-primary" aria-labelledby="cta-heading">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 id="cta-heading" className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
              Join Your Telugu Community Today
            </h2>
            <p className="text-white/80 text-lg mb-8">
              Verify your Canadian mobile number and start connecting with trusted families in Halton.
            </p>
            <Link href="/login">
              <Button
                size="lg"
                variant="secondary"
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="bg-white text-secondary hover:bg-white/90"
              >
                Sign Up — Free, Secure, Private
              </Button>
            </Link>
          </div>
        </section>

      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="bg-secondary text-white/70 py-10" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
            <div className="font-heading font-bold text-white text-base">
              TFC Community Portal
            </div>
            <div>
              Serving Telugu families in{' '}
              <span className="text-primary font-medium">Milton · Oakville · Burlington · Halton Hills</span>
            </div>
            <div>© {new Date().getFullYear()} TFC Community Portal</div>
          </div>
        </div>
      </footer>
    </>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const modules = [
  {
    href: '/directory',
    icon: Users,
    iconBg: 'bg-secondary/10',
    iconColor: 'text-secondary',
    title: 'Tradesperson Directory',
    description:
      'Find Telugu-speaking plumbers, electricians, HVAC pros and more in Halton with star ratings, community vouching, and pro-tips on local pricing.',
    badges: [
      { text: 'Speaks Telugu', variant: 'teal' },
      { text: 'Emergency 24/7', variant: 'orange' },
    ],
  },
  {
    href: '/venues',
    icon: Building2,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary-dark',
    title: 'Venues & Halls',
    description:
      'Browse community halls, school auditoriums, and banquet spaces with capacity, South Asian catering rules, and vegetarian kitchen availability.',
    badges: [
      { text: 'Ext. Catering OK', variant: 'green' },
      { text: 'Veg Kitchen', variant: 'teal' },
    ],
  },
  {
    href: '/childcare',
    icon: Baby,
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    title: 'Trusted Childcare',
    description:
      'VSC-verified sitters, community aunties, and students — filtered by language, pure vegetarian household, and peanut-free homes.',
    badges: [
      { text: 'VSC Verified', variant: 'gold' },
      { text: 'Pure Veg Option', variant: 'green' },
    ],
  },
  {
    href: '/coop',
    icon: Clock,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary-dark',
    title: 'Time Banking',
    description:
      'Trade childcare hours with trusted parents in your neighbourhood. Log 3 hours hosting → earn 3 hours of care in return.',
    badges: [
      { text: 'Co-op Model', variant: 'teal' },
      { text: 'School Buddy', variant: 'orange' },
    ],
  },
]

const tiers = [
  {
    num: '1',
    color: 'bg-secondary',
    label: 'Tier 1 — Verified Member',
    description: 'Canadian mobile number verified via SMS OTP. Can browse all directories.',
  },
  {
    num: '2',
    color: 'bg-primary-dark',
    label: 'Tier 2 — Community Poster',
    description: 'Requires 2 peer vouches from established members. Unlocks posting and reviews.',
  },
  {
    num: '3',
    color: 'bg-success',
    label: 'Tier 3 — VSC Verified',
    description: 'HRPS Vulnerable Sector Check uploaded and admin-approved. Required for childcare.',
  },
]

const privacyFeatures = [
  {
    icon: Globe,
    title: 'Fuzzy Location Circles',
    description: 'Your exact address is never shown. A 300–500m radius circle displays your approximate area.',
  },
  {
    icon: Zap,
    title: 'Two-Way Handshake',
    description: 'Contact details are only revealed after BOTH parties click "Accept" — never one-sided.',
  },
  {
    icon: ShieldCheck,
    title: 'Encrypted VSC Storage',
    description: 'Police check PDFs are encrypted at rest. Only a gold ✓ badge displays publicly.',
  },
  {
    icon: Star,
    title: 'No Children\'s Names',
    description: 'Children\'s names, ages, and home addresses are never stored or displayed anywhere.',
  },
]

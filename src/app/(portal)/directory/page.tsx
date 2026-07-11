import { Suspense } from 'react'
import { db } from '@/lib/firebase/client'
import { collection, query, where, getDocs, limit, getDoc, doc, orderBy } from 'firebase/firestore'
import { Search, SlidersHorizontal, Star, Zap, Users, Globe } from 'lucide-react'
import Link from 'next/link'
import { Badge, Card, Skeleton, StarRating, StatusDot, VouchedBadge } from '@/components/ui/index'

export const metadata = {
  title: 'Tradesperson Directory',
  description: 'Find trusted Telugu-speaking tradespeople in Halton Region & GTA',
}

// Server component — read search params from URL
interface DirectoryPageProps {
  searchParams: Promise<{
    category?: string
    telugu?: string
    emergency?: string
    vouched?: string
    town?: string
    q?: string
    filter?: string
  }>
}

const CATEGORIES = [
  { value: '', label: 'All Trades' },
  { value: 'plumber', label: 'Plumber' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'carpenter', label: 'Carpenter' },
  { value: 'painter', label: 'Painter' },
  { value: 'landscaper', label: 'Landscaper' },
  { value: 'cleaner', label: 'Cleaner' },
  { value: 'mover', label: 'Mover' },
  { value: 'handyman', label: 'Handyman' },
  { value: 'appliance_repair', label: 'Appliance Repair' },
  { value: 'locksmith', label: 'Locksmith' },
  { value: 'pest_control', label: 'Pest Control' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'other', label: 'Other' },
]

const TOWNS = [
  { value: '', label: 'All Halton' },
  { value: 'Milton', label: 'Milton' },
  { value: 'Oakville', label: 'Oakville' },
  { value: 'Burlington', label: 'Burlington' },
  { value: 'Halton Hills', label: 'Halton Hills' },
  { value: 'GTA-Other', label: 'Greater GTA' },
]

export default async function DirectoryPage({ searchParams }: DirectoryPageProps) {
  const params = await searchParams

  const constraints: any[] = [where('is_active', '==', true)]
  
  if (params.category) constraints.push(where('category', '==', params.category))
  if (params.telugu === 'true') constraints.push(where('speaks_telugu', '==', true))
  if (params.emergency === 'true' || params.filter === 'emergency') constraints.push(where('emergency_24_7', '==', true))
  if (params.vouched === 'true') constraints.push(where('community_vouched', '==', true))
  
  constraints.push(limit(48))

  const q = query(collection(db, 'tradespeople'), ...constraints)
  const snapshot = await getDocs(q)
  let tradespeople = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any))
  
  // Manual join with profiles
  await Promise.all(tradespeople.map(async (t) => {
    if (t.profile_id) {
      const pDoc = await getDoc(doc(db, 'profiles', t.profile_id))
      t.profiles = pDoc.exists() ? pDoc.data() : {
        display_name: 'Unknown',
        availability: 'offline'
      }
    } else {
      t.profiles = { display_name: 'Unknown', availability: 'offline' }
    }
  }))

  // Filter by town if provided (since we can't join in Firestore easily)
  if (params.town) {
    tradespeople = tradespeople.filter(t => t.profiles?.halton_town === params.town)
  }
  
  tradespeople.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
  const error = null

  // Fetch pro-tips for the selected category
  let proTips: any[] | null = null;
  if (params.category) {
    const ptQ = query(
      collection(db, 'pro_tips'),
      where('category', '==', params.category),
      where('is_active', '==', true),
      orderBy('sort_order'),
      limit(3)
    )
    const ptSnap = await getDocs(ptQ)
    proTips = ptSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="section-title flex items-center gap-3">
          <Users className="w-7 h-7 text-secondary" aria-hidden="true" />
          Tradesperson Directory
        </h1>
        <p className="section-subtitle">
          Find trusted Telugu-speaking professionals in Halton Region & GTA
        </p>
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-xl border border-gray-100 shadow-card p-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal className="w-4 h-4 text-secondary" aria-hidden="true" />
          <span className="font-semibold text-text text-sm">Filter & Search</span>
        </div>

        <form method="GET" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" role="search">

          {/* Search */}
          <div className="sm:col-span-2 lg:col-span-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
            <input
              type="search"
              name="q"
              defaultValue={params.q}
              placeholder="Search..."
              className="input pl-9 text-base"
              aria-label="Search tradespeople"
            />
          </div>

          {/* Category */}
          <select
            name="category"
            defaultValue={params.category ?? ''}
            className="input"
            aria-label="Filter by trade category"
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {/* Town */}
          <select
            name="town"
            defaultValue={params.town ?? ''}
            className="input"
            aria-label="Filter by Halton town"
          >
            {TOWNS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* Toggle filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <label className="flex items-center gap-2 cursor-pointer select-none" title="Speaks Telugu">
              <input
                type="checkbox"
                name="telugu"
                value="true"
                defaultChecked={params.telugu === 'true'}
                className="w-4 h-4 accent-secondary rounded"
              />
              <Globe className="w-3.5 h-3.5 text-secondary" aria-hidden="true" />
              <span className="text-sm font-medium text-text">Telugu</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none" title="Emergency 24/7">
              <input
                type="checkbox"
                name="emergency"
                value="true"
                defaultChecked={params.emergency === 'true' || params.filter === 'emergency'}
                className="w-4 h-4 accent-danger rounded"
              />
              <Zap className="w-3.5 h-3.5 text-danger" aria-hidden="true" />
              <span className="text-sm font-medium text-text">24/7</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none" title="Community Vouched">
              <input
                type="checkbox"
                name="vouched"
                value="true"
                defaultChecked={params.vouched === 'true'}
                className="w-4 h-4 accent-success rounded"
              />
              <Star className="w-3.5 h-3.5 text-success" aria-hidden="true" />
              <span className="text-sm font-medium text-text">Vouched</span>
            </label>
          </div>

          <button type="submit" className="btn-secondary">
            <Search className="w-4 h-4" aria-hidden="true" />
            Search
          </button>
        </form>
      </div>

      {/* Pro-Tips (inline contextual cards) */}
      {proTips && proTips.length > 0 && (
        <section className="mb-8" aria-labelledby="pro-tips-heading">
          <h2 id="pro-tips-heading" className="text-base font-bold text-secondary mb-3 flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">💡</span>
            GTA Pro-Tips for {CATEGORIES.find(c => c.value === params.category)?.label ?? ''}
          </h2>
          <div className="space-y-2">
            {proTips.map(tip => (
              <ProTipCard key={tip.id} tip={tip} />
            ))}
          </div>
        </section>
      )}

      {/* Results */}
      <Suspense fallback={<DirectorySkeletons />}>
        {error ? (
          <div role="alert" className="text-center py-16 text-danger">
            Error loading directory. Please refresh and try again.
          </div>
        ) : !tradespeople || tradespeople.length === 0 ? (
          <EmptyState />
        ) : (
          <div>
            <p className="text-sm text-text-muted mb-4">
              {tradespeople.length} result{tradespeople.length !== 1 ? 's' : ''} found
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Tradesperson listings">
              {tradespeople.map((t) => (
                <TradespersonCard key={t.id} tradesperson={t as unknown as TradespersonWithProfile} />
              ))}
            </div>
          </div>
        )}
      </Suspense>
    </div>
  )
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface TradespersonWithProfile {
  id: string
  business_name: string | null
  category: string
  speaks_telugu: boolean
  emergency_24_7: boolean
  community_vouched: boolean
  avg_rating: number
  total_reviews: number
  description: string | null
  diagnostic_fee: number | null
  hourly_rate: number | null
  profiles: {
    id: string
    display_name: string
    location_label: string | null
    halton_town: string | null
    avatar_url: string | null
    availability: string
  }
}

// ── Tradesperson Card ──────────────────────────────────────────────────────────
function TradespersonCard({ tradesperson: t }: { tradesperson: TradespersonWithProfile }) {
  const profile = t.profiles
  const categoryLabel = CATEGORIES.find(c => c.value === t.category)?.label ?? t.category

  return (
    <article role="listitem">
      <Link href={`/directory/${t.id}`} className="block group">
        <Card hover className="p-5 h-full">

          {/* Header row */}
          <div className="flex items-start gap-3 mb-3">
            {/* Avatar */}
            <div
              className="w-12 h-12 rounded-xl bg-gradient-teal flex items-center justify-center flex-shrink-0 text-white font-heading font-bold text-lg"
              aria-hidden="true"
            >
              {profile.display_name[0]?.toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-bold text-text group-hover:text-secondary transition-colors truncate">
                  {t.business_name || profile.display_name}
                </h3>
                <StatusDot status={profile.availability as 'available' | 'emergency_available' | 'busy' | 'offline'} />
              </div>
              <div className="text-sm text-text-muted">{categoryLabel}</div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {t.speaks_telugu && (
              <Badge variant="teal" icon={<Globe className="w-3 h-3" />}>Speaks Telugu</Badge>
            )}
            {t.emergency_24_7 && (
              <Badge variant="orange" icon={<Zap className="w-3 h-3" />}>Emergency 24/7</Badge>
            )}
            {t.community_vouched && <VouchedBadge />}
          </div>

          {/* Rating */}
          {t.total_reviews > 0 && (
            <StarRating
              rating={t.avg_rating}
              reviewCount={t.total_reviews}
              size="sm"
              className="mb-3"
            />
          )}

          {/* Description snippet */}
          {t.description && (
            <p className="text-sm text-text-muted line-clamp-2 mb-3">{t.description}</p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 text-xs text-text-muted">
            <span>{profile.location_label || profile.halton_town || 'Halton Region'}</span>
            {t.diagnostic_fee && (
              <span className="font-medium text-text">
                From ${t.diagnostic_fee}
              </span>
            )}
          </div>
        </Card>
      </Link>
    </article>
  )
}

// ── Pro-Tip Card ───────────────────────────────────────────────────────────────
function ProTipCard({ tip }: { tip: { id: string; title_en: string; body_en: string; tip_type: string | null; gta_avg_rate: number | null } }) {
  const tipTypeLabel: Record<string, string> = {
    market_rate: '💰 Market Rate',
    interview_question: '❓ Ask This',
    bargaining_strategy: '🤝 Bargaining Tip',
    compliance: '⚠️ Compliance',
    general: '💡 Pro Tip',
  }

  return (
    <details className="group bg-primary/5 border border-primary/20 rounded-lg overflow-hidden">
      <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none select-none hover:bg-primary/10 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-primary-dark bg-primary/15 px-2 py-0.5 rounded-full">
            {tipTypeLabel[tip.tip_type ?? 'general'] ?? '💡 Pro Tip'}
          </span>
          <span className="font-semibold text-text text-sm">{tip.title_en}</span>
          {tip.gta_avg_rate && (
            <span className="text-xs text-text-muted ml-1">~${tip.gta_avg_rate}</span>
          )}
        </div>
        <span className="text-text-muted text-xs group-open:rotate-180 transition-transform" aria-hidden="true">▼</span>
      </summary>
      <div className="px-4 pb-4 pt-2 text-sm text-text-muted whitespace-pre-line leading-relaxed border-t border-primary/10">
        {tip.body_en}
      </div>
    </details>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function DirectorySkeletons() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading...">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-surface rounded-card border border-gray-100 p-5 shadow-card">
          <div className="flex gap-3 mb-3">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton lines={3} className="mb-3" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <Users className="w-8 h-8 text-gray-400" aria-hidden="true" />
      </div>
      <h2 className="font-heading font-bold text-xl text-text mb-2">No Results Found</h2>
      <p className="text-text-muted mb-6">
        Try adjusting your filters or broadening your search area.
      </p>
      <Link href="/directory" className="btn-outline inline-flex">
        Clear Filters
      </Link>
    </div>
  )
}

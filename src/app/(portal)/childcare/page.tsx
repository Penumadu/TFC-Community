import { Suspense } from 'react'
import { db } from '@/lib/firebase/client'
import { collection, query, where, getDocs, limit, getDoc, doc } from 'firebase/firestore'
import { Search, SlidersHorizontal, ShieldCheck, Heart, Baby, Clock, Phone, Plus } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { Badge, Card, Skeleton, StarRating, StatusDot } from '@/components/ui/index'

export const metadata = {
  title: 'Childcare Network',
  description: 'Find trusted, VSC-verified childcare providers in your community',
}

interface ChildcarePageProps {
  searchParams: Promise<{
    type?: string
    vsc?: string
    veg?: string
    peanut?: string
    cpr?: string
    emergency?: string
    q?: string
  }>
}

const PROVIDER_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'babysitter', label: 'Babysitter' },
  { value: 'nanny', label: 'Nanny' },
  { value: 'auntie', label: 'Auntie (Elders)' },
  { value: 'student', label: 'Student' },
  { value: 'co_op_parent', label: 'Co-op Parent' },
]

export default async function ChildcarePage({ searchParams }: ChildcarePageProps) {
  const params = await searchParams
  
  const constraints: any[] = [where('is_active', '==', true)]

  if (params.type) constraints.push(where('provider_type', '==', params.type))
  if (params.vsc === 'true') constraints.push(where('vsc_verified', '==', true))
  if (params.veg === 'true') constraints.push(where('pure_vegetarian', '==', true))
  if (params.peanut === 'true') constraints.push(where('peanut_free', '==', true))
  if (params.cpr === 'true') constraints.push(where('cpr_certified', '==', true))
  if (params.emergency === 'true') constraints.push(where('emergency_available', '==', true))
  
  constraints.push(limit(48))

  const q = query(collection(db, 'childcare_providers'), ...constraints)
  const snapshot = await getDocs(q)
  let providers = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any))
  
  // Manual join with profiles
  await Promise.all(providers.map(async (p) => {
    if (p.profile_id) {
      const pDoc = await getDoc(doc(db, 'profiles', p.profile_id))
      p.profiles = pDoc.exists() ? pDoc.data() : {
        display_name: 'Unknown',
        availability: 'offline'
      }
    } else {
      p.profiles = { display_name: 'Unknown', availability: 'offline' }
    }
  }))

  providers.sort((a, b) => {
    if (a.vsc_verified !== b.vsc_verified) return b.vsc_verified ? 1 : -1;
    return (b.avg_rating || 0) - (a.avg_rating || 0)
  })
  const error = null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Page header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title flex items-center gap-3">
            <Baby className="w-7 h-7 text-secondary" aria-hidden="true" />
            Childcare Network
          </h1>
          <p className="section-subtitle">
            Find trusted, VSC-verified babysitters, nannies, and community aunties.
          </p>
        </div>
        <Link href="/childcare/new">
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            List as Provider
          </Button>
        </Link>
      </div>

      {/* Safety Banner */}
      <div className="bg-success-light border border-success/20 rounded-xl p-4 mb-8 flex items-start gap-3">
        <ShieldCheck className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-success-dark">VSC Verification (Tier 3)</h3>
          <p className="text-sm text-text-muted mt-1">
            Providers with the <strong className="text-text">VSC Verified</strong> badge have submitted a valid Vulnerable Sector Check to the portal administrators. We strongly recommend choosing verified providers for your peace of mind.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-xl border border-gray-100 shadow-card p-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal className="w-4 h-4 text-secondary" aria-hidden="true" />
          <span className="font-semibold text-text text-sm">Filter Providers</span>
        </div>

        <form method="GET" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="search">
          
          {/* Search */}
          <div className="sm:col-span-2 lg:col-span-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
            <input
              type="search"
              name="q"
              defaultValue={params.q}
              placeholder="Search..."
              className="input pl-9 text-base"
              aria-label="Search providers"
            />
          </div>

          {/* Type */}
          <select
            name="type"
            defaultValue={params.type ?? ''}
            className="input"
            aria-label="Filter by provider type"
          >
            {PROVIDER_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* Core Toggles */}
          <div className="sm:col-span-2 lg:col-span-2 flex flex-wrap gap-4 items-center pl-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="vsc"
                value="true"
                defaultChecked={params.vsc === 'true'}
                className="w-4 h-4 accent-success rounded"
              />
              <ShieldCheck className="w-3.5 h-3.5 text-success" aria-hidden="true" />
              <span className="text-sm font-medium text-text">VSC Verified</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="veg"
                value="true"
                defaultChecked={params.veg === 'true'}
                className="w-4 h-4 accent-secondary rounded"
              />
              <span className="text-sm font-medium text-text">Pure Veg</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="peanut"
                value="true"
                defaultChecked={params.peanut === 'true'}
                className="w-4 h-4 accent-warning rounded"
              />
              <span className="text-sm font-medium text-text">Peanut-Free</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="cpr"
                value="true"
                defaultChecked={params.cpr === 'true'}
                className="w-4 h-4 accent-primary rounded"
              />
              <Heart className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              <span className="text-sm font-medium text-text">CPR/First Aid</span>
            </label>
          </div>

          <button type="submit" className="btn-secondary sm:col-span-2 lg:col-span-4 max-w-[200px]">
            <Search className="w-4 h-4" aria-hidden="true" />
            Apply Filters
          </button>
        </form>
      </div>

      {/* Results */}
      <Suspense fallback={<ProviderSkeletons />}>
        {error ? (
          <div role="alert" className="text-center py-16 text-danger">
            Error loading providers. Please refresh and try again.
          </div>
        ) : !providers || providers.length === 0 ? (
          <EmptyState />
        ) : (
          <div>
            <p className="text-sm text-text-muted mb-4">
              {providers.length} provider{providers.length !== 1 ? 's' : ''} found
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Childcare providers">
              {providers.map((p) => (
                <ProviderCard key={p.id} provider={p as unknown as ChildcareProviderWithProfile} />
              ))}
            </div>
          </div>
        )}
      </Suspense>
    </div>
  )
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface ChildcareProviderWithProfile {
  id: string
  profile_id: string
  provider_type: string
  languages_spoken: string[]
  pure_vegetarian: boolean
  peanut_free: boolean
  first_aid_certified: boolean
  cpr_certified: boolean
  max_children: number
  hourly_rate: number | null
  is_volunteer: boolean
  vsc_verified: boolean
  emergency_available: boolean
  description: string | null
  avg_rating: number
  total_reviews: number
  profiles: {
    id: string
    display_name: string
    location_label: string | null
    halton_town: string | null
    avatar_url: string | null
    availability: string
  }
}

// ── Provider Card ──────────────────────────────────────────────────────────────
function ProviderCard({ provider: p }: { provider: ChildcareProviderWithProfile }) {
  const profile = p.profiles
  const typeLabel = PROVIDER_TYPES.find(t => t.value === p.provider_type)?.label ?? p.provider_type

  return (
    <article role="listitem">
      <Link href={`/childcare/${p.id}`} className="block group">
        <Card hover className="p-5 h-full border-t-4 border-t-transparent hover:border-t-secondary transition-all">
          
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-14 h-14 rounded-full bg-gradient-teal flex items-center justify-center flex-shrink-0 text-white font-heading font-bold text-xl shadow-sm"
              aria-hidden="true"
            >
              {profile.display_name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-bold text-text group-hover:text-secondary transition-colors truncate">
                  {profile.display_name}
                </h3>
                <StatusDot status={profile.availability as 'available' | 'emergency_available' | 'busy' | 'offline'} />
              </div>
              <p className="text-sm text-text-muted font-medium">{typeLabel}</p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {p.vsc_verified && (
              <Badge variant="green" icon={<ShieldCheck className="w-3 h-3" />}>VSC Verified</Badge>
            )}
            {p.cpr_certified && (
              <Badge variant="gray" icon={<Heart className="w-3 h-3" />}>CPR Certified</Badge>
            )}
            {p.emergency_available && (
              <Badge variant="orange" icon={<Clock className="w-3 h-3" />}>Emergency Drop-in</Badge>
            )}
          </div>

          {/* Rating */}
          {p.total_reviews > 0 && (
            <StarRating
              rating={p.avg_rating}
              reviewCount={p.total_reviews}
              size="sm"
              className="mb-3"
            />
          )}

          {/* Description snippet */}
          {p.description && (
            <p className="text-sm text-text-muted line-clamp-2 mb-4">{p.description}</p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 text-sm">
            <span className="text-text-muted truncate max-w-[60%]">
              {profile.location_label || profile.halton_town || 'Halton Region'}
            </span>
            <span className="font-medium text-text bg-surface-muted px-2.5 py-1 rounded-md">
              {p.is_volunteer ? 'Volunteer / Co-op' : p.hourly_rate ? `$${p.hourly_rate}/hr` : 'Contact for rates'}
            </span>
          </div>
        </Card>
      </Link>
    </article>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function ProviderSkeletons() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading...">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-surface rounded-card border border-gray-100 p-5 shadow-card">
          <div className="flex gap-4 mb-4">
            <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <Skeleton lines={2} className="mb-4" />
          <Skeleton className="h-4 w-1/3" />
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
        <Baby className="w-8 h-8 text-gray-400" aria-hidden="true" />
      </div>
      <h2 className="font-heading font-bold text-xl text-text mb-2">No Providers Found</h2>
      <p className="text-text-muted mb-6">
        Try adjusting your filters to find childcare providers in your area.
      </p>
      <Link href="/childcare" className="btn-outline inline-flex">
        Clear Filters
      </Link>
    </div>
  )
}

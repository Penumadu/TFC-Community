import { Suspense } from 'react'
import { db } from '@/lib/firebase/client'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import { Search, SlidersHorizontal, MapPin, Users, Heart, ExternalLink, Plus } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { Badge, Card, Skeleton, StarRating } from '@/components/ui/index'

export const metadata = {
  title: 'Community Venues',
  description: 'Find community halls, temples, and event spaces in Halton Region & GTA',
}

interface VenuesPageProps {
  searchParams: Promise<{
    city?: string
    venue_type?: string
    capacity?: string
    veg_kitchen?: string
    ext_catering?: string
    alcohol?: string
    q?: string
  }>
}

const CITIES = [
  { value: '', label: 'All Cities' },
  { value: 'Milton', label: 'Milton' },
  { value: 'Oakville', label: 'Oakville' },
  { value: 'Burlington', label: 'Burlington' },
  { value: 'Halton Hills', label: 'Halton Hills' },
  { value: 'Mississauga', label: 'Mississauga' },
  { value: 'Brampton', label: 'Brampton' },
]

const VENUE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'community_hall', label: 'Community Hall' },
  { value: 'school_auditorium', label: 'School Auditorium' },
  { value: 'banquet_hall', label: 'Banquet Hall' },
  { value: 'temple_hall', label: 'Temple Hall' },
  { value: 'park_pavilion', label: 'Park Pavilion' },
  { value: 'other', label: 'Other' },
]

export default async function VenuesPage({ searchParams }: VenuesPageProps) {
  const params = await searchParams
  
  const constraints: any[] = [where('is_active', '==', true)]

  if (params.city) constraints.push(where('city', '==', params.city))
  if (params.venue_type) constraints.push(where('venue_type', '==', params.venue_type))
  if (params.veg_kitchen === 'true') constraints.push(where('dedicated_veg_kitchen', '==', true))
  if (params.ext_catering === 'true') constraints.push(where('external_catering_allowed', '==', true))
  if (params.alcohol === 'true') constraints.push(where('alcohol_allowed', '==', true))
  
  if (params.capacity) {
    const minCap = parseInt(params.capacity, 10)
    if (!isNaN(minCap)) {
      constraints.push(where('max_capacity', '>=', minCap))
    }
  }

  constraints.push(limit(48))
  
  const q = query(collection(db, 'venues'), ...constraints)
  const snapshot = await getDocs(q)
  const venues = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any))
  venues.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
  const error = null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Page header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title flex items-center gap-3">
            <MapPin className="w-7 h-7 text-secondary" aria-hidden="true" />
            Community Venues
          </h1>
          <p className="section-subtitle">
            Find halls, temples, and event spaces for gatherings & celebrations
          </p>
        </div>
        <Link href="/venues/new">
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            Suggest Venue
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-xl border border-gray-100 shadow-card p-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal className="w-4 h-4 text-secondary" aria-hidden="true" />
          <span className="font-semibold text-text text-sm">Filter Venues</span>
        </div>

        <form method="GET" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="search">

          {/* Search */}
          <div className="sm:col-span-2 lg:col-span-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
            <input
              type="search"
              name="q"
              defaultValue={params.q}
              placeholder="Search by name..."
              className="input pl-9 text-base"
              aria-label="Search venues"
            />
          </div>

          {/* City */}
          <select
            name="city"
            defaultValue={params.city ?? ''}
            className="input"
            aria-label="Filter by city"
          >
            {CITIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {/* Type */}
          <select
            name="venue_type"
            defaultValue={params.venue_type ?? ''}
            className="input"
            aria-label="Filter by venue type"
          >
            {VENUE_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* Capacity */}
          <select
            name="capacity"
            defaultValue={params.capacity ?? ''}
            className="input"
            aria-label="Filter by minimum capacity"
          >
            <option value="">Any Capacity</option>
            <option value="50">50+ Guests</option>
            <option value="100">100+ Guests</option>
            <option value="200">200+ Guests</option>
            <option value="500">500+ Guests</option>
          </select>

          {/* Toggle filters */}
          <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="veg_kitchen"
                value="true"
                defaultChecked={params.veg_kitchen === 'true'}
                className="w-4 h-4 accent-success rounded"
              />
              <Heart className="w-3.5 h-3.5 text-success" aria-hidden="true" />
              <span className="text-sm font-medium text-text">Pure Veg Kitchen</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="ext_catering"
                value="true"
                defaultChecked={params.ext_catering === 'true'}
                className="w-4 h-4 accent-secondary rounded"
              />
              <span className="text-sm font-medium text-text">External Catering</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="alcohol"
                value="true"
                defaultChecked={params.alcohol === 'true'}
                className="w-4 h-4 accent-warning rounded"
              />
              <span className="text-sm font-medium text-text">Alcohol Allowed</span>
            </label>
          </div>

          <button type="submit" className="btn-secondary sm:col-span-2 lg:col-span-1">
            <Search className="w-4 h-4" aria-hidden="true" />
            Apply Filters
          </button>
        </form>
      </div>

      {/* Results */}
      <Suspense fallback={<VenueSkeletons />}>
        {error ? (
          <div role="alert" className="text-center py-16 text-danger">
            Error loading venues. Please refresh and try again.
          </div>
        ) : !venues || venues.length === 0 ? (
          <EmptyState />
        ) : (
          <div>
            <p className="text-sm text-text-muted mb-4">
              {venues.length} venue{venues.length !== 1 ? 's' : ''} found
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Venue listings">
              {venues.map((v) => (
                <VenueCard key={v.id} venue={v} />
              ))}
            </div>
          </div>
        )}
      </Suspense>
    </div>
  )
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface Venue {
  id: string
  name: string
  venue_type: string
  city: string
  max_capacity: number | null
  hourly_rate: number | null
  full_day_rate: number | null
  dedicated_veg_kitchen: boolean
  external_catering_allowed: boolean
  alcohol_allowed: boolean
  avg_rating: number
  total_reviews: number
  photo_urls: string[] | null
  website_url: string | null
}

// ── Venue Card ─────────────────────────────────────────────────────────────────
function VenueCard({ venue: v }: { venue: Venue }) {
  const typeLabel = VENUE_TYPES.find(t => t.value === v.venue_type)?.label ?? v.venue_type

  return (
    <article role="listitem" className="h-full">
      <Link href={`/venues/${v.id}`} className="block group h-full">
        <Card hover className="h-full flex flex-col">
          {/* Cover image (placeholder if none) */}
          <div className="aspect-video bg-gray-100 relative overflow-hidden flex-shrink-0">
            {v.photo_urls && v.photo_urls.length > 0 ? (
              <img 
                src={v.photo_urls[0]} 
                alt={`Photo of ${v.name}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-teal flex items-center justify-center opacity-80">
                <MapPin className="w-10 h-10 text-white/50" />
              </div>
            )}
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-bold text-secondary shadow-sm">
              {v.city}
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col">
            {/* Header */}
            <div className="mb-3">
              <h3 className="font-heading font-bold text-lg text-text group-hover:text-secondary transition-colors line-clamp-1">
                {v.name}
              </h3>
              <p className="text-sm text-text-muted">{typeLabel}</p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {v.dedicated_veg_kitchen && (
                <Badge variant="teal" icon={<Heart className="w-3 h-3" />}>Pure Veg Kitchen</Badge>
              )}
              {v.max_capacity && (
                <Badge variant="gray" icon={<Users className="w-3 h-3" />}>Up to {v.max_capacity}</Badge>
              )}
            </div>

            {/* Rating */}
            {v.total_reviews > 0 && (
              <StarRating
                rating={v.avg_rating}
                reviewCount={v.total_reviews}
                size="sm"
                className="mb-4"
              />
            )}

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
              <div className="font-medium text-text">
                {v.hourly_rate ? `$${v.hourly_rate}/hr` : v.full_day_rate ? `$${v.full_day_rate}/day` : 'Contact for pricing'}
              </div>
              
              {v.website_url && (
                <span className="text-secondary-light flex items-center gap-1 hover:underline">
                  Website <ExternalLink className="w-3 h-3" />
                </span>
              )}
            </div>
          </div>
        </Card>
      </Link>
    </article>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function VenueSkeletons() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading...">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-surface rounded-card border border-gray-100 shadow-card overflow-hidden">
          <Skeleton className="w-full aspect-video rounded-none" />
          <div className="p-5">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <Skeleton lines={2} className="mb-4" />
            <Skeleton className="h-4 w-full mt-4" />
          </div>
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
        <MapPin className="w-8 h-8 text-gray-400" aria-hidden="true" />
      </div>
      <h2 className="font-heading font-bold text-xl text-text mb-2">No Venues Found</h2>
      <p className="text-text-muted mb-6">
        Try adjusting your filters to find more spaces.
      </p>
      <Link href="/venues" className="btn-outline inline-flex">
        Clear Filters
      </Link>
    </div>
  )
}

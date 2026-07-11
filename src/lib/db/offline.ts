import Dexie, { type Table } from 'dexie'

// ─── Offline Types ─────────────────────────────────────────────────────────────
export interface OfflineProfile {
  id: string
  display_name: string
  tier: string
  languages: string[]
  location_label: string | null
  halton_town: string | null
  vsc_status: string | null
  availability: string
  avatar_url: string | null
  bio: string | null
  cached_at: number
}

export interface OfflineTradesperson {
  id: string
  profile_id: string
  business_name: string | null
  category: string
  speaks_telugu: boolean
  emergency_24_7: boolean
  community_vouched: boolean
  description: string | null
  service_area: string[]
  avg_rating: number
  total_reviews: number
  is_active: boolean
  display_name: string
  location_label: string | null
  halton_town: string | null
  avatar_url: string | null
  cached_at: number
}

export interface OfflineVenue {
  id: string
  name: string
  venue_type: string
  address: string
  city: string
  max_capacity: number | null
  pricing_notes: string | null
  external_catering_allowed: boolean
  vegetarian_kitchen: boolean
  dedicated_veg_kitchen: boolean
  alcohol_allowed: boolean
  parking_capacity: number | null
  noise_curfew: string | null
  special_rules: string | null
  photo_urls: string[]
  avg_rating: number
  admin_verified: boolean
  cached_at: number
}

export interface SyncQueueItem {
  id?: number
  action: 'review' | 'handshake' | 'coop_log' | 'availability_toggle' | 'vouch_request'
  payload: Record<string, unknown>
  created_at: number
  retries: number
  last_attempt: number | null
  status: 'pending' | 'syncing' | 'failed'
}

export interface LocalPreferences {
  key: string
  value: unknown
}

// ─── Dexie Database ────────────────────────────────────────────────────────────
class TFCOfflineDB extends Dexie {
  profiles!: Table<OfflineProfile>
  tradespeople!: Table<OfflineTradesperson>
  venues!: Table<OfflineVenue>
  syncQueue!: Table<SyncQueueItem>
  preferences!: Table<LocalPreferences>

  constructor() {
    super('tfc-offline-db')

    this.version(1).stores({
      // Profiles: keyed by id, indexed by tier, halton_town
      profiles: 'id, tier, halton_town, availability',

      // Tradespeople: keyed by id, indexed for filtering
      tradespeople:
        'id, profile_id, category, speaks_telugu, emergency_24_7, community_vouched, halton_town, avg_rating',

      // Venues: keyed by id, indexed by city and type
      venues: 'id, city, venue_type, dedicated_veg_kitchen, external_catering_allowed',

      // Sync queue: auto-incremented id, indexed by status and action
      syncQueue: '++id, action, status, created_at',

      // Key-value preferences store
      preferences: 'key',
    })
  }
}

export const offlineDB = new TFCOfflineDB()

// ─── Sync Queue Helpers ────────────────────────────────────────────────────────
export async function enqueueSyncAction(
  action: SyncQueueItem['action'],
  payload: Record<string, unknown>
): Promise<void> {
  await offlineDB.syncQueue.add({
    action,
    payload,
    created_at: Date.now(),
    retries: 0,
    last_attempt: null,
    status: 'pending',
  })

  // Request background sync if available
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    const reg = await navigator.serviceWorker.ready
    await (reg as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('tfc-sync-queue')
  }
}

export async function processSyncQueue(syncFn: (item: SyncQueueItem) => Promise<void>): Promise<void> {
  const pending = await offlineDB.syncQueue.where('status').equals('pending').toArray()

  for (const item of pending) {
    try {
      await offlineDB.syncQueue.update(item.id!, { status: 'syncing', last_attempt: Date.now() })
      await syncFn(item)
      await offlineDB.syncQueue.delete(item.id!)
    } catch {
      const retries = item.retries + 1
      await offlineDB.syncQueue.update(item.id!, {
        status: retries >= 3 ? 'failed' : 'pending',
        retries,
        last_attempt: Date.now(),
      })
    }
  }
}

// ─── Preferences Helpers ───────────────────────────────────────────────────────
export async function getPreference<T>(key: string, defaultValue: T): Promise<T> {
  const item = await offlineDB.preferences.get(key)
  return item ? (item.value as T) : defaultValue
}

export async function setPreference<T>(key: string, value: T): Promise<void> {
  await offlineDB.preferences.put({ key, value })
}

// Service Worker for TFC Community Portal
// Handles: push notifications, offline caching, background sync

const CACHE_VERSION = 'tfc-v1'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`

const STATIC_ASSETS = [
  '/',
  '/~offline',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// ── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// ── Activate ───────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('tfc-') && key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch — Network First with offline fallback ────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET and chrome-extension requests
  if (request.method !== 'GET' || !request.url.startsWith('http')) return

  // API requests: Network first, no cache fallback (data must be fresh)
  if (request.url.includes('/api/') || request.url.includes('supabase.co')) {
    event.respondWith(fetch(request).catch(() => new Response(null, { status: 503 })))
    return
  }

  // Static assets: Cache first
  if (request.destination === 'image' || request.destination === 'font') {
    event.respondWith(
      caches.match(request).then(
        (cached) => cached || fetch(request).then((response) => {
          const clone = response.clone()
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone))
          return response
        })
      )
    )
    return
  }

  // Navigation: Network first, offline page fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((cached) => cached || caches.match('/~offline'))
      )
    )
    return
  }

  // Default: Network first, dynamic cache as fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone()
        caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone))
        return response
      })
      .catch(() => caches.match(request))
  )
})

// ── Push Notifications ─────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'TFC Community', {
      body: data.body,
      icon: data.icon || '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      tag: data.tag || 'tfc-notification',
      data: data,
      vibrate: [100, 50, 100],
      actions: data.actions || [],
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      const existingClient = clientList.find((c) => c.url === url && 'focus' in c)
      if (existingClient) return existingClient.focus()
      return clients.openWindow(url)
    })
  )
})

// ── Background Sync (Offline queue) ───────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'tfc-sync-queue') {
    event.waitUntil(processSyncQueue())
  }
})

async function processSyncQueue() {
  // The main app handles IndexedDB sync queue processing
  // This event wakes the app when connectivity is restored
  const allClients = await clients.matchAll({ type: 'window' })
  allClients.forEach((client) => client.postMessage({ type: 'SYNC_READY' }))
}

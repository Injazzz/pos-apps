/* eslint-disable @typescript-eslint/no-explicit-any */
//  Custom service worker yang dipakai Workbox
/// <reference lib="webworker" />
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import {
  NavigationRoute,
  registerRoute,
} from 'workbox-routing'
import {
  CacheFirst,
  NetworkFirst,
  NetworkOnly,
  StaleWhileRevalidate,
} from 'workbox-strategies'
import {
  BackgroundSyncPlugin,
} from 'workbox-background-sync'
import {
  ExpirationPlugin,
} from 'workbox-expiration'
import {
  CacheableResponsePlugin,
} from 'workbox-cacheable-response'

declare let self: ServiceWorkerGlobalScope

// ─── Precache app shell ───────────────────────────────────────
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// ─── SPA Navigation ───────────────────────────────────────────
registerRoute(
  new NavigationRoute(
    createHandlerBoundToURL('index.html'),
    {
      // Exclude API calls dari navigation handler
      denylist: [/^\/api\//, /^\/broadcasting\//],
    }
  )
)

// ─── CACHE STRATEGIES ─────────────────────────────────────────

// 1. Menus — Stale While Revalidate
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/menus'),
  new StaleWhileRevalidate({
    cacheName: 'api-menus',
    plugins  : [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries     : 200,
        maxAgeSeconds  : 60 * 60 * 24, // 24 jam
        purgeOnQuotaError: true,
      }),
    ],
  })
)

// 2. Menu images — Cache First
registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/storage/menus/') ||
    url.pathname.match(/\.(png|jpg|jpeg|webp|gif|svg)$/),
  new CacheFirst({
    cacheName: 'images',
    plugins  : [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries   : 300,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 hari
      }),
    ],
  })
)

// 3. Dynamic API (orders, deliveries) — Network First
registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/api/') &&
    !url.pathname.startsWith('/api/auth/') &&
    !url.pathname.startsWith('/api/payments/'),
  new NetworkFirst({
    cacheName            : 'api-dynamic',
    networkTimeoutSeconds: 10,
    plugins              : [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries   : 100,
        maxAgeSeconds: 60 * 60, // 1 jam
      }),
    ],
  })
)

// 4. Auth & Payment — Network Only (TIDAK BOLEH di-cache)
registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/api/auth/') ||
    url.pathname.startsWith('/api/payments/') ||
    url.pathname.startsWith('/broadcasting/'),
  new NetworkOnly()
)

// 5. Google Fonts — Cache First
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' ||
               url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins  : [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries   : 10,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 tahun
      }),
    ],
  })
)

// ─── BACKGROUND SYNC ──────────────────────────────────────────
const bgSyncPlugin = new BackgroundSyncPlugin('offline-orders-queue', {
  maxRetentionTime: 24 * 60, // 24 jam dalam menit
})

registerRoute(
  ({ url, request }) =>
    url.pathname === '/api/cashier/orders' &&
    request.method === 'POST',
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'POST'
)

// ─── PUSH NOTIFICATIONS ───────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json() as {
    title  : string
    body   : string
    icon?  : string
    badge? : string
    data?  : Record<string, unknown>
    tag?   : string
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body : data.body,
      icon : data.icon  ?? '/icons/icon-192x192.png',
      badge: data.badge ?? '/icons/icon-72x72.png',
      tag  : data.tag   ?? 'pos-notification',
      data : data.data  ?? {},
      vibrate: [200, 100, 200],
    } as any)
  )
})

// ─── NOTIFICATION CLICK ───────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const notifData = event.notification.data as {
    url?: string
    orderId?: number
  }

  const targetUrl = notifData.url ?? '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Fokus tab yang sudah buka app
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus()
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              data: notifData,
            })
            return
          }
        }
        // Buka tab baru
        return self.clients.openWindow(targetUrl)
      })
  )
})

// ─── SKIP WAITING ─────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// ─── BACKGROUND SYNC EVENT ───────────────────────────────────
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-offline-orders') {
    event.waitUntil(
      // Notify semua clients bahwa sync dimulai
      self.clients.matchAll().then(clients => {
        clients.forEach(client =>
          client.postMessage({ type: 'BACKGROUND_SYNC_START' })
        )
      })
    )
  }
})
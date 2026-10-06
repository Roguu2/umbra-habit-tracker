// Service worker: działanie offline i przypomnienia push.
// Rejestrowany z ?cache=0 podczas `npm run dev` — wtedy nic nie cache'uje, żeby nie psuć odświeżania Vite.

const CACHE = 'umbra-v1'
const CACHING = new URL(self.location).searchParams.get('cache') !== '0'
const SHELL = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/badge-96.png']

self.addEventListener('install', (event) => {
  self.skipWaiting()
  if (!CACHING) return
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      await cache.addAll(SHELL)
      // pliki aplikacji (JS/CSS z hashem w nazwie) wyczytane ze strony głównej
      const html = await (await cache.match('/')).text()
      const assets = [...new Set(html.match(/\/assets\/[^"']+/g) ?? [])]
      await cache.addAll(assets)
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key)
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  if (!CACHING) return
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  // strona: najpierw sieć (świeża wersja po wdrożeniu), bez sieci — z pamięci
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('/', copy))
          return res
        })
        .catch(() => caches.match('/')),
    )
    return
  }

  // pliki z hashem i ikony nigdy się nie zmieniają — najpierw pamięć
  if (url.origin === location.origin && (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/'))) {
    event.respondWith(caches.match(req).then((hit) => hit ?? fetchAndCache(req)))
    return
  }

  // fonty Google: z pamięci, w tle odświeżane
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(req).then((hit) => {
        const fresh = fetchAndCache(req).catch(() => hit)
        return hit ?? fresh
      }),
    )
  }
  // /api/* i reszta — zwykła sieć
})

async function fetchAndCache(req) {
  const res = await fetch(req)
  if (res.ok || res.type === 'opaque') {
    const copy = res.clone()
    caches.open(CACHE).then((c) => c.put(req, copy))
  }
  return res
}

// --- przypomnienia ------------------------------------------------------------

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data?.json() ?? {}
  } catch {
    data = { body: event.data?.text() }
  }
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Umbra', {
      body: data.body ?? '',
      tag: data.tag,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-96.png',
      data: { url: data.url ?? '/' },
      vibrate: [80, 40, 120],
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data?.url ?? '/'
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const open = windows.find((w) => new URL(w.url).origin === location.origin)
      if (open) return open.focus()
      return self.clients.openWindow(target)
    })(),
  )
})

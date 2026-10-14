// Service worker: działanie offline i przypomnienia push.
// Rejestrowany z ?cache=0 podczas `npm run dev` — wtedy nic nie cache'uje, żeby nie psuć odświeżania Vite.

const CACHE = 'umbra-v2'
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

  // /api/* i reszta — zwykła sieć (czcionki są w /assets/, więc trafiają do pamięci wyżej)
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

// odznaka na ikonie aplikacji: liczba nieodhaczonych zadań na dziś (left z serwera), gdy aplikacja jest zamknięta
function setBadge(left) {
  if (typeof left !== 'number' || !('setAppBadge' in self.navigator)) return Promise.resolve()
  return (left > 0 ? self.navigator.setAppBadge(left) : self.navigator.clearAppBadge()).catch(() => {})
}

// „ostatnia szansa” (kind: 'last') ma zostać na ekranie i być wyraźna; reszta jak zwykłe przypomnienie.
// Przyciski akcji nie wszędzie są widoczne (np. iOS) — samo stuknięcie i tak otwiera aplikację.
function notificationOptions(data) {
  const base = {
    body: data.body ?? '',
    tag: data.tag,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    data: { url: data.url ?? '/', kind: data.kind ?? null },
    vibrate: [80, 40, 120],
  }
  if (data.kind !== 'last') return base
  const en = data.lang === 'en'
  return {
    ...base,
    requireInteraction: true,
    renotify: Boolean(data.tag),
    vibrate: [200, 100, 200, 100, 400],
    actions: [
      { action: 'open', title: en ? 'Open' : 'Otwórz' },
      // po drzemce drugi raz już nie proponujemy
      ...(data.snoozed ? [] : [{ action: 'snooze', title: en ? 'In 30 min' : 'Za 30 min' }]),
    ],
  }
}

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data?.json() ?? {}
  } catch {
    data = { body: event.data?.text() }
  }
  event.waitUntil(Promise.all([self.registration.showNotification(data.title ?? 'Umbra', notificationOptions(data)), setBadge(data.left)]))
})

// drzemka: serwer wyśle „ostatnią szansę” jeszcze raz za 30 min (jeśli dalej coś zostanie i przed północą)
async function snooze() {
  const sub = await self.registration.pushManager.getSubscription()
  if (!sub) return
  await fetch('/api/push?action=snooze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: sub.endpoint, snoozeMinutes: 30 }),
  }).catch(() => {})
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'snooze') {
    event.waitUntil(snooze())
    return
  }
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

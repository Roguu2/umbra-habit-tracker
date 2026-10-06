// --- Aplikacja (PWA) i przypomnienia push -------------------------------------

const PREFS_KEY = 'umbra-habit-tracker:push'
export const DEFAULT_PREFS = { enabled: false, lead: 15, evening: '20:00' }

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
export const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true

// 'ok' | 'ios-install' (iPhone: push działa dopiero w zainstalowanej aplikacji) | 'unsupported'
export function pushSupport() {
  if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) return 'ok'
  return isIOS() && !isStandalone() ? 'ios-install' : 'unsupported'
}

export function loadPrefs() {
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY)) }
  } catch {
    return DEFAULT_PREFS
  }
}

export function savePrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // brak dostępu do storage
  }
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  // w trybie dev bez cache — inaczej service worker podawałby stare pliki zamiast świeżych z Vite
  navigator.serviceWorker.register(`/sw.js?cache=${import.meta.env.PROD ? 1 : 0}`).catch(() => {})
}

// zdarzenie instalacji potrafi przyjść przed startem Reacta — łapiemy je od razu
let installPrompt = null
const installListeners = new Set()
export function captureInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    installPrompt = e
    installListeners.forEach((fn) => fn(e))
  })
  window.addEventListener('appinstalled', () => {
    installPrompt = null
    installListeners.forEach((fn) => fn(null))
  })
}
export const getInstallPrompt = () => installPrompt
export function onInstallPrompt(fn) {
  installListeners.add(fn)
  return () => installListeners.delete(fn)
}

function base64ToBytes(base64) {
  const raw = atob((base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

async function call(method, query, body) {
  const res = await fetch(`/api/push${query}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
  return data
}

export async function getSubscription(create = false) {
  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  if (existing || !create) return existing
  const { publicKey } = await call('GET', '')
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ToBytes(publicKey) })
}

export const pushApi = {
  save: (code, subscription, prefs) =>
    call('POST', '', {
      code,
      subscription: subscription.toJSON(),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      lead: prefs.lead,
      evening: prefs.evening,
    }),
  remove: (endpoint) => call('DELETE', '', { endpoint }),
  test: (endpoint) => call('POST', '?action=test', { endpoint }),
}

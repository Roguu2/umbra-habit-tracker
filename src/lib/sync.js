// --- Synchronizacja między urządzeniami ------------------------------------
// Urządzenia łączy wspólny kod. Każde pamięta ostatnio zsynchronizowany stan (base),
// dzięki czemu zmiany zrobione równolegle na dwóch urządzeniach można scalić, a nie nadpisać.

const META_KEY = 'umbra-habit-tracker:sync'

export const normalizeCode = (raw) => String(raw ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '')
export const formatCode = (code) => code.match(/.{1,4}/g).join('-')
export const isValidCode = (code) => /^[2-9A-HJ-NP-Z]{12}$/.test(code)
export const shareLink = (code) => `${location.origin}${location.pathname}?sync=${formatCode(code)}`

// meta: { code, rev, base }
export function loadMeta() {
  try {
    const meta = JSON.parse(localStorage.getItem(META_KEY))
    return meta?.code ? meta : null
  } catch {
    return null
  }
}

export function saveMeta(meta) {
  try {
    if (meta) localStorage.setItem(META_KEY, JSON.stringify(meta))
    else localStorage.removeItem(META_KEY)
  } catch {
    // brak dostępu do storage
  }
}

async function call(method, query, body) {
  const res = await fetch(`/api/sync${query}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

export const syncApi = {
  create: (state) => call('POST', '', { state }),
  pull: (code) => call('GET', `?code=${code}`),
  push: (code, baseRev, state) => call('PUT', `?code=${code}`, { baseRev, state }),
  remove: (code) => call('DELETE', `?code=${code}`),
}

// --- Scalanie: base = wspólny przodek, local = to urządzenie, remote = serwer --

export const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

// wygrywa ta strona, która coś zmieniła; gdy zmieniły obie — to urządzenie
function pick(b, l, r) {
  if (same(l, r)) return l
  if (same(l, b)) return r
  return l
}

function mergeMap(b = {}, l = {}, r = {}, mergeEntry = pick) {
  const out = {}
  for (const key of new Set([...Object.keys(l), ...Object.keys(r)])) {
    const value = mergeEntry(b[key], l[key], r[key])
    if (value !== undefined) out[key] = value
  }
  return out
}

// lista odhaczonych zadań danego dnia — każde zadanie scalane osobno
function mergeIds(b = [], l = [], r = []) {
  return [...new Set([...l, ...r])].filter((id) => (l.includes(id) !== b.includes(id) ? l.includes(id) : r.includes(id)))
}

const byId = (quests = []) => Object.fromEntries(quests.map((q) => [q.id, q]))

export function mergeStates(base, local, remote) {
  const quests = mergeMap(byId(base.quests), byId(local.quests), byId(remote.quests))
  const order = [...new Set([...local.quests.map((q) => q.id), ...remote.quests.map((q) => q.id)])]

  const achievements = { ...remote.achievements }
  for (const [id, day] of Object.entries(local.achievements)) {
    achievements[id] = achievements[id] && achievements[id] < day ? achievements[id] : day
  }

  return {
    ...local,
    // EXP nie jest scalane osobno — wynika ze scalonej historii (totalExpOf)
    maxLevel: Math.max(local.maxLevel, remote.maxLevel),
    onboarded: local.onboarded || remote.onboarded,
    profile: mergeMap(base.profile, local.profile, remote.profile),
    quests: order.filter((id) => id in quests).map((id) => quests[id]),
    history: mergeMap(base.history, local.history, remote.history, (b, l, r) => {
      const ids = mergeIds(b, l, r)
      return ids.length || l ? ids : undefined
    }),
    steps: mergeMap(base.steps, local.steps, remote.steps, (b, l, r) => {
      const day = mergeMap(b, l, r)
      return Object.keys(day).length || l ? day : undefined
    }),
    counts: mergeMap(base.counts, local.counts, remote.counts, (b, l, r) => {
      const day = mergeMap(b, l, r)
      return Object.keys(day).length || l ? day : undefined
    }),
    pauses: pick(base.pauses, local.pauses, remote.pauses) ?? [],
    achievements,
    // późniejsza data wygrywa: powrót ogłoszony na którymkolwiek urządzeniu nie wraca na innym
    comebackSeen: [local.comebackSeen, remote.comebackSeen].filter(Boolean).sort().at(-1) ?? null,
  }
}

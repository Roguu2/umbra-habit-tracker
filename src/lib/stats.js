import { CATEGORIES, dayKey, parseKey, shiftKey } from './game'

// Zadanie "istnieje" w danym dniu, jeśli zostało utworzone wcześniej i nie zostało usunięte.
const existsOn = (quest, key) => quest.createdAt <= key && (!quest.archivedAt || key < quest.archivedAt)

export function isScheduledOn(quest, key) {
  if (!existsOn(quest, key)) return false
  if (quest.date) return quest.date === key
  return quest.days.includes(parseKey(key).getDay())
}

export const activeQuests = (state) => state.quests.filter((q) => !q.archivedAt)

// zadania bez godziny lądują na końcu dnia, w kolejności ułożonej przez użytkownika
export const byTime = (a, b) =>
  (a.time ?? '99').localeCompare(b.time ?? '99') || (a.order ?? Infinity) - (b.order ?? Infinity) || a.name.localeCompare(b.name)

export function questsForDay(state, key) {
  return state.quests.filter((q) => isScheduledOn(q, key)).sort(byTime)
}

export function keysBetween(fromKey, toKey) {
  const keys = []
  for (let k = fromKey; k <= toKey; k = shiftKey(k, 1)) keys.push(k)
  return keys
}

const indexCache = new WeakMap()
function questIndex(state) {
  let idx = indexCache.get(state.quests)
  if (!idx) {
    idx = Object.fromEntries(state.quests.map((q) => [q.id, q]))
    indexCache.set(state.quests, idx)
  }
  return idx
}

export function dayStats(state, key) {
  const byId = questIndex(state)
  const scheduled = questsForDay(state, key)
  const doneIds = (state.history[key] ?? []).filter((id) => byId[id])
  const doneSet = new Set(doneIds)
  const scheduledIds = new Set(scheduled.map((q) => q.id))
  const scheduledDone = scheduled.filter((q) => doneSet.has(q.id))

  return {
    key,
    scheduled,
    scheduledDone,
    extra: doneIds.filter((id) => !scheduledIds.has(id)).map((id) => byId[id]),
    exp: doneIds.reduce((sum, id) => sum + byId[id].exp, 0),
    plannedExp: scheduled.reduce((sum, q) => sum + q.exp, 0),
    // null = nic nie zaplanowano i nic nie zrobiono
    ratio: scheduled.length ? scheduledDone.length / scheduled.length : doneIds.length ? 1 : null,
    perfect: scheduled.length > 0 && scheduledDone.length === scheduled.length,
  }
}

const maxKey = (a, b) => (a > b ? a : b)

// skuteczność z ostatnich N zakończonych dni (bez dzisiejszego, który jeszcze trwa)
export function completionRate(state, days, today = dayKey()) {
  const from = maxKey(shiftKey(today, -days), state.profile.startedAt)
  const to = shiftKey(today, -1)
  if (from > to) return null
  const ratios = keysBetween(from, to)
    .map((k) => dayStats(state, k).ratio)
    .filter((r) => r !== null)
  return ratios.length ? ratios.reduce((a, b) => a + b, 0) / ratios.length : null
}

// Seria liczy kolejne zaplanowane dni z wykonaniem; dni wolne od zadania jej nie przerywają.
export function questStreaks(state, quest, today = dayKey()) {
  const done = (k) => (state.history[k] ?? []).includes(quest.id)
  const end = quest.archivedAt ? shiftKey(quest.archivedAt, -1) : today

  let current = 0
  for (let k = end; k >= quest.createdAt; k = shiftKey(k, -1)) {
    if (isScheduledOn(quest, k)) {
      if (done(k)) current++
      else if (k !== today) break
    } else if (done(k)) current++
  }

  let best = 0
  let run = 0
  for (const k of keysBetween(quest.createdAt, end)) {
    if (isScheduledOn(quest, k)) {
      if (done(k)) run++
      else if (k !== today) run = 0
    } else if (done(k)) run++
    best = Math.max(best, run)
  }
  return { current, best }
}

export function perfectDayStreak(state, today = dayKey()) {
  let streak = 0
  for (let k = shiftKey(today, -1); k >= state.profile.startedAt; k = shiftKey(k, -1)) {
    const s = dayStats(state, k)
    if (s.ratio === null) continue
    if (!s.perfect) break
    streak++
  }
  return streak + (dayStats(state, today).perfect ? 1 : 0)
}

export function lifetimeStats(state, today = dayKey()) {
  let perfectDays = 0
  let seals = 0
  for (const k of keysBetween(state.profile.startedAt, today)) {
    if (dayStats(state, k).perfect) perfectDays++
    seals += (state.history[k] ?? []).length
  }
  return {
    perfectDays,
    seals,
    bestStreak: Math.max(0, ...state.quests.map((q) => questStreaks(state, q, today).best)),
    created: state.quests.filter((q) => q.custom).length,
    plannedAhead: state.quests.some((q) => q.date && q.date > q.createdAt),
  }
}

export function weekPerfectDays(state, weekStartKey) {
  return keysBetween(weekStartKey, shiftKey(weekStartKey, 6)).filter((k) => dayStats(state, k).perfect).length
}

// ile razy wykonano zadania z każdej kategorii (automatycznie rozpoznanej z nazwy)
export function categoryCounts(state) {
  const byId = questIndex(state)
  const result = Object.fromEntries(Object.keys(CATEGORIES).map((c) => [c, 0]))
  for (const ids of Object.values(state.history)) {
    for (const id of ids) if (byId[id]) result[byId[id].attr] = (result[byId[id].attr] ?? 0) + 1
  }
  return result
}

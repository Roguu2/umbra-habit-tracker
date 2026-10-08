import { completionExp, dayKey, isMinimal, sealsOf, shiftKey } from './game'
import { existsOn, isFlexible, isPaused, isScheduledOn, pauseOn, weekCount, weekKeys } from './schedule.js'

export { isFlexible, isPaused, isScheduledOn, weekCount }

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
  const pause = pauseOn(state, key)
  const paused = pause !== null

  return {
    key,
    scheduled,
    scheduledDone,
    // nawyki "X razy w tygodniu" istniejące tego dnia — nie są wymagane, więc nie wpływają na pełny dzień
    flexible: state.quests.filter((q) => isFlexible(q) && existsOn(q, key)).sort(byTime),
    flexDone: doneIds.filter((id) => isFlexible(byId[id])).map((id) => byId[id]),
    extra: doneIds.filter((id) => !scheduledIds.has(id) && !isFlexible(byId[id])).map((id) => byId[id]),
    exp: doneIds.reduce((sum, id) => sum + completionExp(state, byId[id], key), 0),
    minimal: doneIds.filter((id) => isMinimal(state, id, key)), // zaliczone tylko w wersji minimalnej
    plannedExp: scheduled.reduce((sum, q) => sum + q.exp, 0),
    paused,
    shielded: Boolean(pause?.shield), // przerwa z tarczy passy, nie z urlopu
    // null = dzień się nie liczy (nic nie zaplanowano i nic nie zrobiono, albo urlop)
    ratio: paused ? null : scheduled.length ? scheduledDone.length / scheduled.length : doneIds.length ? 1 : null,
    perfect: !paused && scheduled.length > 0 && scheduledDone.length === scheduled.length,
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

// Seria liczy kolejne zaplanowane dni z wykonaniem; dni wolne od zadania i dni urlopu jej nie przerywają.
// Dla nawyków "X razy w tygodniu" seria to kolejne tygodnie z osiągniętym celem (unit: 'week').
export function questStreaks(state, quest, today = dayKey()) {
  if (isFlexible(quest)) return weekStreaks(state, quest, today)
  const done = (k) => (state.history[k] ?? []).includes(quest.id)
  const required = (k) => isScheduledOn(quest, k) && !isPaused(state, k)
  const end = quest.archivedAt ? shiftKey(quest.archivedAt, -1) : today

  let current = 0
  for (let k = end; k >= quest.createdAt; k = shiftKey(k, -1)) {
    if (required(k)) {
      if (done(k)) current++
      else if (k !== today) break
    } else if (done(k)) current++
  }

  let best = 0
  let run = 0
  for (const k of keysBetween(quest.createdAt, end)) {
    if (required(k)) {
      if (done(k)) run++
      else if (k !== today) run = 0
    } else if (done(k)) run++
    best = Math.max(best, run)
  }
  return { current, best, unit: 'day' }
}

function weekStreaks(state, quest, today) {
  const end = quest.archivedAt ? shiftKey(quest.archivedAt, -1) : today
  const weeks = []
  for (let k = weekKeys(quest.createdAt)[0]; k <= end; k = shiftKey(k, 7)) {
    const keys = weekKeys(k)
    weeks.push({
      met: weekCount(state, quest, keys[6]) >= quest.perWeek,
      // tydzień trwa albo był w nim urlop — niespełniony cel nie przerywa serii
      lenient: keys[6] >= today || keys.some((d) => isPaused(state, d)),
    })
  }

  let current = 0
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (weeks[i].met) current++
    else if (!weeks[i].lenient) break
  }
  let best = 0
  let run = 0
  for (const w of weeks) {
    if (w.met) run++
    else if (!w.lenient) run = 0
    best = Math.max(best, run)
  }
  return { current, best, unit: 'week' }
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

// Wynik dnia dla passy, bez budowania pełnych statystyk (dayStats) — liczony dla każdego dnia historii.
// counted: dzień się liczy (jak ratio !== null w dayStats); perfect: pełny dzień; done: ile zadań wykonano.
export function dayOutcome(state, key) {
  const byId = questIndex(state)
  const doneIds = (state.history[key] ?? []).filter((id) => byId[id])
  if (isPaused(state, key)) return { counted: false, perfect: false, done: doneIds.length }
  const done = new Set(doneIds)
  let scheduled = 0
  let missed = 0
  for (const q of state.quests) {
    if (!isScheduledOn(q, key)) continue
    scheduled++
    if (!done.has(q.id)) missed++
  }
  return { counted: scheduled > 0 || doneIds.length > 0, perfect: scheduled > 0 && missed === 0, done: doneIds.length }
}

const perfectOn = (state, key) => dayOutcome(state, key).perfect

// jedno przejście po całej historii: pełne dni i najlepszy tydzień (pn–nd)
export function lifetimeStats(state, today = dayKey()) {
  const startedAt = state.profile.startedAt
  let perfectDays = 0
  let bestWeek = 0
  let week = 0
  const keys = keysBetween(weekKeys(startedAt)[0], today)
  keys.forEach((k, i) => {
    if (i % 7 === 0) week = 0
    const perfect = perfectOn(state, k)
    if (perfect) bestWeek = Math.max(bestWeek, ++week)
    if (k >= startedAt && perfect) perfectDays++
  })
  return {
    perfectDays,
    seals: sealsOf(state),
    bestWeek,
    bestStreak: Math.max(0, ...state.quests.map((q) => questStreaks(state, q, today).best)),
    created: state.quests.filter((q) => q.custom).length,
    plannedAhead: state.quests.some((q) => q.date && q.date > q.createdAt),
  }
}

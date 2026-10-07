// --- Podnoszenie poprzeczki --------------------------------------------------------
// Gdy nawyk trzyma się od ~2 tygodni, proponujemy trochę trudniejszą wersję: więcej razy w tygodniu
// albo większą liczbę w nazwie ("Spacer 20 min" → "Spacer 30 min"). Ten sam nawyk (to samo id),
// więc seria i historia zostają. Po propozycji (przyjętej lub nie) ten nawyk milknie na 14 dni.

import { detectCategory, parseKey, shiftKey } from './game.js'

export const QUIET_DAYS = 14

// ile kolejnych wykonań uznajemy za "trzyma się" (seria w dniach albo tygodniach)
export function streakGoal(quest) {
  if (quest.perWeek) return 3 // 3 tygodnie z rzędu z osiągniętym celem
  return Math.max(6, Math.min(14, quest.days.length * 2)) // codziennie: 14, 3 dni w tygodniu: 6
}

// liczba w nazwie + jak ją zwiększyć; pierwsza pasująca reguła wygrywa
const RULES = [
  // 3×15 → 3×20 (powtórzenia)
  { re: /(\d+)\s*[×x]\s*(\d+)/i, bump: (m) => (Number(m[2]) < 30 ? m[0].replace(m[2], String(Number(m[2]) + 5)) : null) },
  // minuty: 1→2…5, 5→10, 10→20, 20→30, 30→45, 45→60, 60→75, do 90
  {
    re: /(\d+)(\s*)(min\b|minut|minutes?)/i,
    bump: (m) => {
      const n = Number(m[1])
      const next = n < 5 ? n + 1 : n < 10 ? n + 5 : n < 30 ? n + 10 : n < 90 ? n + 15 : null
      return next && `${Math.min(next, 90)}${m[2]}${m[3]}`
    },
  },
  { re: /(\d+)(\s*)(stron|str\.|pages?)/i, bump: (m) => (Number(m[1]) < 50 ? `${Number(m[1]) + 10}${m[2]}${m[3]}` : null) },
  {
    re: /(\d[\d\s,.]*\d|\d)(\s*)(kroków|krokow|steps)/i,
    bump: (m) => {
      const n = Number(m[1].replace(/[\s,.]/g, ''))
      return n + 2000 <= 15000 ? `${(n + 2000).toLocaleString(m[3] === 'steps' ? 'en-GB' : 'pl-PL').replace(/ /g, ' ')}${m[2]}${m[3]}` : null
    },
  },
  {
    re: /(\d+)(\s*)(seri[ei]|seria|sets?)/i,
    bump: (m) => {
      const n = Number(m[1]) + 1
      if (n > 5) return null
      const word = /^set/i.test(m[3]) ? 'sets' : n <= 4 ? 'serie' : 'serii' // 2–4 serie, 5 serii
      return `${n}${m[2]}${word}`
    },
  },
  { re: /(\d+)(\s*)(nowych słówek|słówek|new words|words)/i, bump: (m) => (Number(m[1]) < 20 ? `${Number(m[1]) + 5}${m[2]}${m[3]}` : null) },
  { re: /(\d+(?:[.,]\d+)?)(\s*)(km)\b/i, bump: (m) => (parseFloat(m[1].replace(',', '.')) < 21 ? `${Math.floor(parseFloat(m[1].replace(',', '.'))) + 1}${m[2]}${m[3]}` : null) },
]

function harderName(name) {
  for (const { re, bump } of RULES) {
    const m = name.match(re)
    if (!m) continue
    const part = bump(m)
    return part ? name.replace(m[0], part) : null
  }
  return null
}

// propozycja trudniejszej wersji: { name?, perWeek?, from, to } albo null, gdy nie da się sensownie utrudnić
export function harderVersion(quest) {
  if (quest.date || quest.kind === 'avoid' || quest.kind === 'count' || quest.archivedAt) return null
  const name = harderName(quest.name)
  // zmiana nazwy nie może przenieść nawyku do innego atrybutu
  const nameOk = name && detectCategory(name) === detectCategory(quest.name)

  if (quest.perWeek && quest.perWeek < 3) return { perWeek: quest.perWeek + 1, kind: 'perWeek' }
  if (nameOk) return { name, kind: 'name' }
  // bez liczby w nazwie: najwyżej 4× w tygodniu — więcej to już nie poprzeczka, tylko przetrenowanie
  if (quest.perWeek && quest.perWeek < 4) return { perWeek: quest.perWeek + 1, kind: 'perWeek' }
  return null
}

// czy nawyk milczy po ostatniej propozycji
export const isQuiet = (quest, today) => Boolean(quest.barAt) && today < shiftKey(quest.barAt, QUIET_DAYS)

// nawyk, któremu dziś warto zaproponować więcej (najdłuższa seria pierwsza)
// streakOf(quest) → { current, unit }
export function barCandidate(quests, today, streakOf) {
  let best = null
  for (const q of quests) {
    if (isQuiet(q, today) || parseKey(q.createdAt) > parseKey(shiftKey(today, -QUIET_DAYS))) continue
    const up = harderVersion(q)
    if (!up) continue
    const streak = streakOf(q)
    if (streak.current < streakGoal(q)) continue
    if (!best || streak.current > best.streak.current) best = { quest: q, up, streak }
  }
  return best
}

// Sprawdza katalog nawyków i dobór z ankiety: `npm run check:habits`
// 1. każdy nawyk trafia w kategorię zgodną z którymś ze swoich celów (w obu językach)
// 2. dla każdej kombinacji odpowiedzi: pełna liczba propozycji, każdy cel pokryty,
//    mieści się w czasie, bez dwóch nawyków z jednej grupy
// Język wybiera i18n.js przy imporcie, więc każdy język sprawdzamy w osobnym procesie.

import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const lang = process.argv[2]
if (!lang) {
  let failed = false
  for (const l of ['pl', 'en']) {
    try {
      console.log(execFileSync(process.execPath, [fileURLToPath(import.meta.url), l], { encoding: 'utf8' }).trim())
    } catch (err) {
      console.log(err.stdout?.trim())
      failed = true
    }
  }
  process.exit(failed ? 1 : 0)
}

globalThis.localStorage = { getItem: () => lang, setItem() {} }
const { HABITS } = await import('../src/lib/habits.js')
const { detectCategory } = await import('../src/lib/game.js')
const { recommend, pickCount, toQuestDrafts } = await import('../src/lib/recommend.js')

const errors = []
const ATTR = { str: 'str', end: 'end', vit: 'vit', mind: 'mind', calm: 'mind', life: 'life' }
const ids = new Set()
for (const x of HABITS) {
  if (ids.has(x.id)) errors.push(`powtórzone id: ${x.id}`)
  ids.add(x.id)
  const got = detectCategory(x.name)
  if (!x.goals.some((g) => ATTR[g] === got)) errors.push(`"${x.name}" → kategoria ${got}, a cele to ${x.goals.join(', ')}`)
}

const G = Object.keys(ATTR)
const goalSets = [...G.map((g) => [g]), ...G.flatMap((a, i) => G.slice(i + 1).map((b) => [a, b]))]
const ALLOW = { 5: 8, 15: 20, 30: 60 }
let cases = 0
for (const goals of goalSets)
  for (const life of ['desk', 'physical', 'study', 'shift', 'home'])
    for (const slot of ['morning', 'midday', 'evening'])
      for (const budget of [5, 15, 30])
        for (const level of ['new', 'some']) {
          cases++
          const a = { goals, life, slot, budget, level }
          const label = JSON.stringify(a)
          const { picks } = recommend(a)
          const minutes = picks.reduce((s, x) => s + (typeof x.repeat === 'number' ? (x.min * x.repeat) / 7 : x.min), 0)
          const groups = picks.map((x) => x.group).filter(Boolean)
          if (picks.length < pickCount(a)) errors.push(`za mało propozycji: ${label}`)
          for (const g of goals) if (!picks.some((x) => x.goals.includes(g))) errors.push(`cel ${g} bez nawyku: ${label}`)
          if (minutes > ALLOW[budget] + 1e-9) errors.push(`ponad czas (${minutes.toFixed(1)} min): ${label}`)
          if (new Set(groups).size !== groups.length) errors.push(`dwa nawyki z jednej grupy: ${label}`)
          if (picks.some((x) => x.unfit.includes(life))) errors.push(`nawyk nie pasuje do stylu dnia: ${label}`)
          const drafts = toQuestDrafts(picks, a)
          if (life === 'shift' && drafts.some((d) => d.time)) errors.push(`godzina przy pracy zmianowej: ${label}`)
        }

// 3. podnoszenie poprzeczki: kolejne wersje zostają w tym samym atrybucie, tydzień najwyżej 4×,
//    a łańcuch kiedyś się kończy
const { harderVersion } = await import('../src/lib/progression.js')
for (const d of toQuestDrafts(HABITS, { level: 'some' })) {
  let q = { ...d }
  for (let i = 0; i < 30; i++) {
    const up = harderVersion(q)
    if (!up) break
    if (i === 29) errors.push(`poprzeczka bez końca: "${d.name}"`)
    const next = up.name ? { ...q, name: up.name } : { ...q, perWeek: up.perWeek }
    if (up.name && (up.name === q.name || detectCategory(up.name) !== detectCategory(d.name))) errors.push(`zła trudniejsza wersja: "${q.name}" → "${up.name}"`)
    if (up.perWeek && up.perWeek > Math.max(4, d.perWeek ?? 0)) errors.push(`za często: "${q.name}" → ${up.perWeek}×`)
    q = next
  }
}

if (errors.length) {
  console.log(`[${lang}] ${errors.length} problemów:\n  ${errors.slice(0, 30).join('\n  ')}`)
  process.exit(1)
}
console.log(`[${lang}] OK — ${HABITS.length} nawyków, ${cases} kombinacji odpowiedzi`)

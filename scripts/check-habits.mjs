// Sprawdza katalog nawyków i dobór z ankiety: `npm run check:habits`
// 1. każdy nawyk trafia w kategorię zgodną z którymś ze swoich celów (w obu językach)
// 2. dla każdej kombinacji odpowiedzi: pełna liczba propozycji, każdy cel pokryty,
//    mieści się w czasie, bez dwóch nawyków z jednej grupy
// 3. poprzeczka zostaje w tej samej kategorii; 4. edycja kroków przenosi postęp (lib/steps.js)
// 5. ręczna kategoria: zmiana nazwy, stare zapisy i kopie bez pola, scalanie z base sprzed pola
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
const { categoryOf } = await import('../src/lib/game.js')
const { recommend, pickCount, toQuestDrafts } = await import('../src/lib/recommend.js')

const errors = []
const ATTR = { str: 'str', end: 'end', vit: 'vit', mind: 'mind', calm: 'mind', life: 'life' }
const ids = new Set()
for (const x of HABITS) {
  if (ids.has(x.id)) errors.push(`powtórzone id: ${x.id}`)
  ids.add(x.id)
  const got = categoryOf(x)
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
    if (up.name && (up.name === q.name || categoryOf({ name: up.name }) !== categoryOf(d))) errors.push(`zła trudniejsza wersja: "${q.name}" → "${up.name}"`)
    if (up.perWeek && up.perWeek > Math.max(4, d.perWeek ?? 0)) errors.push(`za często: "${q.name}" → ${up.perWeek}×`)
    q = next
  }
}

// 4. edycja kroków: postęp idzie za krokami (zmiana tekstu, kolejności, usunięcie, dopisanie)
const { remapStepProgress, sameOrigin, stepsFromText } = await import('../src/lib/steps.js')
const remap = (checked, origin, done = false) => remapStepProgress({ d: { q: checked } }, 'q', origin, () => done).d.q.join()
const stepCases = [
  ['zmiana tekstu', remap([0, 2], [0, 1, 2]), '0,2'],
  ['zmiana kolejności', remap([0], [2, 0, 1]), '1'],
  ['usunięcie kroku', remap([2], [0, 2]), '1'],
  ['usunięcie odhaczonego', remap([1], [0, 2]), ''],
  ['dopisany krok nieodhaczony', remap([0, 1], [0, 1, null]), '0,1'],
  ['zaliczone zadanie — wszystkie', remap([0, 1], [0, 1, null], true), '0,1,2'],
  ['bez origin', sameOrigin(3, 2).join(), '0,1'],
  ['wklejanie linii', stepsFromText('Przysiad\r\n\n  Wykroki  \n').join('|'), 'Przysiad|Wykroki'],
]
for (const [what, got, want] of stepCases) if (got !== want) errors.push(`kroki — ${what}: ${got} ≠ ${want}`)
const untouched = remapStepProgress({ d: { other: [0] } }, 'q', [], () => false)
if (untouched.d.other.join() !== '0') errors.push('kroki — postęp innego zadania się zmienił')

// 5. ręczna kategoria: zostaje przy zmianie nazwy, auto idzie za nazwą, stare zapisy dostają null
const game = await import('../src/lib/game.js')
const { mergeStates } = await import('../src/lib/sync.js')
const expect = (what, got, want) => got !== want && errors.push(`kategoria — ${what}: ${got} ≠ ${want}`)
const questOf = (name, category = null) => ({ id: 'q1', name, days: game.ALL_DAYS, steps: [], kind: 'check', createdAt: '2026-01-01', archivedAt: null, category, ...game.autoProps(name, category) })

const manual = questOf('Trening siłowy', 'mind')
expect('ręczna przed zmianą nazwy', manual.attr, 'mind')
expect('ręczna po zmianie nazwy', game.autoProps('Bieganie 5 km', manual.category).attr, 'mind')
expect('ręczna — EXP z wybranej kategorii', manual.exp, game.CATEGORIES.mind.exp)
expect('auto po zmianie nazwy', game.autoProps('Bieganie 5 km', null).attr, 'end')
expect('auto — categoryOf bez pola', game.categoryOf({ name: 'Czytanie 10 stron' }), 'mind')
expect('nieznana kategoria = z nazwy', game.categoryOf({ name: 'Czytanie', category: 'xyz' }), 'mind')
// poprzeczka: dla ręcznej kategorii zmiana nazwy jest dozwolona, bo kategoria i tak zostaje
expect('poprzeczka przy ręcznej', harderVersion({ ...questOf('Czytanie 10 stron', 'life') })?.name, 'Czytanie 20 stron')

const old = { id: 'q1', name: 'Trening siłowy', days: game.ALL_DAYS, steps: [], kind: 'check', attr: 'str', tier: 'blood', exp: 40, rune: 0, createdAt: '2026-01-01', archivedAt: null }
const raw = (quests) => ({ version: game.STATE_VERSION, quests, history: { '2026-01-02': ['q1'] }, cleanedDefaults: true })
const imported = game.migrateState(raw([old])).quests[0]
expect('import starej kopii — pole', imported.category, null)
expect('import starej kopii — atrybut bez zmian', imported.attr, 'str')
// starsza wersja aplikacji zmieniła nazwę i nadpisała attr/EXP z nazwy, pole category zostawiła
const overwritten = game.migrateState(raw([{ ...old, name: 'Czytanie', attr: 'mind', exp: 25, category: 'str' }])).quests[0]
expect('stara wersja nadpisała attr', `${overwritten.attr}/${overwritten.exp}`, `str/${game.CATEGORIES.str.exp}`)
// scalanie: base sprzed pola category nie może sprawić, że zmiana z serwera przepadnie
const base = { ...raw([old]), achievements: {}, profile: {}, maxLevel: 1 }
const local = game.migrateState(base)
const remote = game.migrateState({ ...base, quests: [{ ...old, name: 'Trening siłowy 4×' }] })
expect('scalanie z base bez pola', mergeStates(base, local, remote).quests[0].name, 'Trening siłowy 4×')
const remoteManual = game.migrateState({ ...base, quests: [{ ...old, category: 'mind' }] })
expect('scalanie ręcznej kategorii', mergeStates(base, local, remoteManual).quests[0].category, 'mind')

if (errors.length) {
  console.log(`[${lang}] ${errors.length} problemów:\n  ${errors.slice(0, 30).join('\n  ')}`)
  process.exit(1)
}
console.log(`[${lang}] OK — ${HABITS.length} nawyków, ${cases} kombinacji odpowiedzi`)

// --- Poziomy -------------------------------------------------------------

export const expForLevel = (level) => 100 + (level - 1) * 40

export function levelFromExp(totalExp) {
  let level = 1
  let current = totalExp
  while (current >= expForLevel(level)) {
    current -= expForLevel(level)
    level++
  }
  return { level, current, needed: expForLevel(level) }
}

const TITLES = [
  [1, 'Nowicjusz Popiołu'],
  [3, 'Strażnik Zmierzchu'],
  [5, 'Rycerz Krwawego Księżyca'],
  [8, 'Pogromca Cieni'],
  [12, 'Władca Otchłani'],
  [20, 'Wieczny Płomień'],
]

export const titleFor = (level) => TITLES.filter(([min]) => level >= min).at(-1)[1]

export const LEVEL_UP_LINES = [
  'Krew przelana w trudzie nie wsiąka w ziemię na próżno. Ciemność cofa się przed twoją wolą.',
  'Pieczęcie pękają jedna po drugiej. Otchłań zaczyna szeptać twoje imię.',
  'Ciało hartowane w żelazie, duch w ogniu. Wstań — silniejszy niż wczoraj.',
  'Kolejny krąg przekroczony. Stare runy rozbłysły, nowe już czekają.',
  'Nawet cienie kłaniają się temu, kto nie odpuszcza.',
]

// --- Runy (Elder Futhark, rysowane w viewBox 24x24) ----------------------

export const RUNES = [
  'M12 3v18M12 11 6 4M12 11l6-7', // Algiz
  'M12 3v18M12 3 6.5 9M12 3l5.5 6', // Tiwaz
  'M15.5 3 8 10.5l8 3.5-7.5 7', // Sowilo
  'M8 3v18M8 9l8-5M8 14.5l8-5', // Fehu
  'M7.5 21V4l9 4.5V21', // Uruz
  'M8 3v18M8 7.5l7 4.5-7 4.5', // Thurisaz
  'M16 4 8 12l8 8', // Kenaz
  'M12 3l5.5 5.5L7 19M12 3 6.5 8.5 17 19', // Othala
  'M12 4l6 8-6 8-6-8z', // Ingwaz
]

// --- Kategorie: rozpoznawane automatycznie z nazwy ----------------------
// Kolejność ma znaczenie — pierwsza pasująca kategoria wygrywa.

export const CATEGORIES = {
  vit: {
    label: 'Zdrowie',
    tier: 'gold',
    exp: 25,
    rune: 3,
    words: ['posił', 'jedz', 'białk', 'bialk', 'skyr', 'śniad', 'sniad', 'obiad', 'kolac', 'dieta', 'kalor', 'warzyw', 'owoc', 'wod', 'pić', 'pic ', 'nawodn', ' sen ', ' snu', 'spać', 'spac ', 'spanie', 'drzemk', 'suplement', 'kreatyn', 'witamin', 'gotow', 'air fryer', 'meal', 'protein', 'zdrow'],
  },
  mind: {
    label: 'Umysł',
    tier: 'gold',
    exp: 25,
    rune: 2,
    words: ['czyt', 'książ', 'ksiaz', 'nauk', 'ucz', 'medyt', 'dziennik', 'journal', 'kurs', 'język', 'jezyk', 'angiel', 'niemiec', 'programow', 'kod', 'pisa', 'oddech', 'modlit', 'podcast'],
  },
  end: {
    label: 'Kondycja',
    tier: 'blood',
    exp: 30,
    rune: 4,
    words: ['core', 'brzuch', 'plank', 'deska', 'bieg', 'biega', 'cardio', 'kardio', 'rower', 'spacer', 'krok', 'pływ', 'plyw', 'rozciąg', 'rozciag', 'stretch', 'joga', 'yoga', 'mobiln', 'skakank', 'marsz', 'hiit', 'kondycj'],
  },
  str: {
    label: 'Siła',
    tier: 'blood',
    exp: 40,
    rune: 0,
    words: ['trening', 'siłow', 'silow', 'upper', 'lower', 'push', 'pull', 'nogi', 'klat', 'plecy', 'barki', 'ramion', 'ciężar', 'ciezar', 'przysiad', 'martwy', 'wyciska', 'pompk', 'podciąg', 'podciag', 'kalisten', 'gym', 'fbw', 'split', 'hantl', 'sztang'],
  },
  life: {
    label: 'Codzienność',
    tier: 'gold',
    exp: 15,
    rune: 7,
    words: [],
  },
}

export function detectCategory(name) {
  const text = ` ${name.toLowerCase()} `
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    if (cat.words.some((w) => text.includes(w))) return key
  }
  return 'life'
}

// wszystko, czego użytkownik nie musi ustawiać — wynika z nazwy
export function autoProps(name) {
  const category = detectCategory(name)
  const c = CATEGORIES[category]
  return { attr: category, tier: c.tier, exp: c.exp, rune: c.rune }
}

export const TIERS = {
  blood: { main: '#e0223d', bright: '#ff5a6e', glow: 'rgba(224, 34, 61, 0.65)' },
  gold: { main: '#e2b45a', bright: '#ffe3a0', glow: 'rgba(226, 180, 90, 0.6)' },
}

// --- Kalendarz ----------------------------------------------------------

export const dayKey = (date = new Date()) => date.toLocaleDateString('sv-SE')

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function shiftDays(offset, from = new Date()) {
  const d = new Date(from)
  d.setDate(d.getDate() + offset)
  return d
}

export const shiftKey = (key, offset) => dayKey(shiftDays(offset, parseKey(key)))

// tydzień zaczyna się w poniedziałek; dni przechowujemy jak Date.getDay() (0 = niedziela)
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]
export const DAY_SHORT = { 1: 'Pn', 2: 'Wt', 3: 'Śr', 4: 'Cz', 5: 'Pt', 6: 'Sb', 0: 'Nd' }
export const DAY_LONG = { 1: 'poniedziałek', 2: 'wtorek', 3: 'środa', 4: 'czwartek', 5: 'piątek', 6: 'sobota', 0: 'niedziela' }
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]
export const WORK_DAYS = [1, 2, 3, 4, 5]

export function weekStart(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

export const formatDay = (key, opts = { weekday: 'long', day: 'numeric', month: 'long' }) =>
  parseKey(key).toLocaleDateString('pl-PL', opts)

// opis powtarzania w ludzkim języku
export function describeRepeat(quest) {
  if (quest.date) return formatDay(quest.date, { weekday: 'short', day: 'numeric', month: 'short' })
  const d = [...quest.days].sort()
  if (d.length === 7) return 'codziennie'
  if (d.join() === '1,2,3,4,5') return 'dni robocze'
  if (d.join() === '0,6') return 'weekendy'
  if (d.length === 0) return 'wstrzymany'
  return WEEK_ORDER.filter((x) => d.includes(x)).map((x) => DAY_SHORT[x]).join(' ')
}

export function partOfDay(time) {
  if (!time) return 'any'
  const h = Number(time.slice(0, 2))
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

// --- Dawny plan startowy (tylko do migracji starszych zapisów) ------------

const DEFAULT_PLAN = [
  {
    id: 'q-core',
    name: 'Kalistenika - Core',
    time: '07:30',
    days: [1, 3, 5, 6],
    steps: ['Plank 3×45 s', 'Hollow body 3×30 s', 'Unoszenie nóg 3×12'],
  },
  { id: 'q-protein', name: 'Wysokobiałkowy posiłek (Skyr/Air Fryer)', time: '13:00', days: ALL_DAYS, steps: [] },
  {
    id: 'q-upper-lower',
    name: 'Trening Upper/Lower',
    time: '18:00',
    days: [1, 2, 4, 5],
    steps: ['Rozgrzewka', 'Ćwiczenia główne', 'Akcesoria', 'Rozciąganie'],
  },
]

const DEFAULT_IDS = new Set(DEFAULT_PLAN.map((q) => q.id))

// --- Stan gry i migracja --------------------------------------------------

export const STATE_VERSION = 3

export function createInitialState() {
  const today = dayKey()
  return {
    version: STATE_VERSION,
    totalExp: 0,
    maxLevel: 1,
    profile: { name: 'Wędrowiec', startedAt: today },
    // nowa osoba zaczyna z pustym planem i poradnikiem
    onboarded: false,
    cleanedDefaults: true,
    quests: [],
    history: {},
    steps: {},
    achievements: {},
  }
}

// starsze zapisy (v1: bez harmonogramu, v2: ręczne kategorie) → v3
export function migrateState(raw) {
  const base = createInitialState()
  if (!raw || typeof raw !== 'object') return base
  const history = raw.history ?? {}
  const merged =
    raw.version === STATE_VERSION ? { ...base, ...raw, profile: { ...base.profile, ...raw.profile } } : migrateLegacy(raw, base, history)

  // Starsze zapisy mogą mieć dawne zadania przykładowe. Usuwamy je jednorazowo,
  // ale tylko te, których nigdy nie odhaczono — używane zostają.
  if (!raw.cleanedDefaults) {
    const used = new Set(Object.values(history).flat())
    merged.quests = merged.quests.filter((q) => !(DEFAULT_IDS.has(q.id) && !q.custom && !used.has(q.id)))
    merged.cleanedDefaults = true
  }
  return merged
}

function migrateLegacy(raw, base, history) {
  const firstDay = raw.profile?.startedAt ?? Object.keys(history).sort()[0] ?? base.profile.startedAt
  const defaults = Object.fromEntries(DEFAULT_PLAN.map((q) => [q.id, q]))

  return {
    ...base,
    totalExp: raw.totalExp ?? 0,
    maxLevel: raw.maxLevel ?? 1,
    profile: { name: raw.profile?.name ?? base.profile.name, startedAt: firstDay },
    history,
    achievements: raw.achievements ?? {},
    quests: (raw.quests ?? []).map((q) => ({
      date: null,
      createdAt: firstDay,
      archivedAt: null,
      ...q,
      ...autoProps(q.name),
      days: q.days ?? defaults[q.id]?.days ?? ALL_DAYS,
      time: q.time ?? defaults[q.id]?.time ?? null,
      steps: q.steps ?? defaults[q.id]?.steps ?? [],
    })),
  }
}

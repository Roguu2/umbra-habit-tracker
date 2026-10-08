import { locale, t } from './i18n.js'
import { toKey } from './schedule.js'

// --- Poziomy -------------------------------------------------------------

export const expForLevel = (level) => 100 + (level - 1) * 40

// łączne EXP potrzebne, żeby dojść do danego poziomu (od zera)
export const expToReach = (level) => (level - 1) * 100 + 20 * (level - 1) * (level - 2)

export function levelFromExp(totalExp) {
  let level = 1
  let current = totalExp
  while (current >= expForLevel(level)) {
    current -= expForLevel(level)
    level++
  }
  return { level, current, needed: expForLevel(level) }
}

// EXP zawsze wynika z historii i obecnej wartości zadań — nie trzymamy osobnego licznika,
// który mógłby się rozjechać (np. po zmianie nazwy zadania albo przy scalaniu synchronizacji)
export function totalExpOf(state) {
  const exp = Object.fromEntries(state.quests.map((q) => [q.id, q.exp]))
  let total = 0
  for (const ids of Object.values(state.history)) for (const id of ids) total += exp[id] ?? 0
  return total
}

// wypalone pieczęcie: wszystkie wykonania zadań w historii. Nigdy nie spada przy utracie passy,
// a dni przerwy i tarcze niczego nie dodają, bo nie trafiają do historii.
export function sealsOf(state) {
  const known = new Set(state.quests.map((q) => q.id))
  let seals = 0
  for (const ids of Object.values(state.history)) for (const id of ids) if (known.has(id)) seals++
  return seals
}

const TITLES = [
  [1, t('Nowicjusz Popiołu', 'Ash Novice')],
  [3, t('Strażnik Zmierzchu', 'Dusk Warden')],
  [5, t('Rycerz Krwawego Księżyca', 'Knight of the Blood Moon')],
  [8, t('Pogromca Cieni', 'Shadowbane')],
  [12, t('Władca Otchłani', 'Lord of the Abyss')],
  [20, t('Wieczny Płomień', 'Eternal Flame')],
]

export const titleFor = (level) => TITLES.filter(([min]) => level >= min).at(-1)[1]

export const LEVEL_UP_LINES = [
  t(
    'Krew przelana w trudzie nie wsiąka w ziemię na próżno. Ciemność cofa się przed twoją wolą.',
    'Blood spilled in toil is never wasted. The darkness recoils before your will.',
  ),
  t('Pieczęcie pękają jedna po drugiej. Otchłań zaczyna szeptać twoje imię.', 'The seals break one by one. The Abyss begins to whisper your name.'),
  t('Ciało hartowane w żelazie, duch w ogniu. Wstań — silniejszy niż wczoraj.', 'Body tempered in iron, spirit in fire. Rise — stronger than yesterday.'),
  t('Kolejny krąg przekroczony. Stare runy rozbłysły, nowe już czekają.', 'Another circle crossed. The old runes blaze, new ones await.'),
  t('Nawet cienie kłaniają się temu, kto nie odpuszcza.', 'Even shadows bow to those who never yield.'),
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
// Kolejność ma znaczenie — pierwsza pasująca kategoria wygrywa. Słowa polskie i angielskie
// działają w obu językach; krótkie angielskie słowa mają spację z przodu (" eat" nie złapie "great").

export const CATEGORIES = {
  vit: {
    label: t('Zdrowie', 'Vitality'),
    tier: 'gold',
    exp: 25,
    rune: 3,
    words: [
      'posił', 'jedz', 'białk', 'bialk', 'skyr', 'śniad', 'sniad', 'obiad', 'kolac', 'dieta', 'kalor', 'warzyw', 'owoc', 'wod', 'pić', 'pic ', 'nawodn', ' sen ', ' snu', 'spać', 'spac ', 'spanie', 'drzemk', 'suplement', 'kreatyn', 'witamin', 'gotow', 'air fryer', 'meal', 'protein', 'zdrow',
      ' eat', 'breakfast', 'brunch', 'lunch', 'dinner', 'supper', 'bread', 'water', 'drink', 'hydrat', 'sleep', ' nap', 'vitamin', 'supplement', 'creatine', ' cook', 'diet', 'calorie', 'fruit', 'veggie', 'vegetable', 'salad', 'health',
    ],
  },
  mind: {
    label: t('Umysł', 'Mind'),
    tier: 'gold',
    exp: 25,
    rune: 2,
    words: [
      'czyt', 'książ', 'ksiaz', 'nauk', 'ucz', 'medyt', 'dziennik', 'journal', 'kurs', 'język', 'jezyk', 'angiel', 'niemiec', 'programow', 'kod', 'pisa', 'oddech', 'modlit', 'podcast',
      ' read', 'book', 'study', 'learn', 'meditat', 'course', 'language', 'english', 'spanish', 'german', 'french', ' code', 'coding', 'program', ' write', 'writing', 'breath', 'pray', 'lesson', 'homework',
    ],
  },
  end: {
    label: t('Kondycja', 'Endurance'),
    tier: 'blood',
    exp: 30,
    rune: 4,
    words: [
      'core', 'brzuch', 'plank', 'deska', 'bieg', 'biega', 'cardio', 'kardio', 'rower', 'spacer', 'krok', 'pływ', 'plyw', 'rozciąg', 'rozciag', 'stretch', 'joga', 'yoga', 'mobiln', 'skakank', 'marsz', 'hiit', 'kondycj',
      ' run', ' jog', ' bike', 'cycling', ' walk', 'steps', ' swim', 'mobility', 'jump rope', ' hike', 'hiking', ' abs', 'rowing',
    ],
  },
  str: {
    label: t('Siła', 'Strength'),
    tier: 'blood',
    exp: 40,
    rune: 0,
    words: [
      'trening', 'siłow', 'silow', 'upper', 'lower', 'push', 'pull', 'nogi', 'klat', 'plecy', 'barki', 'ramion', 'ciężar', 'ciezar', 'przysiad', 'martwy', 'wyciska', 'pompk', 'podciąg', 'podciag', 'kalisten', 'gym', 'fbw', 'split', 'hantl', 'sztang',
      'workout', 'training', ' lift', 'strength', 'squat', 'deadlift', 'bench', 'calisthen', 'weights', 'dumbbell', 'barbell', 'leg day', 'chest', ' arms', 'shoulder',
    ],
  },
  life: {
    label: t('Codzienność', 'Daily Life'),
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

export const dayKey = (date = new Date()) => toKey(date)

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
export const DAY_SHORT = t(
  { 1: 'Pn', 2: 'Wt', 3: 'Śr', 4: 'Cz', 5: 'Pt', 6: 'Sb', 0: 'Nd' },
  { 1: 'Mo', 2: 'Tu', 3: 'We', 4: 'Th', 5: 'Fr', 6: 'Sa', 0: 'Su' },
)
export const DAY_LONG = t(
  { 1: 'poniedziałek', 2: 'wtorek', 3: 'środa', 4: 'czwartek', 5: 'piątek', 6: 'sobota', 0: 'niedziela' },
  { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 0: 'Sunday' },
)
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]
export const WORK_DAYS = [1, 2, 3, 4, 5]

export function weekStart(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

export const formatDay = (key, opts = { weekday: 'long', day: 'numeric', month: 'long' }) =>
  parseKey(key).toLocaleDateString(locale(), opts)

// opis powtarzania w ludzkim języku
export function describeRepeat(quest) {
  if (quest.date) return formatDay(quest.date, { weekday: 'short', day: 'numeric', month: 'short' })
  if (quest.perWeek) return t(`${quest.perWeek}× w tygodniu`, `${quest.perWeek}× a week`)
  const d = [...quest.days].sort()
  if (d.length === 7) return t('codziennie', 'daily')
  if (d.join() === '1,2,3,4,5') return t('dni robocze', 'weekdays')
  if (d.join() === '0,6') return t('weekendy', 'weekends')
  if (d.length === 0) return t('wstrzymany', 'paused')
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
    maxLevel: 1,
    profile: { name: t('Wędrowiec', 'Wanderer'), startedAt: today },
    // nowa osoba zaczyna z pustym planem i poradnikiem
    onboarded: false,
    cleanedDefaults: true,
    quests: [],
    history: {},
    steps: {},
    counts: {}, // liczniki: counts[dzień][id zadania] = ile
    pauses: [], // tryb urlopu: [{ from, to }], to = null — trwa
    achievements: {},
    comebackSeen: null, // dzień ostatniego ogłoszonego powrotu z cienia (lib/comeback.js) — komunikat tylko raz
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
  // dawny licznik EXP — teraz EXP liczy się z historii (totalExpOf)
  delete merged.totalExp
  return merged
}

function migrateLegacy(raw, base, history) {
  const firstDay = raw.profile?.startedAt ?? Object.keys(history).sort()[0] ?? base.profile.startedAt
  const defaults = Object.fromEntries(DEFAULT_PLAN.map((q) => [q.id, q]))

  return {
    ...base,
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

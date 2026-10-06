// --- Języki: polski i angielski ------------------------------------------------
// Teksty zapisujemy w miejscu użycia jako t('po polsku', 'in English') — bez słowników i kluczy.
// Język jest ustalany raz przy starcie strony; zmiana przeładowuje stronę, więc także stałe
// na poziomie modułów (np. nazwy kategorii) zawsze są w dobrym języku.

const KEY = 'umbra-habit-tracker:lang'
export const LANGS = ['pl', 'en']

function detect() {
  try {
    const saved = localStorage.getItem(KEY)
    if (LANGS.includes(saved)) return saved
  } catch {
    // brak dostępu do storage
  }
  const nav = typeof navigator !== 'undefined' ? (navigator.languages?.[0] ?? navigator.language ?? '') : ''
  return nav.toLowerCase().startsWith('pl') ? 'pl' : 'en'
}

const current = detect()
if (typeof document !== 'undefined') document.documentElement.lang = current

export const lang = () => current
export const t = (pl, en) => (current === 'en' ? en : pl)
export const locale = () => (current === 'en' ? 'en-GB' : 'pl-PL')

// odmiana liczebników: plural(n, ['zadanie', 'zadania', 'zadań'], ['quest', 'quests'])
export function plural(n, pl, en) {
  if (current === 'en') return n === 1 ? en[0] : en[1]
  if (n === 1) return pl[0]
  const d = n % 10
  const dd = n % 100
  return d >= 2 && d <= 4 && (dd < 12 || dd > 14) ? pl[1] : pl[2]
}

export function setLang(next) {
  if (next === current) return
  try {
    localStorage.setItem(KEY, next)
  } catch {
    // brak dostępu do storage
  }
  location.reload()
}

// Harmonogram zadań — bez zależności, bo używa go też serwer (przypomnienia push).

// Zadanie "istnieje" w danym dniu, jeśli zostało utworzone wcześniej i nie zostało usunięte.
export const existsOn = (quest, key) => quest.createdAt <= key && (!quest.archivedAt || key < quest.archivedAt)

const toDate = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const toKey = (date) => date.toLocaleDateString('sv-SE')

// nawyk "X razy w tygodniu" — w dowolne dni, więc nie jest wymagany w żadnym konkretnym dniu
export const isFlexible = (quest) => Boolean(quest.perWeek)

export function isScheduledOn(quest, key) {
  if (!existsOn(quest, key) || isFlexible(quest)) return false
  if (quest.date) return quest.date === key
  return quest.days.includes(toDate(key).getDay())
}

// tryb urlopu: dni w przerwie nie liczą się do pass ani skuteczności
export const isPaused = (state, key) => (state.pauses ?? []).some((p) => key >= p.from && (!p.to || key <= p.to))

// klucze dni tygodnia (pn–nd), do którego należy dany dzień
export function weekKeys(key) {
  const d = toDate(key)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d)
    day.setDate(d.getDate() + i)
    return toKey(day)
  })
}

// ile razy wykonano nawyk w tygodniu danego dnia (do tego dnia włącznie)
export function weekCount(state, quest, key) {
  return weekKeys(key).filter((k) => k <= key && (state.history[k] ?? []).includes(quest.id)).length
}

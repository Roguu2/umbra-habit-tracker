// Harmonogram zadań — bez zależności, bo używa go też serwer (przypomnienia push).

// Zadanie "istnieje" w danym dniu, jeśli zostało utworzone wcześniej i nie zostało usunięte.
const existsOn = (quest, key) => quest.createdAt <= key && (!quest.archivedAt || key < quest.archivedAt)

const weekday = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

export function isScheduledOn(quest, key) {
  if (!existsOn(quest, key)) return false
  if (quest.date) return quest.date === key
  return quest.days.includes(weekday(key))
}

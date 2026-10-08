// --- Powrót z cienia ---------------------------------------------------------------------
// Gdy przepadnie passa licząca co najmniej MIN_LOST_STREAK dni (i nie uratuje jej tarcza), pierwszy dzień
// z wykonanym zadaniem po jej utracie to "powrót z cienia": jednorazowy komunikat i RETURN_BONUS EXP.
// Bonus wynika z historii, tak jak EXP z zadań (totalExpOf) — nie ma osobnego licznika. Jeśli później
// użyjesz tarczy na dzień utraty, passa wraca, a powrót i jego bonus znikają.

import { dayKey } from './game'
import { dayOutcome, keysBetween } from './stats'

export const MIN_LOST_STREAK = 3
export const RETURN_BONUS = 20

// dni powrotów, od najstarszego; reguły passy jak w perfectDayStreak (dni bez planu i przerwy jej nie przerywają)
export function returnDays(state, today = dayKey()) {
  const days = []
  let streak = 0
  let lost = false
  for (const key of keysBetween(state.profile.startedAt, today)) {
    const day = dayOutcome(state, key)
    // passa przepada dopiero z końcem niepełnego dnia, więc zadania z tego samego dnia nie są powrotem
    if (lost && day.done > 0) {
      days.push(key)
      lost = false
    }
    if (key === today || !day.counted) continue // dzisiejszy dzień jeszcze trwa
    if (day.perfect) {
      streak++
    } else {
      if (streak >= MIN_LOST_STREAK) lost = true
      streak = 0
    }
  }
  return days
}

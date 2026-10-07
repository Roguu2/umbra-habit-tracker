// --- Tarcze passy ---------------------------------------------------------------------
// Co SHIELD_EVERY poziomów (liczy się najwyższy osiągnięty) przybywa jedna tarcza. Użyta tarcza to
// jednodniowa przerwa z flagą shield w state.pauses — dzień przestaje się liczyć tak jak przy urlopie,
// więc passa i serie zostają. Zapis w stanie gry synchronizuje się z innymi urządzeniami.

import { shiftKey } from './game'
import { SHIELD_EVERY } from './rewards'
import { dayStats, perfectDayStreak } from './stats'

// dłuższej przerwy tarcze nie łatają — wtedy to już nie potknięcie, tylko urlop
export const MAX_RESCUE_DAYS = 3
// ratujemy passy warte ratowania
export const MIN_RESCUE_STREAK = 3

export const shieldsEarned = (maxLevel) => Math.floor(maxLevel / SHIELD_EVERY)
export const shieldsUsed = (state) => (state.pauses ?? []).filter((p) => p.shield).length
export const shieldsLeft = (state, maxLevel) => Math.max(0, shieldsEarned(maxLevel) - shieldsUsed(state))

// Czy passa właśnie przepadła i tarcze mogą ją ocalić: { days, streak } albo null.
// days — kolejne niepełne dni od wczoraj wstecz (dni bez planu pomijamy, jak przy liczeniu passy);
// streak — passa sprzed potknięcia, która wróci po użyciu tarcz.
export function rescueOffer(state, today, maxLevel) {
  const days = []
  let key = shiftKey(today, -1)
  for (; key >= state.profile.startedAt; key = shiftKey(key, -1)) {
    const s = dayStats(state, key)
    if (s.ratio === null) continue
    if (s.perfect) break
    days.push(key)
    if (days.length > MAX_RESCUE_DAYS) return null
  }
  if (!days.length || key < state.profile.startedAt) return null

  const streak = perfectDayStreak(state, key)
  if (streak < MIN_RESCUE_STREAK || days.length > shieldsLeft(state, maxLevel)) return null
  return { days, streak }
}

// nowe przerwy dla dni ocalonych tarczami
export const shieldPauses = (days) => days.map((day) => ({ from: day, to: day, shield: true }))

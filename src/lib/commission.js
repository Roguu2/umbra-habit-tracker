// --- Zlecenie dnia ----------------------------------------------------------------------------
// Raz dziennie jedna propozycja łatwego nawyku z katalogu (habits.js), którego nie ma w planie — kolejność
// kandydatów wynika z daty (deterministyczny hash). Przyjęte zlecenie to zwykłe zadanie z polem
// quest.commission = dzień przyjęcia; jego wykonanie w tym dniu daje +25% EXP (completionExp w game.js).
// Pole jest częścią zadania, więc przechodzi przez migrację i scalanie synchronizacji razem z nim.

import { HABITS } from './habits.js'
import { hash01 } from './random.js'

export const COMMISSION_BONUS = 0.25

// kandydaci na zlecenie dnia, od pierwszego: łatwe nawyki z katalogu spoza planu
export function commissionsFor(key, existingNames = []) {
  const taken = new Set(existingNames.map((n) => n.trim().toLowerCase()))
  return HABITS.filter((h) => h.lvl === 1 && !taken.has(h.name.toLowerCase()))
    .map((h) => ({ h, order: hash01(`commission|${key}|${h.id}`) }))
    .sort((a, b) => a.order - b.order)
    .map(({ h }) => h)
}

// dodatek do mnożnika EXP: wykonanie przyjętego zlecenia w dniu, w którym je przyjęto
export const commissionBonus = (quest, key) => (quest.commission === key ? COMMISSION_BONUS : 0)

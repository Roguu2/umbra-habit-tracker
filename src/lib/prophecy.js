// --- Przepowiednia dnia -------------------------------------------------------------------
// Jedna karta dziennie: krótki tekst i kategoria, która tego dnia daje +20% EXP. Wynika wyłącznie z daty
// (deterministyczny hash), więc każde urządzenie widzi to samo. Bonus liczy się w completionExp (game.js),
// a więc spójnie w EXP, atrybutach, statystykach dnia i obrażeniach strażnika tygodnia.
// Działa od PROPHECY_SINCE — wcześniejsze dni nie dostają bonusu, żeby nie zmieniać EXP wstecz.

import { t } from './i18n.js'
import { pick } from './random.js'

export const PROPHECY_SINCE = '2026-10-08'
export const PROPHECY_BONUS = 0.2

const OMENS = {
  str: [
    t('Krew wre w żyłach. Dziś siła tnie głębiej.', 'Blood boils in your veins. Today strength cuts deeper.'),
    t('Żelazo śpiewa pod twoją dłonią. Podnieś ciężar losu.', 'Iron sings beneath your hand. Lift the weight of fate.'),
  ],
  end: [
    t('Wiatr niesie twoje kroki dalej niż zwykle.', 'The wind carries your steps further than usual.'),
    t('Droga sama ściele się pod stopy wytrwałych.', 'The road unrolls itself beneath the enduring.'),
  ],
  vit: [
    t('Źródła płyną czyściej. Ciało przyjmie każdą dobroć.', 'The springs run clearer. The body welcomes every kindness.'),
    t('Księżyc sprzyja odpoczynkowi i strawie.', 'The moon favours rest and nourishment.'),
  ],
  mind: [
    t('Runy świecą jaśniej. Wiedza wchodzi łatwiej niż zwykle.', 'The runes glow brighter. Knowledge comes easier than usual.'),
    t('Cisza otwiera zamknięte księgi.', 'Silence opens sealed tomes.'),
  ],
  life: [
    t('Porządek w izbie, porządek w duszy. Dziś drobne czyny ważą więcej.', 'Order in the hall, order in the soul. Small deeds weigh more today.'),
    t('Duchy domowego ogniska czuwają nad twoimi sprawami.', 'The spirits of the hearth watch over your errands.'),
  ],
}
const ATTRS = Object.keys(OMENS)

// przepowiednia na dany dzień: { attr, bonus, text } albo null przed PROPHECY_SINCE
export function prophecyFor(key) {
  if (key < PROPHECY_SINCE) return null
  const attr = pick(ATTRS, `prophecy|${key}`)
  return { attr, bonus: PROPHECY_BONUS, text: pick(OMENS[attr], `omen|${key}`) }
}

// dodatek do mnożnika EXP dla zadania z danej kategorii w danym dniu
export const prophecyBonus = (key, attr) => (prophecyFor(key)?.attr === attr ? PROPHECY_BONUS : 0)

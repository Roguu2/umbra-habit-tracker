// --- Strażnik tygodnia (boss) -------------------------------------------------------------
// Cel tygodnia (pn–nd): pasek wytrzymałości bossa, który topnieje od prawdziwych wykonań zadań.
// Obrażenia zadania = jego EXP (completionExp — minimum dnia liczy się tak jak w EXP); zadania z atrybutu
// będącego słabością bossa ranią go o połowę mocniej. Nie ma porażki: niepokonany boss znika z końcem
// tygodnia, a nagroda za pokonanie jest wyłącznie kosmetyczna (relikt w bestiariuszu).
// Wszystko wynika z historii — bez osobnego licznika obrażeń i bez nowych pól w stanie gry.

import { completionExp, shiftKey } from './game.js'
import { existsOn, isFlexible, isScheduledOn, pauseOn, weekKeys } from './schedule.js'
import { t } from './i18n.js'

export const WEAKNESS_BONUS = 1.5
export const HP_SHARE = 0.75 // wytrzymałość = 75% średniego tygodniowego EXP gracza
export const HP_HISTORY_WEEKS = 4 // z ilu ostatnich pełnych tygodni liczymy średnią
export const MIN_HISTORY_WEEKS = 2 // poniżej — gracz jest nowy i dostaje stałą, łagodną wartość
export const NEW_PLAYER_HP = 150
export const MIN_HP = 100
export const MAX_HP = 1200

// słabości rotują co tydzień (str → end → vit → mind → life), bo kolejne bossy mają kolejne słabości
export const BOSSES = [
  {
    id: 'soulless-knight',
    name: t('Bezduszny Rycerz', 'Soulless Knight'),
    desc: t('Pusta zbroja, która wciąż pamięta rozkazy. Tylko siła rozbija tę stal.', 'Empty armour that still remembers its orders. Only strength breaks this steel.'),
    weakness: 'str',
    relic: t('Pęknięty hełm', 'Cracked Helm'),
    rune: 0,
  },
  {
    id: 'ash-golem',
    name: t('Popielny Golem', 'Ash Golem'),
    desc: t('Ociężały kolos z popiołu i żużlu. Rozsypuje się pod ciosami tych, którzy nie ustają w ruchu.', 'A sluggish colossus of ash and slag. It crumbles before those who never stop moving.'),
    weakness: 'end',
    relic: t('Rdzeń z żużlu', 'Slag Core'),
    rune: 4,
  },
  {
    id: 'sleep-wraith',
    name: t('Widmo Bezsenności', 'Wraith of Sleeplessness'),
    desc: t('Szepcze nocą i kradnie sen. Słabnie, gdy dbasz o ciało.', 'It whispers at night and steals your sleep. It weakens when you tend your body.'),
    weakness: 'vit',
    relic: t('Zgaszona latarnia', 'Snuffed Lantern'),
    rune: 3,
  },
  {
    id: 'mire-witch',
    name: t('Wiedźma z Mokradeł', 'Mire Witch'),
    desc: t('Plącze myśli jak sieci. Jasny umysł przecina jej uroki.', 'She tangles thoughts like nets. A clear mind cuts through her hexes.'),
    weakness: 'mind',
    relic: t('Splątany różaniec', 'Tangled Rosary'),
    rune: 2,
  },
  {
    id: 'clutter-hydra',
    name: t('Hydra Bałaganu', 'Hydra of Clutter'),
    desc: t('Za każdą odciętą głową rosną dwie zaległe sprawy. Porządek ją dusi.', 'For every head cut off, two overdue chores grow back. Order chokes it.'),
    weakness: 'life',
    relic: t('Ząb hydry', 'Hydra Fang'),
    rune: 7,
  },
  {
    id: 'iron-ogre',
    name: t('Żelazny Ogr', 'Iron Ogre'),
    desc: t('Wali pięściami jak taranem. Uszanuje tylko większą siłę.', 'It strikes like a battering ram. It respects only greater strength.'),
    weakness: 'str',
    relic: t('Żelazna obręcz', 'Iron Collar'),
    rune: 5,
  },
  {
    id: 'fog-stalker',
    name: t('Łowca we Mgle', 'Fog Stalker'),
    desc: t('Krąży, aż zmęczysz się pierwszy. Wytrwali dochodzą go do końca.', 'It circles until you tire first. The enduring hunt it down.'),
    weakness: 'end',
    relic: t('Szary płaszcz', 'Grey Cloak'),
    rune: 6,
  },
  {
    id: 'rat-king',
    name: t('Szczurzy Król', 'Rat King'),
    desc: t('Gnieździ się tam, gdzie ciało zaniedbane. Zdrowe nawyki wypłaszają go na światło.', 'It nests wherever the body is neglected. Healthy habits drive it into the light.'),
    weakness: 'vit',
    relic: t('Korona z kości', 'Bone Crown'),
    rune: 1,
  },
  {
    id: 'whispering-tome',
    name: t('Szepcząca Księga', 'Whispering Tome'),
    desc: t('Księga, która czyta ciebie. Pokona ją ten, kto sam czyta i uczy się więcej.', 'A book that reads you. Only one who reads and learns more can close it.'),
    weakness: 'mind',
    relic: t('Zapieczętowana karta', 'Sealed Page'),
    rune: 8,
  },
  {
    id: 'chaos-imp',
    name: t('Chochlik Chaosu', 'Imp of Chaos'),
    desc: t('Przestawia rzeczy, gubi klucze, psuje plany. Rutyna to jego klatka.', 'It moves things, loses keys, ruins plans. Routine is its cage.'),
    weakness: 'life',
    relic: t('Klucz chochlika', "Imp's Key"),
    rune: 7,
  },
]

// --- tydzień ---------------------------------------------------------------------------

// numer tygodnia liczony od daty poniedziałku (w UTC, z samego klucza RRRR-MM-DD) — ten sam
// na każdym urządzeniu i w każdej strefie czasowej
const EPOCH_MONDAY = Date.UTC(1970, 0, 5)
export function weekIndex(key) {
  const [y, m, d] = weekKeys(key)[0].split('-').map(Number)
  return Math.round((Date.UTC(y, m - 1, d) - EPOCH_MONDAY) / (7 * 86400000))
}

export const bossOfWeek = (key) => BOSSES[((weekIndex(key) % BOSSES.length) + BOSSES.length) % BOSSES.length]

// urlop (nie tarcza passy — ta nie odbiera bossa) w którymkolwiek dniu tygodnia
const isVacationWeek = (state, keys) => keys.some((k) => pauseOn(state, k) && !pauseOn(state, k).shield)

// tydzień z planem: jakieś zadanie jest zaplanowane na któryś dzień albo istnieje nawyk "X razy w tygodniu"
const isPlannedWeek = (state, keys) =>
  state.quests.some((q) => keys.some((k) => (isFlexible(q) ? existsOn(q, k) : isScheduledOn(q, k))))

// EXP z wykonań w podanych dniach; weakness — atrybut, który rani mocniej (dla obrażeń bossa)
function expIn(state, keys, weakness = null) {
  const byId = Object.fromEntries(state.quests.map((q) => [q.id, q]))
  let total = 0
  for (const k of keys) {
    for (const id of state.history[k] ?? []) {
      const q = byId[id]
      if (!q) continue
      const exp = completionExp(state, q, k)
      total += q.attr === weakness ? Math.round(exp * WEAKNESS_BONUS) : exp
    }
  }
  return total
}

// --- wytrzymałość ------------------------------------------------------------------------

// 75% średniego EXP z ostatnich pełnych tygodni bez urlopu (od dnia startu gracza), w granicach MIN–MAX;
// liczona z poprzednich tygodni, więc nie zmienia się w trakcie bieżącego
export function bossHp(state, key) {
  const start = weekKeys(key)[0]
  const totals = []
  for (let i = 1; i <= HP_HISTORY_WEEKS * 3 && totals.length < HP_HISTORY_WEEKS; i++) {
    const keys = weekKeys(shiftKey(start, -7 * i))
    if (keys[0] < state.profile.startedAt) break // tydzień sprzed startu albo niepełny pierwszy tydzień
    if (isVacationWeek(state, keys)) continue
    totals.push(expIn(state, keys))
  }
  if (totals.length < MIN_HISTORY_WEEKS) return NEW_PLAYER_HP
  const average = totals.reduce((a, b) => a + b, 0) / totals.length
  return Math.min(MAX_HP, Math.max(MIN_HP, Math.round((average * HP_SHARE) / 10) * 10))
}

// --- stan bossa ----------------------------------------------------------------------------

// boss tygodnia, do którego należy dzień `key`, liczony do dnia `today` włącznie, albo null (urlop / brak planu):
// { boss, hp, damage, defeated, defeatedOn, weekStart, daysLeft }
export function weekBoss(state, key, today = key) {
  const keys = weekKeys(key)
  if (isVacationWeek(state, keys) || !isPlannedWeek(state, keys)) return null
  const boss = bossOfWeek(key)
  const hp = bossHp(state, key)
  let damage = 0
  let defeatedOn = null
  for (const k of keys) {
    if (k > today) break
    damage += expIn(state, [k], boss.weakness)
    if (!defeatedOn && damage >= hp) defeatedOn = k
  }
  return {
    boss,
    hp,
    damage: Math.min(damage, hp),
    defeated: defeatedOn !== null,
    defeatedOn,
    weekStart: keys[0],
    daysLeft: keys.filter((k) => k >= today).length, // łącznie z dzisiejszym
  }
}

// bestiariusz: wszyscy pokonani strażnicy, od najnowszego
export function defeatedBosses(state, today) {
  const out = []
  for (let k = weekKeys(state.profile.startedAt)[0]; k <= today; k = shiftKey(k, 7)) {
    const week = weekBoss(state, k, today)
    if (week?.defeated) out.push(week)
  }
  return out.reverse()
}

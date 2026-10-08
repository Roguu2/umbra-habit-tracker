// --- Atrybuty postaci ---------------------------------------------------------
// Każda kategoria zadań to atrybut z własnym poziomem, liczonym z EXP zdobytego w jej zadaniach.

import { CATEGORIES, completionExp, shiftKey } from './game'
import { isScheduledOn } from './schedule.js'
import { t } from './i18n.js'

// kolejność osi na radarze (od góry, zgodnie z ruchem wskazówek zegara)
export const ATTR_ORDER = ['str', 'end', 'vit', 'mind', 'life']
const MAIN = ['str', 'end', 'vit', 'mind']

export const attrExpForLevel = (level) => 50 + (level - 1) * 25

function attrLevel(exp) {
  let level = 1
  let current = exp
  while (current >= attrExpForLevel(level)) {
    current -= attrExpForLevel(level)
    level++
  }
  return { level, current, needed: attrExpForLevel(level) }
}

export const RECENT_DAYS = 14

export function attributeStats(state, today) {
  const byId = Object.fromEntries(state.quests.map((q) => [q.id, q]))
  const exp = Object.fromEntries(ATTR_ORDER.map((k) => [k, 0]))
  for (const [key, ids] of Object.entries(state.history)) {
    for (const id of ids) if (byId[id]) exp[byId[id].attr] += completionExp(state, byId[id], key)
  }

  // ostatnie 14 zakończonych dni: ile zaplanowano i ile wykonano w każdej kategorii
  const recent = Object.fromEntries(ATTR_ORDER.map((k) => [k, { planned: 0, done: 0 }]))
  for (let i = 1; i <= RECENT_DAYS; i++) {
    const key = shiftKey(today, -i)
    if (key < state.profile.startedAt) break
    const done = new Set(state.history[key] ?? [])
    for (const q of state.quests) {
      if (!isScheduledOn(q, key)) continue
      recent[q.attr].planned++
      if (done.has(q.id)) recent[q.attr].done++
    }
  }

  const hasQuests = new Set(state.quests.filter((q) => !q.archivedAt).map((q) => q.attr))

  return ATTR_ORDER.map((k) => ({
    k,
    label: CATEGORIES[k].label,
    tier: CATEGORIES[k].tier,
    rune: CATEGORIES[k].rune,
    exp: exp[k],
    ...attrLevel(exp[k]),
    recent: recent[k],
    active: hasQuests.has(k),
  }))
}

// --- Klasa postaci: wynika z proporcji atrybutów --------------------------------

export const SOLO = {
  str: {
    name: 'Berserker',
    desc: t('Siła płynie w twoich żyłach. Ciężary uginają się przed twoją wolą.', 'Strength flows through your veins. Iron bends to your will.'),
  },
  end: {
    name: t('Łowca Cieni', 'Shadow Hunter'),
    desc: t('Niezmordowany. Pokonujesz kolejne mile, gdy inni już dawno padli.', 'Tireless. You cover mile after mile long after others have fallen.'),
  },
  vit: {
    name: t('Druid Krwi', 'Blood Druid'),
    desc: t('Dbasz o ciało jak o świątynię — posiłki, sen i woda to twoje rytuały.', 'You tend your body like a temple — food, sleep and water are your rituals.'),
  },
  mind: {
    name: t('Mnich Popiołu', 'Ash Monk'),
    desc: t('Umysł ostry jak klinga. Księgi i cisza to twój oręż.', 'A mind sharp as a blade. Books and silence are your weapons.'),
  },
  life: {
    name: t('Strażnik Ogniska', 'Hearthkeeper'),
    desc: t('Utrzymujesz porządek codzienności. Małe czyny budują wielkie rzeczy.', 'You keep order in daily life. Small deeds build great things.'),
  },
}

export const PAIRS = {
  'end+str': {
    name: t('Wojownik Burzy', 'Stormwarrior'),
    desc: t('Siła i wytrzymałość w jednym ciele. Pole bitwy należy do ciebie.', 'Strength and stamina in one body. The battlefield is yours.'),
  },
  'mind+str': {
    name: t('Rycerz Run', 'Runeknight'),
    desc: t('Miecz w dłoni, wiedza w głowie. Rzadkie i groźne połączenie.', 'Sword in hand, knowledge in mind. A rare and dangerous blend.'),
  },
  'str+vit': {
    name: 'Gladiator',
    desc: t('Trenujesz ciężko i karmisz ciało jak należy. Arena czeka.', 'You train hard and feed your body right. The arena awaits.'),
  },
  'end+mind': {
    name: t('Wędrowny Asceta', 'Wandering Ascetic'),
    desc: t('Długie drogi i długie myśli. Spokój w ruchu.', 'Long roads and long thoughts. Stillness in motion.'),
  },
  'end+vit': {
    name: t('Zwiadowca', 'Ranger'),
    desc: t('Zawsze w drodze, zawsze w formie. Ciało gotowe na każdy szlak.', 'Always on the move, always in shape. A body ready for any trail.'),
  },
  'mind+vit': {
    name: t('Alchemik', 'Alchemist'),
    desc: t('Wiedza i zdrowie splecione w jedno. Warzysz eliksir lepszego życia.', 'Knowledge and health woven together. You brew the elixir of a better life.'),
  },
}

export const BALANCED = {
  name: t('Paladyn Równowagi', 'Paladin of Balance'),
  desc: t('Żaden atrybut nie dominuje — rozwijasz się na wszystkich frontach.', 'No attribute dominates — you grow on every front.'),
}
export const UNFORMED = {
  name: t('Bezimienny', 'The Nameless'),
  desc: t('Twoja ścieżka dopiero się kształtuje. Wypalaj pieczęcie, a klasa sama się objawi.', 'Your path is still taking shape. Burn the seals and your class will reveal itself.'),
}

export function characterClass(attrs) {
  const total = attrs.reduce((s, a) => s + a.exp, 0)
  if (total < 100) return UNFORMED
  const [first, second, third] = [...attrs].sort((a, b) => b.exp - a.exp)
  // wyraźna przewaga jednego atrybutu
  if (first.exp >= 1.6 * second.exp) return SOLO[first.k]
  // dwa atrybuty wyraźnie przed resztą
  if (second.exp >= 1.4 * third.exp) {
    const pair = PAIRS[[first.k, second.k].sort().join('+')]
    if (pair) return pair
    // para z codziennością — liczy się ten drugi atrybut
    return SOLO[first.k === 'life' ? second.k : first.k]
  }
  return BALANCED
}

// atrybut, który ostatnio kuleje (mniej niż połowa zaplanowanych w 14 dni), albo nieodkryty
export function weakSpot(attrs) {
  const lagging = attrs
    .filter((a) => MAIN.includes(a.k) && a.recent.planned >= 3 && a.recent.done / a.recent.planned < 0.5)
    .sort((a, b) => a.recent.done / a.recent.planned - b.recent.done / b.recent.planned)[0]
  if (lagging) return { type: 'lagging', attr: lagging }
  const missing = attrs.find((a) => MAIN.includes(a.k) && !a.active && a.exp === 0)
  if (missing) return { type: 'missing', attr: missing }
  return null
}

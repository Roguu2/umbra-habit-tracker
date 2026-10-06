// --- Atrybuty postaci ---------------------------------------------------------
// Każda kategoria zadań to atrybut z własnym poziomem, liczonym z EXP zdobytego w jej zadaniach.

import { CATEGORIES, shiftKey } from './game'
import { isScheduledOn } from './schedule.js'

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

const RECENT_DAYS = 14

export function attributeStats(state, today) {
  const byId = Object.fromEntries(state.quests.map((q) => [q.id, q]))
  const exp = Object.fromEntries(ATTR_ORDER.map((k) => [k, 0]))
  for (const ids of Object.values(state.history)) {
    for (const id of ids) if (byId[id]) exp[byId[id].attr] += byId[id].exp
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

const SOLO = {
  str: { name: 'Berserker', desc: 'Siła płynie w twoich żyłach. Ciężary uginają się przed twoją wolą.' },
  end: { name: 'Łowca Cieni', desc: 'Niezmordowany. Pokonujesz kolejne mile, gdy inni już dawno padli.' },
  vit: { name: 'Druid Krwi', desc: 'Dbasz o ciało jak o świątynię — posiłki, sen i woda to twoje rytuały.' },
  mind: { name: 'Mnich Popiołu', desc: 'Umysł ostry jak klinga. Księgi i cisza to twój oręż.' },
  life: { name: 'Strażnik Ogniska', desc: 'Utrzymujesz porządek codzienności. Małe czyny budują wielkie rzeczy.' },
}

const PAIRS = {
  'end+str': { name: 'Wojownik Burzy', desc: 'Siła i wytrzymałość w jednym ciele. Pole bitwy należy do ciebie.' },
  'mind+str': { name: 'Rycerz Run', desc: 'Miecz w dłoni, wiedza w głowie. Rzadkie i groźne połączenie.' },
  'str+vit': { name: 'Gladiator', desc: 'Trenujesz ciężko i karmisz ciało jak należy. Arena czeka.' },
  'end+mind': { name: 'Wędrowny Asceta', desc: 'Długie drogi i długie myśli. Spokój w ruchu.' },
  'end+vit': { name: 'Zwiadowca', desc: 'Zawsze w drodze, zawsze w formie. Ciało gotowe na każdy szlak.' },
  'mind+vit': { name: 'Alchemik', desc: 'Wiedza i zdrowie splecione w jedno. Warzysz eliksir lepszego życia.' },
}

const BALANCED = { name: 'Paladyn Równowagi', desc: 'Żaden atrybut nie dominuje — rozwijasz się na wszystkich frontach.' }
const UNFORMED = { name: 'Bezimienny', desc: 'Twoja ścieżka dopiero się kształtuje. Wypalaj pieczęcie, a klasa sama się objawi.' }

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

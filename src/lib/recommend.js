// --- Dobór nawyków na podstawie ankiety ------------------------------------------
// answers: {
//   goals:  1–2 z: str | end | vit | mind | calm | life
//   life:   desk | physical | study | shift | home   (jak wygląda zwykły dzień)
//   slot:   morning | midday | evening              (kiedy jest chwila dla siebie)
//   budget: 5 | 15 | 30                             (minut dziennie; 30 = 30 i więcej)
//   level:  new | some                              (dopiero zaczynam / mam już nawyki)
// }

import { ALL_DAYS, WORK_DAYS, detectCategory } from './game.js'
import { HABITS } from './habits.js'

// ile minut dziennie naprawdę mieści się w odpowiedzi
export const ALLOWANCE = { 5: 8, 15: 20, 30: 60 }
export const SLOT_TIME = { morning: '07:30', midday: '12:30', evening: '19:30' }

export function pickCount({ level, budget }) {
  if (level === 'new') return 3 // na start lepiej mało i łatwo
  return { 5: 3, 15: 4, 30: 5 }[budget] ?? 4
}

// średnio ile minut dziennie zajmuje nawyk (X razy w tygodniu rozkłada się na tydzień)
const dailyMinutes = (habit) => (typeof habit.repeat === 'number' ? (habit.min * habit.repeat) / 7 : habit.min)

function score(habit, a) {
  let s = 0
  if (habit.goals.some((g) => a.goals.includes(g))) s += 10
  if (habit.goals[0] && a.goals.includes(habit.goals[0])) s += 2 // główny cel nawyku trafia w cel osoby
  if (habit.universal) s += 3 // woda i sen pomagają każdemu
  if (habit.fits.includes(a.life)) s += 3
  if (a.level === 'new') s += habit.lvl === 1 ? 3 : -6
  else if (habit.lvl === 2) s += 1
  if (habit.when === a.slot) s += 2
  else if (habit.when === 'any' || habit.when === 'allday') s += 1
  return s
}

// wszystkie pasujące nawyki od najlepszego; bez tych, które użytkownik już ma
export function rankHabits(answers, existingNames = []) {
  const taken = new Set(existingNames.map((n) => n.trim().toLowerCase()))
  const cap = ALLOWANCE[answers.budget] ?? 20
  return HABITS.filter((x) => !x.unfit.includes(answers.life) && !taken.has(x.name.toLowerCase()) && x.min <= cap)
    .map((x) => ({ habit: x, score: score(x, answers) }))
    .sort((p, q) => q.score - p.score || p.habit.min - q.habit.min)
    .map((p) => p.habit)
}

// propozycja startowa: każdy wybrany cel dostaje co najmniej jeden nawyk, reszta według punktów,
// w granicach czasu, najwyżej jeden nawyk z grupy i najwyżej dwa z tym samym głównym celem
export function recommend(answers, existingNames = []) {
  const ranked = rankHabits(answers, existingNames)
  const count = pickCount(answers)
  const cap = ALLOWANCE[answers.budget] ?? 20
  const picks = []
  let minutes = 0

  const canAdd = (x) =>
    !picks.includes(x) &&
    !(x.group && picks.some((p) => p.group === x.group)) &&
    picks.filter((p) => p.goals[0] === x.goals[0]).length < 2 &&
    minutes + dailyMinutes(x) <= cap
  const add = (x) => {
    picks.push(x)
    minutes += dailyMinutes(x)
  }

  for (const goal of answers.goals) {
    const best = ranked.find((x) => x.goals[0] === goal && canAdd(x)) ?? ranked.find((x) => x.goals.includes(goal) && canAdd(x))
    if (best && picks.length < count) add(best)
  }
  for (const x of ranked) {
    if (picks.length >= count) break
    if (canAdd(x)) add(x)
  }
  return { picks, ranked }
}

// następna propozycja zamiast odrzuconej: najlepiej z tym samym celem, której jeszcze nie pokazano
export function nextAlternative(ranked, current, replaced, shown) {
  const free = (x) => !current.includes(x) && !shown.has(x.id) && !(x.group && current.some((p) => p !== replaced && p.group === x.group))
  return ranked.find((x) => free(x) && x.goals[0] === replaced.goals[0]) ?? ranked.find((x) => free(x) && x.goals.some((g) => replaced.goals.includes(g))) ?? ranked.find(free) ?? null
}

// podpowiedzi dla słabego atrybutu (weakSpot): nawyki, które rozwijają właśnie ten atrybut,
// od najłatwiejszych — kulejącemu atrybutowi pomoże raczej mały krok niż kolejne ambitne zadanie
export function suggestForAttr(attr, existingNames = []) {
  const taken = new Set(existingNames.map((n) => n.trim().toLowerCase()))
  return HABITS.filter((x) => detectCategory(x.name) === attr && !taken.has(x.name.toLowerCase()))
    .sort((a, b) => a.lvl - b.lvl || Boolean(b.universal) - Boolean(a.universal) || dailyMinutes(a) - dailyMinutes(b))
}

// nawyk z katalogu → dane dla saveQuest; nawyki w tej samej porze dnia idą po kolei, jeden po drugim
// (praca zmianowa: bez godzin, bo plan dnia co tydzień wygląda inaczej)
export function toQuestDrafts(habits, answers) {
  const cursor = {} // ile minut od początku pory dnia jest już zajęte
  return habits.map((x) => {
    let time = null
    if (answers.life !== 'shift' && x.time) {
      time = x.time
    } else if (answers.life !== 'shift' && x.when !== 'allday' && x.min > 0 && (x.when !== 'any' || answers.slot)) {
      const slot = x.when === 'any' ? answers.slot : x.when
      const offset = cursor[slot] ?? 0
      time = shiftTime(SLOT_TIME[slot], offset)
      cursor[slot] = offset + Math.max(15, Math.ceil(x.min / 15) * 15)
    }
    const perWeek = typeof x.repeat === 'number' ? Math.max(1, x.repeat - (answers.level === 'new' && x.repeat > 2 ? 1 : 0)) : null
    return {
      name: x.name,
      time,
      days: x.repeat === 'workdays' ? WORK_DAYS : ALL_DAYS,
      date: null,
      steps: x.steps ?? [],
      kind: x.kind ?? 'check',
      target: x.target ?? null,
      unit: x.unit ?? null,
      perWeek,
    }
  })
}

function shiftTime(time, minutes) {
  const total = Math.min(23 * 60 + 30, Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5)) + minutes)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

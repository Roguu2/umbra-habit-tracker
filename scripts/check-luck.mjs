// Sprawdza deterministyczne "szczęście" Umbry: `npm run check:luck`
// relikty (szansa, rzadkość, osiągalność), przepowiednia dnia (start, bonus tylko dla kategorii dnia,
// brak zmian EXP wstecz), spójność obrażeń strażnika z EXP oraz ten sam wynik w różnych strefach czasowych.

import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ZONES = ['UTC', 'Pacific/Honolulu', 'Asia/Tokyo', 'Europe/Warsaw', 'America/Los_Angeles']
globalThis.localStorage = { getItem: () => 'pl', setItem() {} }

const game = await import('../src/lib/game.js')
const relics = await import('../src/lib/relics.js')
const prophecy = await import('../src/lib/prophecy.js')
const bosses = await import('../src/lib/bosses.js')
const commission = await import('../src/lib/commission.js')

const DAYS = Array.from({ length: 400 }, (_, i) => game.shiftKey('2026-01-01', i))
const QUESTS = Array.from({ length: 250 }, (_, i) => `q-${i.toString(36)}`)

// tryb pomocniczy: wyniki dla stałej listy dni i zadań w strefie czasowej tego procesu
if (process.argv[2] === '--zone') {
  const out = DAYS.slice(0, 120).map((d) =>
    [prophecy.prophecyFor(d)?.attr ?? '-', commission.commissionsFor(d)[0].id, ...QUESTS.slice(0, 40).map((q) => relics.relicFor(d, q)?.id ?? '')].join(','),
  )
  console.log(out.join(';'))
  process.exit(0)
}

const errors = []
const check = (ok, message) => ok || errors.push(message)

// --- relikty ---
let found = 0
const byRarity = { common: 0, rare: 0, legendary: 0 }
const seen = new Set()
for (const d of DAYS) {
  for (const q of QUESTS) {
    const r = relics.relicFor(d, q)
    if (!r) continue
    found++
    byRarity[r.rarity]++
    seen.add(r.id)
  }
}
const rolls = DAYS.length * QUESTS.length
const chance = found / rolls
check(Math.abs(chance - relics.RELIC_CHANCE) < 0.005, `szansa na relikt ${(chance * 100).toFixed(2)}% zamiast ${relics.RELIC_CHANCE * 100}%`)
const weights = Object.values(relics.RARITY).reduce((s, r) => s + r.weight, 0)
for (const [rarity, { weight }] of Object.entries(relics.RARITY)) {
  const share = byRarity[rarity] / found
  check(Math.abs(share - weight / weights) < 0.02, `rzadkość ${rarity}: ${(share * 100).toFixed(1)}% zamiast ${((weight / weights) * 100).toFixed(0)}%`)
}
check(seen.size === relics.RELICS.length, `osiągalne relikty: ${seen.size} z ${relics.RELICS.length}`)
check(new Set(relics.RELICS.map((r) => r.id)).size === relics.RELICS.length, 'powtórzone id reliktu')
check(relics.relicFor('2026-03-03', 'q-1')?.id === relics.relicFor('2026-03-03', 'q-1')?.id, 'relikt nie jest deterministyczny')

// --- przepowiednia ---
check(prophecy.prophecyFor(game.shiftKey(prophecy.PROPHECY_SINCE, -1)) === null, 'przepowiednia przed datą startu')
const omens = DAYS.filter((d) => d >= prophecy.PROPHECY_SINCE).map((d) => prophecy.prophecyFor(d).attr)
check(new Set(omens).size === 5, `przepowiednia nie obejmuje wszystkich kategorii: ${[...new Set(omens)]}`)

const quest = (id, name) => ({ id, name, days: game.ALL_DAYS, steps: [], kind: 'check', createdAt: '2026-01-01', archivedAt: null, ...game.autoProps(name) })
const quests = [quest('s', 'Trening siłowy'), quest('w', 'Spacer 20 min'), quest('r', 'Czytanie 10 stron'), quest('v', 'Woda dziennie'), quest('l', 'Sprzątanie pokoju')]
const daily = (from, to) => {
  const history = {}
  for (let k = from; k <= to; k = game.shiftKey(k, 1)) history[k] = quests.map((q) => q.id)
  return history
}
const stateWith = (history) => ({ ...game.createInitialState(), profile: { name: 't', startedAt: '2026-01-01' }, quests, history })
// EXP bez żadnych bonusów: każdy dzień historii zawiera wszystkie zadania
const plainExp = (history) => Object.keys(history).length * quests.reduce((sum, q) => sum + q.exp, 0)

// brak zmian EXP wstecz: historia sprzed startu przepowiedni liczy się dokładnie jak dawniej
const before = daily('2026-06-01', game.shiftKey(prophecy.PROPHECY_SINCE, -1))
check(game.totalExpOf(stateWith(before)) === plainExp(before), 'przepowiednia zmienia EXP sprzed daty startu')
// po starcie: bonus tylko dla kategorii dnia
for (const d of DAYS.filter((k) => k >= prophecy.PROPHECY_SINCE).slice(0, 30)) {
  const omen = prophecy.prophecyFor(d)
  for (const q of quests) {
    const expected = q.attr === omen.attr ? Math.round(q.exp * (1 + prophecy.PROPHECY_BONUS)) : q.exp
    check(game.expFor(q, d) === expected, `bonus przepowiedni ${d} dla ${q.attr}: ${game.expFor(q, d)} ≠ ${expected}`)
  }
}

// strażnik: obrażenia z atrybutów innych niż słabość = EXP tych wykonań (także w dniach z przepowiednią)
const week = game.dayKey(game.weekStart(game.parseKey(game.shiftKey(prophecy.PROPHECY_SINCE, 7)))) // poniedziałek
const boss = bosses.bossOfWeek(week)
const others = quests.filter((q) => q.attr !== boss.weakness)
const weekHistory = {}
for (let i = 0; i < 3; i++) weekHistory[game.shiftKey(week, i)] = others.map((q) => q.id)
const weekState = stateWith({ ...daily('2026-06-01', game.shiftKey(week, -1)), ...weekHistory })
const expected = Object.entries(weekHistory).reduce((sum, [k, ids]) => sum + ids.reduce((s, id) => s + game.expFor(quests.find((q) => q.id === id), k), 0), 0)
const fight = bosses.weekBoss(weekState, week, game.shiftKey(week, 2))
check(!fight.defeated && fight.damage === expected, `obrażenia ${fight.damage} ≠ EXP ${expected} (pokonany: ${fight.defeated})`)

// --- zlecenie dnia ---
const planNames = quests.map((q) => q.name)
for (const d of DAYS.slice(0, 60)) {
  const candidates = commission.commissionsFor(d, planNames)
  check(candidates.length > 1, `za mało kandydatów na zlecenie ${d}`)
  check(!candidates.some((h) => planNames.includes(h.name)), `zlecenie ${d} jest już w planie`)
  check(candidates.every((h) => h.lvl === 1), `zlecenie ${d} nie jest łatwe`)
}
const firsts = new Set(DAYS.map((d) => commission.commissionsFor(d)[0].id))
check(firsts.size > 10, `zlecenia mało zróżnicowane: ${firsts.size} różnych`)
const accepted = { ...quest('c', 'Rozciąganie 10 min'), commission: '2026-11-03' }
const omenOn = (d) => prophecy.prophecyFor(d)?.attr === accepted.attr
const withBonus = (d) => Math.round(accepted.exp * (1 + (omenOn(d) ? prophecy.PROPHECY_BONUS : 0) + (d === accepted.commission ? commission.COMMISSION_BONUS : 0)))
for (const d of ['2026-11-02', '2026-11-03', '2026-11-04']) {
  check(game.expFor(accepted, d) === withBonus(d), `bonus zlecenia ${d}: ${game.expFor(accepted, d)} ≠ ${withBonus(d)}`)
}
check(game.expFor(accepted, '2026-11-03') > game.expFor({ ...accepted, commission: null }, '2026-11-03'), 'zlecenie nie daje bonusu w dniu przyjęcia')

// --- ten sam wynik w różnych strefach czasowych ---
const byZone = ZONES.map((zone) =>
  execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--zone'], { env: { ...process.env, TZ: zone }, encoding: 'utf8' }).trim(),
)
check(new Set(byZone).size === 1, `różne wyniki w strefach czasowych: ${ZONES.join(', ')}`)

if (errors.length) {
  console.log(`${errors.length} problemów:\n  ${errors.slice(0, 30).join('\n  ')}`)
  process.exit(1)
}
console.log(
  `OK — relikty ${(chance * 100).toFixed(2)}% (${Object.entries(byRarity)
    .map(([r, n]) => `${r} ${((n / found) * 100).toFixed(0)}%`)
    .join(', ')}), przepowiednia od ${prophecy.PROPHECY_SINCE}, ${ZONES.length} stref czasowych`,
)

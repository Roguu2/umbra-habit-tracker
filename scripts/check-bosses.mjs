// Sprawdza strażnika tygodnia (src/lib/bosses.js): `npm run check:bosses`
// 1. wytrzymałość zawsze w granicach MIN_HP–MAX_HP (także przy skrajnych graczach), nowy gracz — stała wartość
// 2. słabość rani o 50% mocniej; minimum dnia liczy się jak w EXP
// 3. tydzień z urlopem albo bez planu — brak bossa; tarcza passy bossa nie odbiera
// 4. ten sam tydzień → ten sam boss na różnych urządzeniach (różne strefy czasowe, osobne procesy)

import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ZONES = ['UTC', 'Pacific/Honolulu', 'Asia/Tokyo', 'Europe/Warsaw', 'America/Los_Angeles']
const WEEKS = Array.from({ length: 60 }, (_, i) => new Date(Date.UTC(2026, 0, 1 + i * 5)).toISOString().slice(0, 10))

// tryb pomocniczy: wypisz bossów dla listy dni w strefie czasowej tego procesu
if (process.argv[2] === '--zone') {
  globalThis.localStorage = { getItem: () => 'pl', setItem() {} }
  const { bossOfWeek } = await import('../src/lib/bosses.js')
  console.log(JSON.stringify(WEEKS.map((k) => bossOfWeek(k).id)))
  process.exit(0)
}

globalThis.localStorage = { getItem: () => 'pl', setItem() {} }
const game = await import('../src/lib/game.js')
const B = await import('../src/lib/bosses.js')

const errors = []
const check = (ok, message) => ok || errors.push(message)

const MONDAY = '2026-10-05' // tydzień testowy: 5–11 października
const day = (offset) => game.shiftKey(MONDAY, offset)
const quest = (id, name, extra = {}) => ({
  id,
  name,
  time: null,
  days: game.ALL_DAYS,
  date: null,
  steps: [],
  kind: 'check',
  createdAt: '2026-01-01',
  archivedAt: null,
  perWeek: null,
  ...game.autoProps(name),
  ...extra,
})
const stateWith = (quests, history, extra = {}) => ({
  ...game.createInitialState(),
  profile: { name: 'test', startedAt: '2026-01-05' },
  quests,
  history,
  ...extra,
})
// historia: każdy dzień od `from` do `to` (włącznie) z podanymi zadaniami
const daily = (from, to, ids, history = {}) => {
  for (let k = from; k <= to; k = game.shiftKey(k, 1)) history[k] = [...(history[k] ?? []), ...ids]
  return history
}

// --- 1. wytrzymałość ---
const walk = quest('w', 'Spacer 20 min') // Kondycja, 30 EXP
const many = Array.from({ length: 40 }, (_, i) => quest(`q${i}`, `Trening siłowy ${i}`)) // Siła, 40 EXP
const heavy = stateWith(many, daily('2026-01-05', day(-1), many.map((q) => q.id)))
check(B.bossHp(heavy, MONDAY) === B.MAX_HP, `wytrzymałość przy ogromnym EXP ${B.bossHp(heavy, MONDAY)} ≠ ${B.MAX_HP}`)
const light = stateWith([walk], daily(day(-35), day(-1), []))
light.history[day(-30)] = ['w']
check(B.bossHp(light, MONDAY) === B.MIN_HP, `wytrzymałość przy prawie zerowym EXP ${B.bossHp(light, MONDAY)} ≠ ${B.MIN_HP}`)
const fresh = stateWith([walk], daily(day(-3), day(-1), ['w']), { profile: { name: 'test', startedAt: day(-3) } })
check(B.bossHp(fresh, MONDAY) === B.NEW_PLAYER_HP, `nowy gracz: ${B.bossHp(fresh, MONDAY)} ≠ ${B.NEW_PLAYER_HP}`)
const regular = stateWith([walk], daily('2026-01-05', day(-1), ['w'])) // 7 × 30 = 210 EXP tygodniowo
check(B.bossHp(regular, MONDAY) === Math.round((210 * B.HP_SHARE) / 10) * 10, `zwykły gracz: ${B.bossHp(regular, MONDAY)}`)
for (let seed = 1; seed <= 300; seed++) {
  const qs = many.slice(0, 1 + (seed % 40))
  const history = {}
  for (let k = '2026-01-05'; k < MONDAY; k = game.shiftKey(k, 1)) {
    if ((seed * k.length * k.charCodeAt(9)) % 3) history[k] = qs.filter((_, i) => (i + seed + k.charCodeAt(8)) % 2).map((q) => q.id)
  }
  const hp = B.bossHp(stateWith(qs, history), MONDAY)
  check(hp >= B.MIN_HP && hp <= B.MAX_HP, `wytrzymałość poza granicami (${hp}) dla seed ${seed}`)
}
// wytrzymałość nie zmienia się w trakcie tygodnia
const midWeek = stateWith([walk], daily('2026-01-05', day(3), ['w']))
check(B.bossHp(midWeek, MONDAY) === B.bossHp(midWeek, day(6)), 'wytrzymałość zmienia się w trakcie tygodnia')

// --- 2. słabość i minimum dnia ---
const boss = B.bossOfWeek(MONDAY)
const weakName = { str: 'Trening siłowy', end: 'Spacer 20 min', vit: 'Woda dziennie', mind: 'Czytanie 10 stron', life: 'Sprzątanie pokoju' }
const other = Object.keys(weakName).find((k) => k !== boss.weakness)
const weakQuest = quest('weak', weakName[boss.weakness])
const otherQuest = quest('other', weakName[other])
check(weakQuest.attr === boss.weakness && otherQuest.attr !== boss.weakness, 'nazwy testowe nie trafiają w atrybuty')
const base = { quests: [weakQuest, otherQuest], history: daily('2026-01-05', day(-1), ['weak', 'other']) }
const hitWeak = B.weekBoss(stateWith(base.quests, { ...base.history, [MONDAY]: ['weak'] }), MONDAY)
const hitOther = B.weekBoss(stateWith(base.quests, { ...base.history, [MONDAY]: ['other'] }), MONDAY)
check(hitWeak.damage === Math.round(weakQuest.exp * B.WEAKNESS_BONUS), `słabość: ${hitWeak.damage} ≠ ${weakQuest.exp} × ${B.WEAKNESS_BONUS}`)
check(hitOther.damage === otherQuest.exp, `zwykły atrybut: ${hitOther.damage} ≠ ${otherQuest.exp}`)
const minimal = B.weekBoss(stateWith(base.quests, { ...base.history, [MONDAY]: ['other'] }, { minimums: { [MONDAY]: ['other'] } }), MONDAY)
check(minimal.damage === game.minimumExp(otherQuest.exp), `minimum dnia: ${minimal.damage} ≠ ${game.minimumExp(otherQuest.exp)}`)
const beaten = B.weekBoss(stateWith(base.quests, daily(MONDAY, day(6), ['weak', 'other'], { ...base.history })), day(6))
check(beaten.defeated && beaten.damage === beaten.hp && beaten.defeatedOn <= day(6), 'pełny tydzień nie pokonuje bossa')

// --- 3. urlop, tarcza, brak planu ---
const vacation = stateWith([walk], daily('2026-01-05', day(6), ['w']), { pauses: [{ from: day(2), to: day(3) }] })
check(B.weekBoss(vacation, MONDAY, day(6)) === null, 'tydzień z urlopem ma bossa')
const shielded = stateWith([walk], daily('2026-01-05', day(6), ['w']), { pauses: [{ from: day(2), to: day(2), shield: true }] })
check(B.weekBoss(shielded, MONDAY, day(6)) !== null, 'tarcza passy odebrała bossa')
const noPlan = stateWith([quest('once', 'Spacer 20 min', { days: [], date: '2026-02-01' })], {})
check(B.weekBoss(noPlan, MONDAY) === null, 'tydzień bez planu ma bossa')
const flexOnly = stateWith([quest('f', 'Pompki 3 serie', { perWeek: 2 })], {})
check(B.weekBoss(flexOnly, MONDAY) !== null, 'nawyk "X razy w tygodniu" nie liczy się jako plan')

// --- 4. ten sam tydzień → ten sam boss ---
for (const k of WEEKS) check(B.bossOfWeek(k).id === B.bossOfWeek(B.weekBoss(regular, k, k)?.weekStart ?? k).id, `boss zmienia się w trakcie tygodnia ${k}`)
const byZone = ZONES.map((zone) =>
  execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--zone'], { env: { ...process.env, TZ: zone }, encoding: 'utf8' }).trim(),
)
check(new Set(byZone).size === 1, `różni bossowie w strefach czasowych: ${ZONES.join(', ')}`)
check(new Set(B.BOSSES.map((b) => b.id)).size === B.BOSSES.length, 'powtórzone id bossa')

if (errors.length) {
  console.log(`${errors.length} problemów:\n  ${errors.join('\n  ')}`)
  process.exit(1)
}
console.log(`OK — ${B.BOSSES.length} strażników, wytrzymałość ${B.MIN_HP}–${B.MAX_HP}, ${ZONES.length} stref czasowych`)

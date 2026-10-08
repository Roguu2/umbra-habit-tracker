// Buduje DOKUMENTACJA.md: opisy z scripts/docs/template.md + tabele i liczby wyliczone wprost z kodu,
// więc dokumentacja zawsze zgadza się z aplikacją. Uruchamiany przez hook pre-commit (.githooks) i `npm run docs`.
// W szablonie {{nazwa}} zastępujemy wartością z VALUES albo sekcją z SECTIONS; nieznana nazwa to błąd.

import { readFileSync, writeFileSync } from 'node:fs'
import { register } from 'node:module'

// kod aplikacji importuje część modułów bez rozszerzenia (jak w Vite) — dopisujemy .js przy rozwiązywaniu
register(
  'data:text/javascript,' +
    encodeURIComponent(`export async function resolve(spec, ctx, next) {
      try { return await next(spec, ctx) } catch (err) {
        if (spec.startsWith('.') && !/\\.[cm]?jsx?$/.test(spec)) return next(spec + '.js', ctx)
        throw err
      }
    }`),
)
globalThis.localStorage = { getItem: () => 'pl', setItem() {} } // dokumentacja po polsku

const root = new URL('../', import.meta.url)
const lib = (name) => import(new URL(`src/lib/${name}.js`, root))

const { plural } = await lib('i18n')
const game = await lib('game')
const { ACHIEVEMENTS } = await lib('achievements')
const attributes = await lib('attributes')
const { HABITS } = await lib('habits')
const recommend = await lib('recommend')
const progression = await lib('progression')
const rewards = await lib('rewards')
const shields = await lib('shields')
const comeback = await lib('comeback')
const bosses = await lib('bosses')
const push = await import(new URL('netlify/push-handler.mjs', root))
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'))

// --- pomocnicze -------------------------------------------------------------------------

const table = (head, rows) => [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n')
const list = (items) => items.map((x) => `- ${x}`).join('\n')

const GOALS = { str: 'Siła', end: 'Kondycja', vit: 'Zdrowie i sen', mind: 'Umysł i nauka', calm: 'Spokój', life: 'Porządek dnia' }
const LIFE = { desk: 'biurko', physical: 'praca fizyczna', study: 'nauka', shift: 'zmiany', home: 'dom' }
const WHEN = { morning: 'rano', midday: 'w ciągu dnia', evening: 'wieczorem', any: 'dowolnie', allday: 'cały dzień' }
const TIER = { blood: 'krwawy', gold: 'złoty' }

const repeatLabel = (r) => (r === 'daily' ? 'codziennie' : r === 'workdays' ? 'pn–pt' : `${r}× w tyg.`)
const kindLabel = (h) => (h.kind === 'count' ? `licznik (${h.target} ${h.unit})` : h.kind === 'avoid' ? 'unikam' : 'odhaczenie')
const describe = (d) => game.describeRepeat(d) + (d.time ? `, ${d.time}` : '')

// --- sekcje -----------------------------------------------------------------------------

const categories = table(
  ['Kategoria (atrybut)', 'Klucz', 'Kolor', 'EXP za wykonanie', 'Słowa w nazwie, które ją wybierają'],
  Object.entries(game.CATEGORIES).map(([key, c]) => [
    c.label,
    `\`${key}\``,
    TIER[c.tier],
    c.exp,
    c.words.length ? c.words.map((w) => `\`${w.trim()}\``).join(', ') : '— (wszystko, co nie pasuje wyżej)',
  ]),
)

const levels = table(
  ['Poziom', 'EXP na ten poziom', 'EXP łącznie od zera', 'Tytuł', 'Nagrody'],
  Array.from({ length: 20 }, (_, i) => i + 1).map((level) => [
    level,
    game.expForLevel(level),
    game.expToReach(level),
    game.titleFor(level),
    rewards
      .rewardsBetween(level - 1, level)
      .map((r) => r.name)
      .join(', ') || '—',
  ]),
)

const achievements = table(
  ['Osiągnięcie', 'Warunek', 'Id'],
  ACHIEVEMENTS.map((a) => [a.name, a.desc, `\`${a.id}\``]),
)

const classes = [
  table(
    ['Dominujący atrybut', 'Klasa', 'Opis'],
    Object.entries(attributes.SOLO).map(([k, c]) => [game.CATEGORIES[k].label, c.name, c.desc]),
  ),
  '',
  table(
    ['Para atrybutów', 'Klasa', 'Opis'],
    Object.entries(attributes.PAIRS).map(([pair, c]) => [
      pair
        .split('+')
        .map((k) => game.CATEGORIES[k].label)
        .join(' + '),
      c.name,
      c.desc,
    ]),
  ),
  '',
  `Równowaga: **${attributes.BALANCED.name}** — ${attributes.BALANCED.desc}`,
  '',
  `Za mało EXP: **${attributes.UNFORMED.name}** — ${attributes.UNFORMED.desc}`,
].join('\n')

const catalog = table(
  ['Nawyk', 'Kategoria', 'Cele w ankiecie', 'Pora', 'Min.', 'Poziom', 'Powtarzanie', 'Rodzaj', 'Pasuje do', 'Nie dla'],
  HABITS.map((h) => [
    h.name,
    game.CATEGORIES[game.detectCategory(h.name)].label,
    h.goals.map((g) => GOALS[g]).join(', '),
    WHEN[h.when] + (h.time ? ` (${h.time})` : ''),
    h.min,
    h.lvl === 1 ? 'start' : 'zaawans.',
    repeatLabel(h.repeat),
    kindLabel(h),
    h.fits.map((f) => LIFE[f]).join(', ') || '—',
    h.unfit.map((f) => LIFE[f]).join(', ') || '—',
  ]),
)

// przykładowe łańcuchy poprzeczki: każdy nawyk z katalogu, który da się utrudnić, do 3 kroków
const raiseBar = table(
  ['Start (z katalogu)', 'Kolejne propozycje'],
  recommend
    .toQuestDrafts(HABITS, { level: 'some' })
    .map((draft) => {
      const steps = []
      let q = { ...draft }
      for (let i = 0; i < 3; i++) {
        const up = progression.harderVersion(q)
        if (!up) break
        q = up.name ? { ...q, name: up.name } : { ...q, perWeek: up.perWeek }
        steps.push(up.name ?? `${q.name}, ${up.perWeek}× w tyg.`)
      }
      return [`${draft.name}${draft.perWeek ? `, ${draft.perWeek}× w tyg.` : ''}`, steps.join(' → ')]
    })
    .filter(([, steps]) => steps),
)

const auras = list(
  Object.entries(rewards.AURAS).map(([id, a]) => {
    const r = rewards.REWARDS.find((x) => x.type === 'aura' && x.id === id)
    return `**${a.name}** (poziom ${r.level})${id === rewards.DEFAULT_AURA ? ' — domyślna' : ''}`
  }),
)

const habitsWord = (n) => `${n} ${plural(n, ['nawyk', 'nawyki', 'nawyków'], [])}`
const quizBudget = list(
  Object.entries(recommend.ALLOWANCE).map(([budget, cap]) => {
    const count = (level) => recommend.pickCount({ budget: Number(budget), level })
    const label = budget === '30' ? '30 minut i więcej' : `około ${budget} minut`
    return `„${label}” → razem do ${cap} min dziennie, ${habitsWord(count('some'))} (początkujący: ${habitsWord(count('new'))})`
  }),
)

const reminderLeads = push.LEADS.map((m) => (m ? `${m} min przed` : 'o czasie')).join(', ')
const reminderEvenings = push.EVENINGS.filter(Boolean).join(', ')

// --- składanie --------------------------------------------------------------------------

// strażnicy w kolejności rotacji (tydzień po tygodniu)
const bossTable = table(
  ['#', 'Strażnik', 'Słabość', 'Relikt', 'Opis'],
  bosses.BOSSES.map((b, i) => [i + 1, b.name, game.CATEGORIES[b.weakness].label, b.relic, b.desc]),
)

const SECTIONS = { categories, levels, achievements, classes, catalog, raiseBar, auras, quizBudget, bosses: bossTable }
const VALUES = {
  version: pkg.version,
  habitCount: HABITS.length,
  attrRecentDays: attributes.RECENT_DAYS,
  attrLevelBase: attributes.attrExpForLevel(1),
  attrLevelStep: attributes.attrExpForLevel(2) - attributes.attrExpForLevel(1),
  levelBase: game.expForLevel(1),
  levelStep: game.expForLevel(2) - game.expForLevel(1),
  slotMorning: recommend.SLOT_TIME.morning,
  slotMidday: recommend.SLOT_TIME.midday,
  slotEvening: recommend.SLOT_TIME.evening,
  quietDays: progression.QUIET_DAYS,
  streakGoalDaily: progression.streakGoal({ days: game.ALL_DAYS }),
  streakGoalThreeDays: progression.streakGoal({ days: [1, 3, 5] }),
  streakGoalWeekly: progression.streakGoal({ perWeek: 2, days: game.ALL_DAYS }),
  shieldEvery: rewards.SHIELD_EVERY,
  shieldMaxDays: shields.MAX_RESCUE_DAYS,
  shieldMinStreak: shields.MIN_RESCUE_STREAK,
  minimumMaxLength: game.MINIMUM_MAX_LENGTH,
  minimumExample: [25, 30, 15].map((exp) => `${exp} → ${game.minimumExp(exp)} EXP`).join(', '),
  minLostStreak: comeback.MIN_LOST_STREAK,
  returnBonus: comeback.RETURN_BONUS,
  bossWeaknessBonus: String(bosses.WEAKNESS_BONUS).replace('.', ','),
  bossHpShare: Math.round(bosses.HP_SHARE * 100),
  bossHistoryWeeks: bosses.HP_HISTORY_WEEKS,
  bossMinHistoryWeeks: bosses.MIN_HISTORY_WEEKS,
  bossNewPlayerHp: bosses.NEW_PLAYER_HP,
  bossMinHp: bosses.MIN_HP,
  bossMaxHp: bosses.MAX_HP,
  reminderLeads,
  reminderEvenings,
  reminderWindow: push.WINDOW_MIN,
}

const template = readFileSync(new URL('scripts/docs/template.md', root), 'utf8')
const out = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
  const value = SECTIONS[key] ?? VALUES[key]
  if (value === undefined) throw new Error(`Nieznany znacznik w szablonie: {{${key}}}`)
  return String(value)
})

writeFileSync(new URL('DOKUMENTACJA.md', root), out)
console.log('DOKUMENTACJA.md — zaktualizowana')

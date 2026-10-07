// --- Nagrody za poziomy -------------------------------------------------------------
// Aury zmieniają tło aplikacji (do wyboru), pieczęcie to emblemat poziomu w HUD (zawsze najwyższa zdobyta).
// Odblokowuje je najwyższy osiągnięty poziom (maxLevel), więc zdobyta nagroda nigdy nie znika.

import { t } from './i18n.js'

// glow: [rgb, krycie] dwóch dryfujących poświat; embers: dwa kolory drobin [kolor, poświata]
// i jaki ich odsetek ma drugi kolor
export const AURAS = {
  blood: {
    name: t('Krwawa Aura', 'Blood Aura'),
    glow: [['61,6,16', 0.6], ['58,42,12', 0.4]],
    embers: [['#ff4259', '#e0223d'], ['#f5d88e', '#e2b45a']],
    share: 0.35,
  },
  ash: {
    name: t('Popielna Aura', 'Ash Aura'),
    glow: [['38,34,32', 0.7], ['60,52,44', 0.35]],
    embers: [['#d6cfc4', '#a39a8c'], ['#ff6a3d', '#c2410c']],
    share: 0.25,
  },
  dusk: {
    name: t('Aura Zmierzchu', 'Dusk Aura'),
    glow: [['70,48,10', 0.6], ['90,62,14', 0.45]],
    embers: [['#f5d88e', '#e2b45a'], ['#ffb347', '#d97706']],
    share: 0.5,
  },
  wraith: {
    name: t('Widmowa Aura', 'Wraith Aura'),
    glow: [['8,40,48', 0.6], ['30,60,70', 0.35]],
    embers: [['#7ee8e0', '#2dd4bf'], ['#e0f2fe', '#7dd3fc']],
    share: 0.35,
  },
  abyss: {
    name: t('Aura Otchłani', 'Abyss Aura'),
    glow: [['40,8,60', 0.65], ['70,14,50', 0.4]],
    embers: [['#c084fc', '#9333ea'], ['#ff4259', '#e0223d']],
    share: 0.3,
  },
  inferno: {
    name: t('Piekielna Aura', 'Infernal Aura'),
    glow: [['90,20,0', 0.65], ['110,50,0', 0.45]],
    embers: [['#ff7a18', '#ea580c'], ['#ffd166', '#f59e0b']],
    share: 0.4,
  },
}

export const DEFAULT_AURA = 'blood'

// pieczęcie odpowiadają progom tytułów (game.js → TITLES): ranga i emblemat zmieniają się razem
// spokes: kreski na zewnętrznym kręgu; rings: ile kręgów; color: kolor kręgów (rgb); halo: [rgb, krycie] poświaty
export const SIGILS = {
  1: { spokes: 8, rings: 1, color: '201,162,74', halo: ['195,20,47', 0.35] },
  3: { spokes: 12, rings: 1, color: '201,162,74', halo: ['195,20,47', 0.45] },
  5: { spokes: 12, rings: 2, color: '224,34,61', halo: ['224,34,61', 0.55] },
  8: { spokes: 16, rings: 2, color: '201,162,74', halo: ['226,180,90', 0.5] },
  12: { spokes: 16, rings: 3, color: '192,132,252', halo: ['147,51,234', 0.6] },
  20: { spokes: 24, rings: 3, color: '255,227,160', halo: ['255,200,90', 0.75] },
}

const SIGIL_NAMES = {
  3: t('Pieczęć Strażnika', "Warden's Sigil"),
  5: t('Pieczęć Krwawego Księżyca', 'Blood Moon Sigil'),
  8: t('Pieczęć Pogromcy', 'Shadowbane Sigil'),
  12: t('Pieczęć Otchłani', 'Abyssal Sigil'),
  20: t('Pieczęć Wiecznego Płomienia', 'Eternal Flame Sigil'),
}

// domyślna aura też jest na ścieżce (poziom 1), żeby można było do niej wrócić
const AURA_LEVELS = { blood: 1, ash: 2, dusk: 4, wraith: 7, abyss: 10, inferno: 15 }

// cała ścieżka nagród, od najniższego poziomu
export const REWARDS = [
  ...Object.entries(AURA_LEVELS).map(([id, level]) => ({ level, type: 'aura', id, name: AURAS[id].name })),
  ...Object.entries(SIGIL_NAMES).map(([level, name]) => ({ level: Number(level), type: 'sigil', id: level, name })),
].sort((a, b) => a.level - b.level)

export const isUnlocked = (reward, maxLevel) => reward.level <= maxLevel
// nagrody zdobyte przy awansie z poziomu `from` na `to`
export const rewardsBetween = (from, to) => REWARDS.filter((r) => r.level > from && r.level <= to)
export const nextReward = (maxLevel) => REWARDS.find((r) => r.level > maxLevel) ?? null

// wybrana aura, o ile jest zdobyta (np. po wczytaniu starszej kopii zapasowej mogłaby nie być)
export function auraFor(profile, maxLevel) {
  const level = AURA_LEVELS[profile.aura]
  return level && level <= maxLevel ? profile.aura : DEFAULT_AURA
}

export function sigilFor(maxLevel) {
  const tier = Object.keys(SIGILS)
    .map(Number)
    .filter((min) => maxLevel >= min)
    .at(-1)
  return SIGILS[tier]
}

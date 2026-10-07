import { useEffect, useRef } from 'react'
import { Panel } from './ui'
import { expToReach } from '../lib/game'
import { AURAS, REWARDS, SIGILS, isUnlocked, nextReward } from '../lib/rewards'
import { sfx } from '../lib/sfx'
import { t } from '../lib/i18n'

// Ścieżka nagród: zdobyte, najbliższa (z brakującym EXP) i zakryte dalsze. Zdobyte aury można tu założyć.
export default function RewardPath({ maxLevel, totalExp, aura, onWear }) {
  const scroller = useRef(null)
  const upcoming = nextReward(maxLevel)

  // przewiń tak, żeby najbliższa nagroda była na środku
  useEffect(() => {
    const box = scroller.current
    const node = box?.querySelector('[data-next]')
    if (node) box.scrollLeft = node.offsetLeft - box.clientWidth / 2 + node.clientWidth / 2
  }, [])

  return (
    <Panel title={t('Ścieżka nagród', 'Path of rewards')} subtitle={t('każdy poziom coś odsłania', 'every level reveals something')} delay={0.3}>
      <ol ref={scroller} className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2 [scrollbar-color:rgba(255,255,255,0.15)_transparent] [scrollbar-width:thin]">
        {REWARDS.map((r) => {
          const unlocked = isUnlocked(r, maxLevel)
          const isNext = r === upcoming
          const hidden = !unlocked && !isNext
          const worn = r.type === 'aura' && r.id === aura
          return (
            <li
              key={`${r.type}-${r.id}`}
              data-next={isNext || undefined}
              className={`flex w-36 shrink-0 snap-center flex-col items-center gap-2 p-3 text-center ring-1 ${
                isNext ? 'bg-gold/[0.06] ring-gold/50' : unlocked ? 'bg-black/30 ring-white/10' : 'bg-black/20 ring-white/[0.05]'
              }`}
            >
              <span className={`font-display text-[10px] tracking-[0.25em] uppercase ${unlocked ? 'text-gold/80' : 'text-white/35'}`}>
                {t('Poziom', 'Level')} {r.level}
              </span>
              <RewardIcon reward={r} dim={!unlocked} hidden={hidden} />
              <span className={`min-h-8 text-[12px] leading-tight ${hidden ? 'text-white/30' : 'text-stone-100'}`}>{hidden ? '???' : r.name}</span>
              <RewardStatus
                reward={r}
                unlocked={unlocked}
                isNext={isNext}
                worn={worn}
                expLeft={isNext ? expToReach(r.level) - totalExp : null}
                onWear={() => {
                  sfx.forge()
                  onWear(r.id)
                }}
              />
            </li>
          )
        })}
      </ol>
    </Panel>
  )
}

function RewardStatus({ reward, unlocked, isNext, worn, expLeft, onWear }) {
  const base = 'text-[10px] tracking-[0.15em] uppercase'
  if (isNext) return <span className={`${base} tabular-nums text-gold-bright`}>{t(`jeszcze ${expLeft} EXP`, `${expLeft} EXP to go`)}</span>
  if (!unlocked) return <span className={`${base} text-white/25`}>{t('zakryte', 'hidden')}</span>
  if (reward.type === 'sigil') return <span className={`${base} text-white/45`}>{t('zdobyta', 'earned')}</span>
  if (worn) return <span className={`${base} text-gold-bright`}>✓ {t('noszona', 'worn')}</span>
  return (
    <button type="button" onClick={onWear} className={`${base} cursor-pointer text-white/60 hover:text-gold-bright`}>
      {t('Przywdziej', 'Wear')}
    </button>
  )
}

// podgląd nagrody: aura jako kula w jej kolorach, pieczęć jako miniatura emblematu
export function RewardIcon({ reward, dim = false, hidden = false, size = 'size-14' }) {
  const opacity = hidden ? 0.15 : dim ? 0.45 : 1
  if (reward.type === 'aura') {
    const { glow, embers } = AURAS[reward.id]
    return (
      <span
        className={`relative block rounded-full ${size}`}
        style={{
          opacity,
          background: `radial-gradient(circle at 35% 35%, rgba(${glow[1][0]},0.9), rgba(${glow[0][0]},0.9) 55%, #050405 100%)`,
          boxShadow: `0 0 18px rgba(${glow[0][0]},0.8)`,
        }}
      >
        {[
          [28, 62, 0],
          [62, 30, 1],
          [70, 66, 0],
        ].map(([x, y, i]) => (
          <span
            key={`${x}-${y}`}
            className="absolute size-1 rounded-full"
            style={{ left: `${x}%`, top: `${y}%`, background: embers[i][0], boxShadow: `0 0 6px ${embers[i][1]}` }}
          />
        ))}
      </span>
    )
  }

  const { spokes, rings, color, halo } = SIGILS[reward.id]
  return (
    <svg viewBox="0 0 100 100" className={size} style={{ opacity, filter: `drop-shadow(0 0 6px rgba(${halo[0]},${halo[1]}))` }} aria-hidden>
      {Array.from({ length: rings }, (_, i) => (
        <circle key={i} cx="50" cy="50" r={46 - i * 6} fill="none" stroke={`rgba(${color},0.7)`} strokeWidth="1.5" strokeDasharray="2 4" />
      ))}
      {Array.from({ length: spokes }, (_, i) => (
        <path key={i} d="M50 2v8" stroke={`rgba(${color},0.9)`} strokeWidth="1.5" transform={`rotate(${(i * 360) / spokes} 50 50)`} />
      ))}
      <path d="M50 22 74 64H26Z M50 78 26 36h48Z" fill="none" stroke="rgba(224,34,61,0.7)" strokeWidth="1.5" />
    </svg>
  )
}

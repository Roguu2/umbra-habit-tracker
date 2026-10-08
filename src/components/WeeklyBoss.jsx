import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { MiniRune, Panel } from './ui'
import { WEAKNESS_BONUS, weekBoss } from '../lib/bosses'
import { CATEGORIES, TIERS } from '../lib/game'
import { sfx } from '../lib/sfx'
import { plural, t } from '../lib/i18n'

const bonusLabel = t(`×${String(WEAKNESS_BONUS).replace('.', ',')}`, `×${WEAKNESS_BONUS}`)

// Karta strażnika tygodnia (lib/bosses.js). W tygodniu z urlopem albo bez planu nie ma bossa — wtedy nic nie pokazujemy.
export default function WeeklyBoss({ state, today }) {
  const week = useMemo(() => weekBoss(state, today, today), [state, today])
  const reduceMotion = useReducedMotion()

  // animacja pokonania tylko przy zmianie w trakcie sesji (nie po przeładowaniu strony z już pokonanym bossem)
  const [celebrate, setCelebrate] = useState(false)
  const wasDefeated = useRef(week?.defeated ?? false)
  useEffect(() => {
    const defeated = week?.defeated ?? false
    if (defeated && !wasDefeated.current) {
      setCelebrate(true)
      sfx.achievement()
      const id = setTimeout(() => setCelebrate(false), 1200)
      wasDefeated.current = defeated
      return () => clearTimeout(id)
    }
    wasDefeated.current = defeated
  }, [week?.defeated])

  if (!week) return null
  const { boss, hp, damage, defeated, daysLeft } = week
  const weakness = CATEGORIES[boss.weakness]
  const left = hp - damage
  const days = plural(daysLeft, ['dzień', 'dni', 'dni'], ['day', 'days'])

  return (
    <Panel
      title={t('Strażnik tygodnia', 'Weekly warden')}
      subtitle={defeated ? t('pokonany', 'defeated') : t(`jeszcze ${daysLeft} ${days}`, `${daysLeft} ${days} left`)}
      delay={0.2}
    >
      <motion.div
        animate={celebrate && !reduceMotion ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.45 }}
        className="flex items-start gap-4"
      >
        <MiniRune rune={boss.rune} tier={defeated ? 'gold' : 'blood'} lit={!defeated} size="size-12" />
        <div className="min-w-0 flex-1">
          <p className={`font-display text-base font-black ${defeated ? 'text-white/45 line-through' : 'text-stone-100'}`}>{boss.name}</p>
          <p className="mt-0.5 font-lore text-[15px] leading-snug text-white/50 italic">{boss.desc}</p>
        </div>
      </motion.div>

      <p className="mt-4 flex items-center gap-2 text-[11px] text-white/50">
        <MiniRune rune={weakness.rune} tier={weakness.tier} lit size="size-5" />
        <span>
          {t('Słabość', 'Weakness')}: <b className="text-stone-200">{weakness.label}</b> —{' '}
          {t(`te zadania ranią ${bonusLabel}`, `these quests hit ${bonusLabel}`)}
        </span>
      </p>

      {defeated ? (
        <motion.div
          initial={celebrate && !reduceMotion ? { scale: 1.6, opacity: 0, rotate: -8 } : false}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="mt-4 border-l-2 border-gold/60 pl-3"
        >
          <p className="font-display text-sm font-black tracking-[0.3em] text-gold-bright uppercase">{t('Pokonany', 'Defeated')}</p>
          <p className="mt-0.5 text-[12px] text-white/55">
            {t('Relikt w bestiariuszu', 'Relic in the bestiary')}: <span className="text-stone-100">{boss.relic}</span>
          </p>
        </motion.div>
      ) : (
        <div className="mt-4">
          <div className="mb-1.5 flex items-baseline justify-between text-[10px] tracking-[0.2em] text-white/40 uppercase">
            <span>{t('Wytrzymałość', 'Endurance')}</span>
            <span className="tabular-nums tracking-normal text-stone-200">
              {left} / {hp}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${TIERS.blood.main}88, ${TIERS.blood.main})` }}
              initial={false}
              animate={{ width: `${(left / hp) * 100}%` }}
              transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 90, damping: 20 }}
            />
          </div>
          <p className="mt-2 text-[11px] text-white/35">
            {t('Każde wykonane zadanie zadaje obrażenia równe jego EXP.', 'Every completed quest deals damage equal to its EXP.')}
          </p>
        </div>
      )}

      <AnimatePresence>
        {celebrate && !reduceMotion && (
          <motion.div
            key="flash"
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold/30 via-transparent to-blood/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          />
        )}
      </AnimatePresence>
    </Panel>
  )
}

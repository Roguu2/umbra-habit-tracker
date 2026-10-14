import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { DAY_END_FROM_HOUR, questsLeft } from '../lib/schedule.js'
import { plural, t } from '../lib/i18n'

const minutesToMidnight = (now) => 24 * 60 - (now.getHours() * 60 + now.getMinutes())

// zegar odświeżany na początku każdej minuty
function useMinute() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let id = setTimeout(function tick() {
      setNow(new Date())
      id = setTimeout(tick, 60_000 - (Date.now() % 60_000))
    }, 60_000 - (Date.now() % 60_000))
    return () => clearTimeout(id)
  }, [])
  return now
}

function timeLeft(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`
}

// Pasek na ekranie Dziś: po 20:00, gdy zostały nieodhaczone zadania — ile ich jest i ile czasu do końca dnia.
export default function DayEndBanner({ state, today }) {
  const now = useMinute()
  const reduce = useReducedMotion()
  const left = questsLeft(state, today).length
  const visible = left > 0 && now.getHours() >= DAY_END_FROM_HOUR
  const noun = plural(left, ['zadanie', 'zadania', 'zadań'], ['quest', 'quests'])
  const until = timeLeft(minutesToMidnight(now))

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="relative"
        >
          <motion.div
            aria-hidden
            className="hud-cut-sm absolute inset-0 bg-gradient-to-r from-blood-deep via-blood to-blood-deep"
            animate={reduce ? undefined : { opacity: [0.75, 1, 0.75] }}
            transition={reduce ? undefined : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <p className="relative flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 font-display text-[12px] font-bold tracking-[0.15em] text-stone-100 uppercase">
            <span>{t(`${plural(left, ['Zostało', 'Zostały', 'Zostało'], ['', ''])} ${left} ${noun}`, `${left} ${noun} left`)}</span>
            <span className="text-white/50">·</span>
            <span className="tabular-nums">{t(`${until} do końca dnia`, `${until} until the day ends`)}</span>
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

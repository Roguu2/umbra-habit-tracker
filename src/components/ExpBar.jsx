import { useEffect, useRef } from 'react'
import { animate, motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { t } from '../lib/i18n'

const FILL_SPRING = { type: 'spring', stiffness: 70, damping: 18, mass: 1 }

export default function ExpBar({ level, current, needed }) {
  const progress = useMotionValue(current / needed)
  const width = useTransform(progress, (p) => `${Math.min(Math.max(p, 0), 1) * 100}%`)
  const edgeOpacity = useTransform(progress, [0, 0.015], [0, 1])

  const expSpring = useSpring(current, { stiffness: 90, damping: 22 })
  const expText = useTransform(expSpring, (v) => Math.round(v))

  const prevLevel = useRef(level)

  useEffect(() => {
    const target = current / needed
    let controls
    let cancelled = false

    if (level > prevLevel.current) {
      // najpierw dopełnij pasek do końca, potem wyzeruj i napełnij nadwyżką
      controls = animate(progress, 1, { duration: 0.7, ease: [0.7, 0, 0.3, 1] })
      controls.then(() => {
        if (cancelled) return
        progress.set(0)
        controls = animate(progress, target, FILL_SPRING)
      })
    } else if (level < prevLevel.current) {
      progress.set(1)
      controls = animate(progress, target, { duration: 0.6, ease: 'easeOut' })
    } else {
      controls = animate(progress, target, FILL_SPRING)
    }

    prevLevel.current = level
    expSpring.set(current)

    return () => {
      cancelled = true
      controls?.stop()
    }
  }, [level, current, needed, progress, expSpring])

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-4 whitespace-nowrap font-display text-[11px] tracking-[0.3em] text-white/40 uppercase">
        <span>{t('Doświadczenie', 'Experience')}</span>
        <span className="tabular-nums tracking-[0.15em]">
          <motion.span className="text-gold-bright">{expText}</motion.span>
          <span className="text-white/30"> / {needed}</span>
        </span>
      </div>

      <div className="relative">
        <div className="bar-cut relative h-3.5 overflow-hidden bg-black/70 ring-1 ring-white/10">
          {/* podziałka */}
          <div className="absolute inset-0 z-10 flex">
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className="flex-1 border-r border-black/50 last:border-0" />
            ))}
          </div>

          <motion.div
            style={{ width }}
            className="relative h-full overflow-hidden bg-gradient-to-r from-blood-deep via-blood to-gold"
          >
            <motion.div
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
              animate={{ x: ['-120%', '420%'] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.2 }}
            />
          </motion.div>
        </div>

        {/* świecąca krawędź — poza clip-pathem, żeby poświata mogła wyjść poza pasek */}
        <motion.div
          style={{ left: width, opacity: edgeOpacity }}
          className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <motion.div
            className="size-10 rounded-full bg-[radial-gradient(circle,rgba(255,214,140,0.85)_0%,rgba(224,34,61,0.35)_40%,transparent_70%)] blur-[3px]"
            animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="absolute left-1/2 top-1/2 h-5 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-[#fff1cc] shadow-[0_0_10px_3px_rgba(255,210,130,0.9)]" />
        </motion.div>
      </div>
    </div>
  )
}

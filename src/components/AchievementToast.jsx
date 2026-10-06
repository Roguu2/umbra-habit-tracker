import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MiniRune } from './ui'
import { sfx } from '../lib/sfx'

export default function AchievementToast({ achievement, onDone }) {
  useEffect(() => {
    if (!achievement) return
    sfx.achievement()
    const t = setTimeout(onDone, 4500)
    return () => clearTimeout(t)
  }, [achievement, onDone])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4" aria-live="polite">
      <AnimatePresence mode="wait">
        {achievement && (
          <motion.button
            key={achievement.id}
            type="button"
            onClick={onDone}
            initial={{ opacity: 0, y: -40, scale: 0.9, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, scale: 0.95, filter: 'blur(6px)' }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="pointer-events-auto relative w-full max-w-sm cursor-pointer text-left"
          >
            <div className="hud-cut-sm absolute inset-0 bg-gradient-to-r from-gold/70 via-gold/20 to-blood/50" />
            <div className="hud-cut-sm absolute inset-px overflow-hidden bg-[#0c0a0b]/95 backdrop-blur-xl">
              <motion.div
                className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-gold/25 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '250%' }}
                transition={{ duration: 1.2, delay: 0.2 }}
              />
            </div>
            <div className="relative flex items-center gap-4 p-4">
              <motion.div initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', delay: 0.15 }}>
                <MiniRune rune={achievement.rune} tier="gold" lit size="size-12" />
              </motion.div>
              <div className="min-w-0">
                <p className="text-[10px] tracking-[0.35em] text-gold/80 uppercase">Osiągnięcie odblokowane</p>
                <p className="mt-0.5 font-display text-base font-black text-stone-100">{achievement.name}</p>
                <p className="text-[12px] text-white/50">{achievement.desc}</p>
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

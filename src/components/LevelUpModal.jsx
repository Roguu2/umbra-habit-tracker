import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LEVEL_UP_LINES, titleFor } from '../lib/game'

export default function LevelUpModal({ level, onClose }) {
  useEffect(() => {
    if (!level) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [level, onClose])

  return (
    <AnimatePresence>
      {level && <ModalBody key={level} level={level} onClose={onClose} />}
    </AnimatePresence>
  )
}

function ModalBody({ level, onClose }) {
  const [line] = useState(() => LEVEL_UP_LINES[Math.floor(Math.random() * LEVEL_UP_LINES.length)])
  const [rays] = useState(() =>
    Array.from({ length: 18 }, (_, i) => ({ angle: (i / 18) * 360, dist: 140 + Math.random() * 90, d: 1 + Math.random() * 0.6 })),
  )

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto overflow-x-hidden p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4, delay: 0.1 } }}
    >
      <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="levelup-title"
        initial={{ opacity: 0, scale: 0.7, y: 40, filter: 'blur(14px)' }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 0.92, y: -10, filter: 'blur(10px)', transition: { duration: 0.35 } }}
        transition={{ type: 'spring', stiffness: 160, damping: 20, delay: 0.1 }}
        className="relative w-full max-w-md text-center"
      >
        {/* obracające się promienie za panelem */}
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-2xl"
          style={{ background: 'conic-gradient(from 0deg, transparent, rgba(224,34,61,0.45), transparent 25%, rgba(226,180,90,0.4), transparent 50%, rgba(224,34,61,0.45), transparent 75%, rgba(226,180,90,0.4), transparent)' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        />
        {/* wybuch iskier */}
        <div className="pointer-events-none absolute left-1/2 top-24">
          {rays.map((r, i) => (
            <motion.span
              key={i}
              className="absolute size-1.5 rounded-full"
              style={{ background: i % 2 ? '#f5d88e' : '#ff4259', boxShadow: `0 0 10px ${i % 2 ? '#e2b45a' : '#e0223d'}` }}
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{
                x: Math.cos((r.angle * Math.PI) / 180) * r.dist,
                y: Math.sin((r.angle * Math.PI) / 180) * r.dist,
                opacity: [0, 1, 0],
              }}
              transition={{ duration: r.d, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            />
          ))}
        </div>

        <div className="hud-cut absolute inset-0 bg-gradient-to-b from-gold/60 via-blood/30 to-blood/60" />
        <div className="hud-cut absolute inset-px bg-[#0a080b]/95 backdrop-blur-2xl" />

        <div className="relative px-8 pb-9 pt-10">
          <div className="relative mx-auto grid size-36 place-items-center">
            <motion.svg
              viewBox="0 0 100 100"
              className="absolute inset-0"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 270, opacity: 1 }}
              transition={{ rotate: { duration: 2.4, ease: [0.16, 1, 0.3, 1] }, opacity: { duration: 0.4 } }}
            >
              <motion.circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="#e2b45a"
                strokeWidth="1"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 0.25, ease: 'easeInOut' }}
                style={{ filter: 'drop-shadow(0 0 4px #e2b45a)' }}
              />
              <motion.path
                d="M50 8 86.4 71H13.6Z M50 92 13.6 29h72.8Z"
                fill="none"
                stroke="#e0223d"
                strokeWidth="0.8"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4, delay: 0.45, ease: 'easeInOut' }}
              />
            </motion.svg>
            <motion.span
              initial={{ scale: 2.4, opacity: 0, filter: 'blur(10px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.55 }}
              className="text-gilded relative font-display text-6xl font-black drop-shadow-[0_0_24px_rgba(226,180,90,0.5)]"
            >
              {level}
            </motion.span>
          </div>

          <motion.p
            initial={{ opacity: 0, letterSpacing: '0.2em' }}
            animate={{ opacity: 1, letterSpacing: '0.5em' }}
            transition={{ duration: 1.2, delay: 0.7 }}
            className="mt-6 font-display text-[11px] text-gold/80 uppercase"
          >
            Poziom osiągnięty
          </motion.p>
          <motion.h2
            id="levelup-title"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.85 }}
            className="mt-2 font-display text-2xl font-black text-stone-100"
          >
            {titleFor(level)}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 1.05 }}
            className="mx-auto mt-4 max-w-xs font-lore text-lg leading-snug text-white/60 italic"
          >
            „{line}”
          </motion.p>

          <motion.button
            type="button"
            onClick={onClose}
            autoFocus
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.3 }}
            whileHover={{ scale: 1.04, boxShadow: '0 0 34px rgba(226,180,90,0.45)' }}
            whileTap={{ scale: 0.96 }}
            className="hud-cut-sm mt-8 cursor-pointer bg-gradient-to-r from-[#6b4c12] via-gold to-[#6b4c12] px-8 py-3 font-display text-xs font-bold tracking-[0.35em] text-black uppercase"
          >
            Kontynuuj wędrówkę
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

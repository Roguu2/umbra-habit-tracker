import { useMemo } from 'react'
import { motion } from 'framer-motion'

// Tło: głęboka czerń, dryfujące poświaty, ziarno i unoszące się żarzące drobiny.
export default function Atmosphere() {
  const embers = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 1 + Math.random() * 2.5,
        duration: 12 + Math.random() * 16,
        delay: Math.random() * 18,
        drift: (Math.random() - 0.5) * 120,
        gold: Math.random() > 0.65,
      })),
    [],
  )

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <motion.div
        className="absolute -left-[20vw] top-[35vh] size-[70vw] rounded-full bg-blood-deep/60 blur-[140px]"
        animate={{ x: [0, 60, -20, 0], y: [0, -40, 30, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-[15vw] -top-[20vh] size-[55vw] rounded-full bg-[#3a2a0c]/40 blur-[160px]"
        animate={{ x: [0, -50, 20, 0], y: [0, 40, -10, 0] }}
        transition={{ duration: 34, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.85)_100%)]" />
      <div className="grain absolute inset-0 opacity-[0.07] mix-blend-overlay" />

      {embers.map((e) => (
        <motion.span
          key={e.id}
          className="absolute -bottom-4 rounded-full"
          style={{
            left: `${e.left}%`,
            width: e.size,
            height: e.size,
            background: e.gold ? '#f5d88e' : '#ff4259',
            boxShadow: `0 0 ${e.size * 4}px ${e.gold ? '#e2b45a' : '#e0223d'}`,
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: '-110vh', x: e.drift, opacity: [0, 0.9, 0.7, 0] }}
          transition={{ duration: e.duration, delay: e.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  )
}

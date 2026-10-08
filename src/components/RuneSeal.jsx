import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { RUNES, TIERS } from '../lib/game'

const OUT = [0.16, 1, 0.3, 1]

// Pieczęć zastępująca checkbox: przygaszona runa, która po aktywacji "wypala się" w kolorze krwi lub złota.
// combo / weight: siła efektu ostatniego odhaczenia (lib/feedback.js)
export default function RuneSeal({ rune, tier, done, burstKey, combo = 1, weight = 0, onToggle, label }) {
  const c = TIERS[tier]
  const path = RUNES[rune % RUNES.length]

  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      onClick={onToggle}
      whileHover={{ scale: 1.07 }}
      whileTap={{ scale: 0.86 }}
      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
      className="relative grid size-16 shrink-0 cursor-pointer place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
    >
      {/* aura */}
      <motion.span
        className="absolute inset-[-6px] rounded-full"
        style={{ background: `radial-gradient(circle, ${c.glow} 0%, transparent 68%)` }}
        initial={false}
        animate={done ? { opacity: [0.65, 1, 0.65], scale: [0.95, 1.08, 0.95] } : { opacity: 0, scale: 0.5 }}
        transition={done ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}
      />

      {/* obręcz */}
      <motion.svg
        viewBox="0 0 64 64"
        className="absolute inset-0"
        initial={false}
        animate={{ rotate: done ? 360 : 0 }}
        transition={done ? { duration: 30, repeat: Infinity, ease: 'linear' } : { duration: 0.8, ease: OUT }}
      >
        <circle
          cx="32"
          cy="32"
          r="29"
          fill="none"
          stroke={done ? c.main : 'rgba(255,255,255,0.14)'}
          strokeWidth="1"
          strokeDasharray="1.5 4.5"
          style={{ transition: 'stroke 0.5s' }}
        />
        <path
          d="M32 9 52 20.5v23L32 55 12 43.5v-23Z"
          fill={done ? `${c.main}1f` : 'rgba(0,0,0,0.45)'}
          stroke={done ? c.main : 'rgba(255,255,255,0.18)'}
          strokeWidth="1.2"
          style={{ transition: 'all 0.5s' }}
        />
      </motion.svg>

      {/* runa */}
      <motion.svg
        key={`rune-${burstKey}`}
        viewBox="0 0 24 24"
        className="relative size-7"
        initial={false}
        animate={done && burstKey > 0 ? { scale: [1, 1.5, 0.9, 1.05, 1] } : { scale: 1 }}
        transition={{ duration: 0.7, ease: OUT }}
      >
        <path
          d={path}
          fill="none"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <motion.path
          d={path}
          fill="none"
          stroke={c.bright}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 3px ${c.main}) drop-shadow(0 0 8px ${c.main})` }}
          initial={false}
          animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }}
          transition={{ pathLength: { duration: 0.55, ease: 'easeInOut' }, opacity: { duration: 0.2 } }}
        />
      </motion.svg>

      {burstKey > 0 && <Burst key={`burst-${burstKey}`} color={comboColor(c, combo)} combo={combo} weight={weight} />}
    </motion.button>
  )
}

// combo przechodzi z koloru zadania w złoto, a przy maksymalnym w białe złoto
function comboColor(color, combo) {
  if (combo >= 5) return { main: '#ffe3a0', bright: '#fff6dc', glow: 'rgba(255, 227, 160, 0.7)' }
  if (combo >= 3) return TIERS.gold
  return color
}

function Burst({ color, combo, weight }) {
  const reduceMotion = useReducedMotion()
  // trudniejsze zadanie i dłuższe combo — więcej i dalej lecących iskier; zwykłe zadanie zostaje subtelne
  const [sparks] = useState(() => {
    const count = 10 + Math.round(8 * weight) + 3 * (combo - 1)
    const reach = 1 + 0.35 * weight + 0.08 * (combo - 1)
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.35
      const dist = (38 + Math.random() * 26) * reach
      return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, size: 2 + Math.random() * 2.5, d: 0.6 + Math.random() * 0.4 }
    })
  })

  // przy prefers-reduced-motion tylko krótki błysk, bez fal i iskier
  if (reduceMotion) {
    return (
      <motion.span
        className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,#fff_0%,rgba(255,255,255,0)_60%)]"
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      />
    )
  }

  return (
    <span className="pointer-events-none absolute inset-0">
      {/* błysk */}
      <motion.span
        className="absolute inset-0 rounded-full bg-[radial-gradient(circle,#fff_0%,rgba(255,255,255,0)_60%)]"
        initial={{ scale: 0.3, opacity: 1 }}
        animate={{ scale: 1.9, opacity: 0 }}
        transition={{ duration: 0.5, ease: OUT }}
      />
      {/* fale uderzeniowe — trzecia przy dłuższym combo */}
      {(combo >= 3 ? [0, 0.12, 0.24] : [0, 0.12]).map((delay) => (
        <motion.span
          key={delay}
          className="absolute inset-0 rounded-full border"
          style={{ borderColor: color.bright, boxShadow: `0 0 18px ${color.glow}, inset 0 0 12px ${color.glow}` }}
          initial={{ scale: 0.6, opacity: 0.95 }}
          animate={{ scale: 2.8, opacity: 0 }}
          transition={{ duration: 0.9, delay, ease: OUT }}
        />
      ))}
      {/* iskry */}
      {sparks.map((s, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: s.size,
            height: s.size,
            marginLeft: -s.size / 2,
            marginTop: -s.size / 2,
            background: color.bright,
            boxShadow: `0 0 8px 1px ${color.main}`,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: s.x, y: s.y, opacity: 0, scale: 0.2 }}
          transition={{ duration: s.d, ease: OUT }}
        />
      ))}
    </span>
  )
}

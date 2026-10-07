import { motion } from 'framer-motion'
import { RUNES, TIERS } from '../lib/game'
import { sfx } from '../lib/sfx'

export function Panel({ title, subtitle, action, children, delay = 0.1, className = '', accent = 'gold' }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`relative ${className}`}
    >
      <div
        className={`hud-cut-sm absolute inset-0 bg-gradient-to-bl from-white/12 via-white/[0.03] ${
          accent === 'blood' ? 'to-blood/25' : 'to-gold/15'
        }`}
      />
      <div className="hud-cut-sm absolute inset-px bg-[#09080b]/80 backdrop-blur-xl" />
      <div className="relative p-5 sm:p-6">
        {(title || action) && (
          <header className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex items-baseline gap-3">
              <h2 className="font-display text-sm font-bold tracking-[0.3em] text-stone-200 uppercase">{title}</h2>
              {subtitle && <span className="font-lore text-sm text-white/35 italic">{subtitle}</span>}
            </div>
            {action}
          </header>
        )}
        {children}
      </div>
    </motion.section>
  )
}

export function StatTile({ label, value, hint, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <div className="hud-cut-sm absolute inset-0 bg-gradient-to-br from-white/12 to-white/[0.02]" />
      <div className="hud-cut-sm absolute inset-px bg-[#0a090c]/85 backdrop-blur-xl" />
      <div className="relative p-4">
        <p className="text-[10px] tracking-[0.25em] text-white/40 uppercase">{label}</p>
        <p className="mt-1.5 font-display text-2xl font-bold tabular-nums text-stone-100 sm:text-[28px]">{value}</p>
        {hint && <p className="mt-1 text-[11px] text-white/40">{hint}</p>}
      </div>
    </motion.div>
  )
}

export function MiniRune({ rune, tier = 'blood', lit = false, size = 'size-7' }) {
  const c = TIERS[tier]
  return (
    <span className={`relative grid shrink-0 place-items-center ${size}`}>
      <svg viewBox="0 0 64 64" className="absolute inset-0">
        <path
          d="M32 6 54 19v26L32 58 10 45V19Z"
          fill={lit ? `${c.main}26` : 'rgba(0,0,0,0.4)'}
          stroke={lit ? c.main : 'rgba(255,255,255,0.16)'}
          strokeWidth="2.5"
        />
      </svg>
      <svg viewBox="0 0 24 24" className="relative size-1/2">
        <path
          d={RUNES[rune % RUNES.length]}
          fill="none"
          stroke={lit ? c.bright : 'rgba(255,255,255,0.35)'}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={lit ? { filter: `drop-shadow(0 0 3px ${c.main})` } : undefined}
        />
      </svg>
    </span>
  )
}

// przełącznik kilku opcji z płynnie przesuwanym podświetleniem
export function Segmented({ id, options, value, onChange, size = 'md' }) {
  return (
    <div role="radiogroup" className="inline-flex flex-wrap gap-1 bg-black/30 p-1 ring-1 ring-white/10">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => {
              if (!on) sfx.tick()
              onChange(o.value)
            }}
            className={`relative cursor-pointer tracking-wider transition-colors ${
              size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
            } ${on ? 'text-stone-100' : 'text-white/45 hover:text-white/80'}`}
          >
            {on && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 bg-blood/30 ring-1 ring-blood-bright/70"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// tarcza passy (lib/shields.js)
export function ShieldIcon({ className = 'size-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="#e2b45a" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.2 7.5 9.5 4.4-1.3 7.5-4.9 7.5-9.5V6Z" fill="rgba(226,180,90,0.15)" />
      <path d="M12 8v8M8.5 11.5h7" stroke="#ff5a6e" />
    </svg>
  )
}

export const pct =(v) => (v === null || v === undefined ? '—' : `${Math.round(v * 100)}%`)

import { motion } from 'framer-motion'
import { DAY_LONG, DAY_SHORT, TIERS, WEEK_ORDER } from '../lib/game'
import { sfx } from '../lib/sfx'

// Wybór dni tygodnia w formie małych rombów-pieczęci.
export default function DayPicker({ days, onChange, tier = 'blood', compact = false }) {
  const c = TIERS[tier]
  const toggle = (d) => {
    sfx.tick()
    onChange(days.includes(d) ? days.filter((x) => x !== d) : [...days, d])
  }

  return (
    <div className={`flex ${compact ? 'gap-1' : 'gap-1.5'}`} role="group" aria-label="Dni tygodnia">
      {WEEK_ORDER.map((d) => {
        const on = days.includes(d)
        return (
          <motion.button
            key={d}
            type="button"
            onClick={() => toggle(d)}
            aria-pressed={on}
            aria-label={DAY_LONG[d]}
            title={DAY_LONG[d]}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.88 }}
            className={`relative grid cursor-pointer place-items-center font-display font-bold ${
              compact ? 'size-8 text-[10px]' : 'size-9 text-[11px]'
            }`}
          >
            <motion.span
              className="absolute inset-[18%] rotate-45"
              initial={false}
              animate={{
                backgroundColor: on ? `${c.main}33` : 'rgba(0,0,0,0.35)',
                borderColor: on ? c.main : 'rgba(255,255,255,0.14)',
                boxShadow: on ? `0 0 12px ${c.glow}` : '0 0 0 rgba(0,0,0,0)',
              }}
              style={{ borderWidth: 1, borderStyle: 'solid' }}
              transition={{ duration: 0.25 }}
            />
            <span className={`relative ${on ? 'text-stone-100' : 'text-white/35'}`}>{DAY_SHORT[d]}</span>
          </motion.button>
        )
      })}
    </div>
  )
}

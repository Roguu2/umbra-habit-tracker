import { AnimatePresence, motion } from 'framer-motion'
import { useEscape } from '../hooks/useEscape'
import { t } from '../lib/i18n'

// Wspólne okno dialogowe w stylu HUD. Treść przewija się, gdy nie mieści się na ekranie.
export default function Modal({ open, title, onClose, wide = false, children }) {
  return <AnimatePresence>{open && <Body title={title} onClose={onClose} wide={wide}>{children}</Body>}</AnimatePresence>
}

function Body({ title, onClose, wide, children }) {
  useEscape(onClose)

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-end overflow-y-auto sm:place-items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-lg'}`}
      >
        <div className="hud-cut absolute inset-0 bg-gradient-to-b from-gold/40 via-white/[0.06] to-blood/40" />
        <div className="hud-cut absolute inset-px bg-[#0b0a0d]/95 backdrop-blur-2xl" />

        <div className="relative space-y-7 p-6 sm:p-7">
          <header className="flex items-center justify-between gap-4">
            <h2 className="font-display text-sm font-bold tracking-[0.3em] text-stone-200 uppercase">{title}</h2>
            <button type="button" onClick={onClose} aria-label={t('Zamknij', 'Close')} className="cursor-pointer px-2 text-white/40 hover:text-white">
              ✕
            </button>
          </header>
          {children}
        </div>
      </motion.div>
    </motion.div>
  )
}

export function Section({ label, children }) {
  return (
    <section>
      <p className="mb-3 text-[10px] tracking-[0.3em] text-white/40 uppercase">{label}</p>
      {children}
    </section>
  )
}

export const Hint = ({ children }) => <p className="text-[12px] leading-relaxed text-white/45">{children}</p>

export function Button({ children, type = 'button', danger = false, ...props }) {
  return (
    <button
      type={type}
      {...props}
      className={`cursor-pointer border bg-black/30 px-3.5 py-2 text-[11px] tracking-[0.2em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
        danger
          ? 'border-blood/50 text-blood-bright/80 hover:border-blood-bright hover:text-blood-bright'
          : 'border-white/15 text-white/70 hover:border-gold/60 hover:text-gold-bright'
      }`}
    >
      {children}
    </button>
  )
}

import { motion } from 'framer-motion'
import { RUNES } from '../lib/game'
import { sfx } from '../lib/sfx'
import { t } from '../lib/i18n'

export const TABS = [
  { id: 'today', label: t('Dziś', 'Today'), rune: 0 },
  { id: 'plan', label: t('Plan', 'Plan'), rune: 2 },
  { id: 'progress', label: t('Postępy', 'Progress'), rune: 8 },
]

export default function NavTabs({ active, onChange }) {
  const select = (id) => {
    if (id === active) return
    sfx.page()
    onChange(id)
  }

  const onKeyDown = (e) => {
    const i = TABS.findIndex((t) => t.id === active)
    if (e.key === 'ArrowRight') select(TABS[(i + 1) % TABS.length].id)
    if (e.key === 'ArrowLeft') select(TABS[(i - 1 + TABS.length) % TABS.length].id)
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15 }}
      className="mt-6 flex justify-center sm:justify-start sm:pl-[136px]"
    >
      <div role="tablist" aria-label={t('Widoki', 'Views')} onKeyDown={onKeyDown} className="relative flex w-full gap-1 sm:w-auto">
        {TABS.map((tab) => {
          const on = tab.id === active
          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={on}
              aria-controls={`panel-${tab.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => select(tab.id)}
              className={`group relative flex flex-1 cursor-pointer items-center justify-center gap-2 px-2 py-2.5 font-display text-[11px] font-bold tracking-[0.2em] uppercase transition-colors sm:flex-none sm:px-5 sm:tracking-[0.3em] ${
                on ? 'text-stone-100' : 'text-white/35 hover:text-white/70'
              }`}
            >
              {on && (
                <motion.span
                  layoutId="nav-active"
                  className="hud-cut-sm absolute inset-0 bg-gradient-to-b from-blood/25 to-transparent"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                >
                  <span className="absolute inset-x-3 bottom-0 h-px bg-blood-bright shadow-[0_0_10px_2px_rgba(255,66,89,0.7)]" />
                </motion.span>
              )}
              <svg viewBox="0 0 24 24" className="relative size-3.5" aria-hidden>
                <path
                  d={RUNES[tab.rune]}
                  fill="none"
                  stroke={on ? '#ff5a6e' : 'currentColor'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="relative">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </motion.nav>
  )
}

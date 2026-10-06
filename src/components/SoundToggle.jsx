import { useState } from 'react'
import { motion } from 'framer-motion'
import { isMuted, setMuted, sfx } from '../lib/sfx'
import { t } from '../lib/i18n'

export default function SoundToggle() {
  const [muted, setMutedState] = useState(isMuted)

  const toggle = () => {
    const next = !muted
    setMuted(next)
    setMutedState(next)
    if (!next) sfx.tick()
  }

  return (
    <motion.button
      type="button"
      onClick={toggle}
      aria-pressed={!muted}
      aria-label={muted ? t('Włącz dźwięk', 'Turn sound on') : t('Wycisz dźwięk', 'Mute sound')}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.6 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      className="hud-cut-sm fixed bottom-4 right-4 z-40 flex cursor-pointer items-center gap-2.5 bg-[#0b0a0d]/80 px-3.5 py-2.5 ring-1 ring-white/10 backdrop-blur-xl sm:bottom-6 sm:right-6"
    >
      <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
        <path d="M2 6h2.5L8 3v10L4.5 10H2Z" fill={muted ? 'rgba(255,255,255,0.3)' : '#e0223d'} />
        {muted && <path d="m11 6 4 4m0-4-4 4" stroke="rgba(255,255,255,0.35)" strokeWidth="1.3" strokeLinecap="round" />}
      </svg>
      {!muted && (
        <span className="flex h-3 items-end gap-[2px]" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-full w-[2px] origin-bottom bg-gold-bright shadow-[0_0_4px_#e2b45a]"
              style={{ animation: `eq-bar ${1.2 + i * 0.25}s ease-in-out infinite` }}
            />
          ))}
        </span>
      )}
      <span className="font-display text-[10px] tracking-[0.3em] text-white/45 uppercase">{muted ? t('Cisza', 'Muted') : t('Dźwięk', 'Sound')}</span>
    </motion.button>
  )
}

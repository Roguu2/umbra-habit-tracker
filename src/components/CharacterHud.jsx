import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ExpBar from './ExpBar'
import { sfx } from '../lib/sfx'
import { t } from '../lib/i18n'

// imię postaci — kliknij, wpisz, Enter
function HeroName({ name, onRename }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)

  const commit = () => {
    setEditing(false)
    const next = draft.trim() || t('Wędrowiec', 'Wanderer')
    setDraft(next)
    if (next !== name) {
      sfx.quill()
      onRename(next)
    }
  }

  if (editing)
    return (
      <input
        autoFocus
        value={draft}
        maxLength={28}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        aria-label={t('Imię postaci', 'Character name')}
        className="w-full max-w-xs border-b border-gold/60 bg-transparent font-display text-[11px] tracking-[0.3em] text-stone-100 uppercase outline-none"
      />
    )

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(name)
        setEditing(true)
      }}
      title={t('Kliknij, aby zmienić imię', 'Click to change name')}
      className="group flex cursor-pointer items-center gap-2 font-display text-[10px] tracking-[0.3em] text-white/40 uppercase hover:text-white/70 sm:tracking-[0.5em]"
    >
      {name}
      <svg viewBox="0 0 16 16" className="size-3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden>
        <path d="M11 2.5l2.5 2.5L6 12.5H3.5V10Z" fill="none" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    </button>
  )
}

export default function CharacterHud({ name, onRename, level, title, current, needed, doneCount, questCount }) {
  const ratio = questCount ? doneCount / questCount : 0

  return (
    <motion.header
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <div className="hud-cut absolute inset-0 bg-gradient-to-br from-white/15 via-white/[0.03] to-blood/30" />
      <div className="hud-cut absolute inset-px bg-[#09080b]/85 backdrop-blur-2xl" />

      <div className="relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-5 gap-y-6 p-5 sm:gap-x-8 sm:p-7 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
        <Sigil level={level} />

        <div className="min-w-0">
          <HeroName name={name} onRename={onRename} />
          <AnimatePresence mode="wait">
            <motion.h1
              key={title}
              initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
              transition={{ duration: 0.5 }}
              className="mt-1 font-display text-2xl font-black tracking-wide text-stone-100 sm:text-3xl"
            >
              {title}
            </motion.h1>
          </AnimatePresence>
          <div className="mt-5">
            <ExpBar level={level} current={current} needed={needed} />
          </div>
        </div>

        <DailyRing ratio={ratio} doneCount={doneCount} questCount={questCount} />
      </div>
    </motion.header>
  )
}

function Sigil({ level }) {
  return (
    <div className="relative grid size-24 place-items-center sm:size-28">
      <svg viewBox="0 0 100 100" className="absolute inset-0 animate-[spin_60s_linear_infinite]">
        <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(201,162,74,0.35)" strokeWidth="0.6" strokeDasharray="1 3" />
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d="M50 2v6" stroke="rgba(201,162,74,0.6)" strokeWidth="1" transform={`rotate(${i * 45} 50 50)`} />
        ))}
      </svg>
      <svg viewBox="0 0 100 100" className="absolute inset-2 animate-[spin_40s_linear_infinite_reverse]">
        <path d="M50 6 88 72H12Z" fill="none" stroke="rgba(224,34,61,0.35)" strokeWidth="0.8" />
        <path d="M50 94 12 28h76Z" fill="none" stroke="rgba(224,34,61,0.25)" strokeWidth="0.8" />
      </svg>
      <div className="relative grid size-14 place-items-center rounded-full bg-black/70 shadow-[0_0_30px_rgba(195,20,47,0.35),inset_0_0_14px_rgba(201,162,74,0.25)] ring-1 ring-gold/40 sm:size-16">
        <div className="text-center leading-none">
          <span className="block font-display text-[8px] tracking-[0.3em] text-gold/70 uppercase">Lvl</span>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={level}
              initial={{ y: 14, opacity: 0, scale: 1.6 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="text-gilded block font-display text-2xl font-black sm:text-[28px]"
            >
              {level}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function DailyRing({ ratio, doneCount, questCount }) {
  const complete = questCount > 0 && doneCount === questCount
  return (
    <div className="col-span-2 flex items-center gap-4 lg:col-span-1 lg:-mt-10 lg:flex-col lg:gap-2">
      <div className="relative size-20">
        <svg viewBox="0 0 80 80" className="size-full -rotate-90">
          <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
          <motion.circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke={complete ? '#e2b45a' : '#e0223d'}
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: ratio }}
            transition={{ type: 'spring', stiffness: 60, damping: 16 }}
            style={{ filter: `drop-shadow(0 0 6px ${complete ? '#e2b45a' : '#e0223d'})`, transition: 'stroke 0.6s' }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center font-display text-lg font-bold tabular-nums text-stone-100">
          {doneCount}/{questCount}
        </div>
      </div>
      <p className="font-display text-[10px] tracking-[0.35em] text-white/40 uppercase lg:text-center">
        {complete ? <span className="text-gold-bright">{t('Dzień zdobyty', 'Day conquered')}</span> : t('Wykonane dziś', 'Done today')}
      </p>
    </div>
  )
}

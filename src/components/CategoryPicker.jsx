import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CATEGORIES, categoryOf } from '../lib/game'
import { sfx } from '../lib/sfx'
import { t } from '../lib/i18n'

// Kategoria pod nazwą zadania: wykryta z nazwy albo wybrana ręcznie (value = klucz kategorii, null = z nazwy).
// original — zapisane zadanie przy edycji: zmiana kategorii zmienia EXP całej jego historii (EXP liczy się z historii).
export default function CategoryPicker({ name, value, onChange, original }) {
  const [open, setOpen] = useState(false)
  const key = categoryOf({ name, category: value })
  const detected = CATEGORIES[categoryOf({ name })]
  const current = CATEGORIES[key]
  const changed = original && value !== (original.category ?? null) && key !== original.attr
  const visible = name.trim() || value

  const choose = (next) => {
    sfx.tick()
    onChange(next)
  }

  const option = (k, label, exp) => (
    <button
      key={k ?? 'auto'}
      type="button"
      role="radio"
      aria-checked={value === k}
      onClick={() => choose(k)}
      className={`flex cursor-pointer items-center justify-between gap-3 px-2.5 py-1.5 text-left text-[11px] transition-colors ${
        value === k ? 'bg-gold/[0.1] text-gold-bright shadow-[inset_0_0_0_1px_rgba(226,180,90,0.4)]' : 'bg-black/30 text-white/60 hover:text-white'
      }`}
    >
      <span className="truncate">{label}</span>
      <span className="shrink-0 tabular-nums text-gold/80">+{exp} EXP</span>
    </button>
  )

  return (
    <div className="mt-2 min-h-4 text-[11px]">
      {visible && (
        <div className="flex flex-wrap items-center gap-x-2 tracking-[0.15em] text-white/40 uppercase">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={key} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="inline-block">
              {current.label} · <span className="text-gold-bright">+{current.exp} EXP</span>
            </motion.span>
          </AnimatePresence>
          <span className="tracking-normal normal-case text-white/30">· {value ? t('wybrana ręcznie', 'set manually') : t('z nazwy', 'from the name')}</span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="cursor-pointer tracking-widest text-gold/70 uppercase hover:text-gold-bright"
          >
            {open ? t('Zwiń', 'Done') : t('Zmień', 'Change')}
          </button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {visible && open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div role="radiogroup" aria-label={t('Kategoria zadania', 'Quest category')} className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
              {option(null, t(`Auto (z nazwy): ${detected.label}`, `Auto (from the name): ${detected.label}`), detected.exp)}
              {Object.entries(CATEGORIES).map(([k, c]) => option(k, c.label, c.exp))}
            </div>
            <p className="mt-1.5 text-white/35">
              {t('Ręczna kategoria zostaje przy zmianie nazwy.', 'A manual category stays when you rename the quest.')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {changed && (
        <p role="status" className="mt-1.5 text-blood-bright/80">
          {t('Zmieni to EXP także za wcześniejsze wykonania.', 'This also changes EXP for earlier completions.')}
        </p>
      )}
    </div>
  )
}

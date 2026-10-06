import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Segmented } from './ui'
import { ALL_DAYS, CATEGORIES, detectCategory, formatDay } from '../lib/game'
import { sfx } from '../lib/sfx'
import { t } from '../lib/i18n'

// Szybkie dodawanie: wpisz i Enter. Godzina i powtarzanie są opcjonalne.
const SUGGESTIONS = [
  t('Trening', 'Workout'),
  t('Spacer 30 min', 'Walk 30 min'),
  t('Czytanie 20 stron', 'Read 20 pages'),
  t('Wypić 2 l wody', 'Drink 2 l of water'),
  t('Rozciąganie', 'Stretching'),
]

// suggest: pokazuje podpowiedzi (np. gdy plan jest jeszcze pusty)
export default function QuickAdd({ date, isToday, onAdd, onMore, id = 'quick', suggest = false }) {
  const [name, setName] = useState('')
  const inputRef = useRef(null)
  const [time, setTime] = useState('')
  const [repeat, setRepeat] = useState('once')

  const category = name.trim() ? CATEGORIES[detectCategory(name)] : null

  const submit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    sfx.forge()
    onAdd({ name: name.trim(), time, steps: [], date: repeat === 'once' ? date : null, days: repeat === 'daily' ? ALL_DAYS : [] })
    setName('')
    setTime('')
  }

  const dayLabel = isToday ? t('Tylko dziś', 'Today only') : t(`Tylko ${formatDay(date, { weekday: 'short', day: 'numeric' })}`, `Only ${formatDay(date, { weekday: 'short', day: 'numeric' })}`)

  return (
    <form onSubmit={submit} className="relative">
      <div className="hud-cut-sm absolute inset-0 bg-gradient-to-r from-blood/50 via-white/10 to-white/5" />
      <div className="hud-cut-sm absolute inset-px bg-[#0b0a0d]/90 backdrop-blur-xl" />
      <div className="relative p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="pl-1 font-display text-xl text-blood-bright" aria-hidden>
            +
          </span>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('Dodaj do planu… np. Trening nóg', 'Add to the plan… e.g. Leg day')}
            maxLength={60}
            aria-label={t('Nowe zadanie', 'New quest')}
            className="min-w-0 flex-1 bg-transparent py-1.5 font-display text-base text-stone-100 outline-none placeholder:text-white/30"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            aria-label={t('Godzina (opcjonalnie)', 'Time (optional)')}
            title={t('Godzina (opcjonalnie)', 'Time (optional)')}
            className="w-[92px] shrink-0 border border-white/10 bg-black/40 px-2 py-1.5 text-sm text-stone-200 outline-none [color-scheme:dark] focus:border-blood-bright"
          />
          <motion.button
            type="submit"
            disabled={!name.trim()}
            whileTap={{ scale: 0.92 }}
            className="hidden shrink-0 cursor-pointer bg-blood px-4 py-2 font-display text-[11px] font-bold tracking-[0.2em] text-stone-100 uppercase transition-opacity disabled:cursor-default disabled:opacity-30 sm:block"
          >
            {t('Dodaj', 'Add')}
          </motion.button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              id={id}
              size="sm"
              value={repeat}
              onChange={setRepeat}
              options={[
                { value: 'once', label: dayLabel },
                { value: 'daily', label: t('Codziennie', 'Daily') },
              ]}
            />
            <button
              type="button"
              onClick={() => {
                sfx.tick()
                onMore({ name: name.trim(), time, date: repeat === 'once' ? date : null, days: repeat === 'daily' ? ALL_DAYS : [], steps: [] })
                setName('')
                setTime('')
              }}
              className="cursor-pointer px-1 text-[11px] tracking-wider text-white/45 hover:text-gold-bright"
            >
              {t('Więcej opcji…', 'More options…')}
            </button>
          </div>
          <AnimatePresence mode="wait">
            {category && (
              <motion.span
                key={category.label}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-[10px] tracking-[0.18em] text-white/40 uppercase"
              >
                {category.label} · <span className="text-gold-bright">+{category.exp} EXP</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence initial={false}>
          {suggest && !name && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-1.5 border-t border-white/[0.06] pt-3 mt-3">
                <span className="mr-1 text-[10px] tracking-[0.2em] text-white/35 uppercase">{t('Np.', 'E.g.')}</span>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      sfx.tick()
                      setName(s)
                      inputRef.current?.focus()
                    }}
                    className="cursor-pointer px-2.5 py-1 text-xs text-white/60 ring-1 ring-white/10 transition-colors hover:bg-white/[0.05] hover:text-white hover:ring-gold/50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </form>
  )
}

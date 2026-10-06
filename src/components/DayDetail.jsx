import { AnimatePresence, motion } from 'framer-motion'
import { MiniRune } from './ui'
import { formatDay, shiftKey } from '../lib/game'
import { dayStats } from '../lib/stats'
import { sfx } from '../lib/sfx'

const STATUS = { done: 'wykonane', missed: 'pominięte', planned: 'do zrobienia', extra: 'dodatkowo' }

// Szczegóły wybranego dnia. Dziś i wczoraj można jeszcze uzupełnić; starsze dni są tylko do odczytu.
export default function DayDetail({ state, today, dayKeyValue, actions }) {
  const s = dayStats(state, dayKeyValue)
  const editable = dayKeyValue === today || dayKeyValue === shiftKey(today, -1)
  const future = dayKeyValue > today
  const done = new Set(state.history[dayKeyValue] ?? [])

  const toggle = (q) => {
    if (!editable) return
    if (done.has(q.id)) sfx.unseal()
    else sfx.seal(q.tier)
    actions.toggleQuest(q.id, dayKeyValue)
  }

  const rows = [
    ...s.scheduled.map((q) => ({ q, kind: done.has(q.id) ? 'done' : dayKeyValue >= today ? 'planned' : 'missed' })),
    ...s.extra.map((q) => ({ q, kind: 'extra' })),
  ]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={dayKeyValue}
        initial={{ opacity: 0, x: 16, filter: 'blur(4px)' }}
        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, x: -16, filter: 'blur(4px)' }}
        transition={{ duration: 0.3 }}
      >
        <p className="font-display text-lg font-bold text-stone-100 first-letter:uppercase">{formatDay(dayKeyValue)}</p>
        {!future && rows.length > 0 && (
          <p className="mt-2 text-[11px] tracking-[0.15em] text-white/45 uppercase">
            <span className="text-stone-200 tabular-nums">
              {s.scheduledDone.length}/{s.scheduled.length}
            </span>{' '}
            wykonane · <span className="text-stone-200 tabular-nums">{s.exp}</span> EXP
            {s.perfect && <span className="text-gold-bright"> · pełny dzień</span>}
          </p>
        )}

        <ul className="mt-5 space-y-1">
          {rows.length === 0 && <li className="font-lore text-base text-white/35 italic">Wolny dzień.</li>}
          {rows.map(({ q, kind }) => (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => toggle(q)}
                disabled={!editable}
                className={`flex w-full items-center gap-3 py-1 text-left ${editable ? 'cursor-pointer hover:bg-white/[0.03]' : 'cursor-default'}`}
              >
                <MiniRune rune={q.rune} tier={q.tier} lit={kind === 'done' || kind === 'extra'} />
                <span className={`min-w-0 flex-1 truncate text-sm ${kind === 'missed' ? 'text-white/40 line-through decoration-blood/60' : 'text-stone-200'}`}>
                  {q.name}
                </span>
                <span className="shrink-0 text-[10px] tracking-[0.15em] text-white/35 uppercase">{STATUS[kind]}</span>
              </button>
            </li>
          ))}
        </ul>
        {editable && dayKeyValue !== today && rows.length > 0 && (
          <p className="mt-3 text-[11px] text-white/35">Zapomniałeś odhaczyć? Kliknij zadanie, żeby uzupełnić wczoraj.</p>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

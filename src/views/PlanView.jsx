import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import QuickAdd from '../components/QuickAdd'
import { MiniRune, Panel } from '../components/ui'
import { ALL_DAYS, DAY_SHORT, dayKey, describeRepeat, formatDay, parseKey, shiftKey, weekStart } from '../lib/game'
import { activeQuests, byTime, dayStats, keysBetween, questStreaks } from '../lib/stats'
import { sfx } from '../lib/sfx'

export default function PlanView({ game, focusDay, onEdit }) {
  const { state, today, actions } = game
  const [selected, setSelected] = useState(focusDay ?? today)
  const [weekOffset, setWeekOffset] = useState(() => weekOffsetOf(focusDay ?? today, today))

  useEffect(() => {
    if (!focusDay) return
    setSelected(focusDay)
    setWeekOffset(weekOffsetOf(focusDay, today))
  }, [focusDay, today])

  const weekFrom = shiftKey(dayKey(weekStart(parseKey(today))), weekOffset * 7)
  const week = useMemo(() => keysBetween(weekFrom, shiftKey(weekFrom, 6)).map((k) => dayStats(state, k)), [state, weekFrom])
  const habits = activeQuests(state).filter((q) => !q.date).sort(byTime)

  const go = (delta) => {
    sfx.page()
    setWeekOffset((w) => w + delta)
  }

  return (
    <div className="space-y-8">
      <Panel
        title="Tydzień"
        accent="blood"
        delay={0.05}
        action={
          <div className="flex items-center gap-1">
            <NavBtn onClick={() => go(-1)} label="Poprzedni tydzień">
              ‹
            </NavBtn>
            <button
              type="button"
              onClick={() => weekOffset !== 0 && go(-weekOffset)}
              title="Wróć do bieżącego tygodnia"
              className={`cursor-pointer px-3 font-display text-[11px] tracking-[0.2em] uppercase ${weekOffset === 0 ? 'text-gold-bright' : 'text-white/45 hover:text-white'}`}
            >
              {formatDay(weekFrom, { day: 'numeric', month: 'short' })} – {formatDay(shiftKey(weekFrom, 6), { day: 'numeric', month: 'short' })}
            </button>
            <NavBtn onClick={() => go(1)} label="Następny tydzień">
              ›
            </NavBtn>
          </div>
        }
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={weekFrom}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7"
          >
            {week.map((d) => (
              <DayColumn
                key={d.key}
                d={d}
                today={today}
                selected={d.key === selected}
                onSelect={() => {
                  sfx.tick()
                  setSelected(d.key)
                }}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </Panel>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <SelectedDay state={state} today={today} dayKeyValue={selected} actions={actions} onEdit={onEdit} />

        <Panel
          title="Stałe nawyki"
          subtitle="powtarzają się same"
          delay={0.2}
          className="lg:mt-10"
          action={
            <button
              type="button"
              onClick={() => {
                sfx.tick()
                onEdit({ name: '', time: '', days: ALL_DAYS, date: null, steps: [] })
              }}
              className="cursor-pointer text-[11px] tracking-[0.2em] text-gold/80 uppercase hover:text-gold-bright"
            >
              + Nowy
            </button>
          }
        >
          <ul className="space-y-1">
            {habits.map((q) => {
              const streak = questStreaks(state, q, today).current
              return (
                <li key={q.id}>
                  <motion.button
                    type="button"
                    onClick={() => {
                      sfx.tick()
                      onEdit(q)
                    }}
                    whileHover={{ x: 4 }}
                    className="flex w-full cursor-pointer items-center gap-3 px-2 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="w-11 shrink-0 text-right font-display text-xs tabular-nums text-white/45">{q.time ?? '—'}</span>
                    <MiniRune rune={q.rune} tier={q.tier} lit size="size-7" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-stone-100">{q.name}</span>
                      <span className="block text-[10px] tracking-[0.15em] text-white/40 uppercase">
                        {describeRepeat(q)}
                        {q.steps.length > 0 && ` · ${q.steps.length} kroków`}
                      </span>
                    </span>
                    {streak > 0 && <span className="shrink-0 text-xs text-white/50">🔥 {streak}</span>}
                  </motion.button>
                </li>
              )
            })}
            {habits.length === 0 && <li className="font-lore text-white/40 italic">Brak stałych nawyków — dodaj pierwszy.</li>}
          </ul>
          <p className="mt-4 text-[11px] text-white/30">Kliknij nawyk, aby zmienić godzinę, dni albo kroki.</p>
        </Panel>
      </div>
    </div>
  )
}

function weekOffsetOf(key, today) {
  const a = weekStart(parseKey(key))
  const b = weekStart(parseKey(today))
  return Math.round((a - b) / (7 * 86400000))
}

function NavBtn({ onClick, label, children }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      className="grid size-7 cursor-pointer place-items-center border border-white/10 font-display text-base text-white/60 hover:border-blood-bright hover:text-white"
    >
      {children}
    </motion.button>
  )
}

function DayColumn({ d, today, selected, onSelect }) {
  const past = d.key < today
  const isToday = d.key === today
  const done = new Set(d.scheduledDone.map((q) => q.id))

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -4 }}
      aria-pressed={selected}
      className={`relative flex min-h-40 cursor-pointer flex-col p-3 text-left transition-colors ${
        selected ? 'bg-white/[0.06]' : 'bg-black/25 hover:bg-white/[0.04]'
      }`}
      style={{
        boxShadow: selected
          ? 'inset 0 0 0 1px rgba(255,227,160,0.6), 0 0 18px rgba(226,180,90,0.15)'
          : isToday
            ? 'inset 0 0 0 1px rgba(255,66,89,0.6)'
            : 'inset 0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-baseline justify-between">
        <span className={`font-display text-[11px] font-bold tracking-[0.25em] uppercase ${isToday ? 'text-blood-bright' : 'text-white/50'}`}>
          {isToday ? 'Dziś' : DAY_SHORT[parseKey(d.key).getDay()]}
        </span>
        <span className="font-display text-lg font-bold tabular-nums text-stone-200">{parseKey(d.key).getDate()}</span>
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-1.5">
        {d.scheduled.length === 0 && <span className="font-lore text-sm text-white/30 italic">wolne</span>}
        {d.scheduled.map((q) => {
          const lit = done.has(q.id)
          return (
            <span key={q.id} className="flex min-w-0 items-center gap-1.5">
              <MiniRune rune={q.rune} tier={q.tier} lit={lit} size="size-5" />
              <span className={`truncate text-[11px] ${past && !lit ? 'text-white/30 line-through' : 'text-white/70'}`}>
                {q.time && <span className="tabular-nums text-white/40">{q.time} </span>}
                {q.name}
              </span>
            </span>
          )
        })}
      </div>

      {(past || isToday) && d.scheduled.length > 0 && (
        <p className="mt-3 text-[10px] tracking-[0.15em] text-white/35 uppercase tabular-nums">
          {d.scheduledDone.length}/{d.scheduled.length} wykonane
        </p>
      )}
    </motion.button>
  )
}

function SelectedDay({ state, today, dayKeyValue, actions, onEdit }) {
  const s = dayStats(state, dayKeyValue)
  const done = new Set(state.history[dayKeyValue] ?? [])
  const past = dayKeyValue < today

  return (
    <Panel title={dayKeyValue === today ? 'Dziś' : formatDay(dayKeyValue, { weekday: 'long' })} subtitle={formatDay(dayKeyValue, { day: 'numeric', month: 'long' })} delay={0.12}>
      <AnimatePresence mode="wait">
        <motion.div
          key={dayKeyValue}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="space-y-5"
        >
          <ul className="space-y-1">
            {s.scheduled.map((q) => (
              <li key={q.id}>
                <motion.button
                  type="button"
                  onClick={() => {
                    sfx.tick()
                    onEdit(q)
                  }}
                  whileHover={{ x: 4 }}
                  className="flex w-full cursor-pointer items-center gap-3 px-2 py-2 text-left transition-colors hover:bg-white/[0.04]"
                >
                  <span className="w-11 shrink-0 text-right font-display text-xs tabular-nums text-white/45">{q.time ?? '—'}</span>
                  <MiniRune rune={q.rune} tier={q.tier} lit={done.has(q.id)} size="size-7" />
                  <span className={`min-w-0 flex-1 truncate text-sm ${past && !done.has(q.id) ? 'text-white/35 line-through' : 'text-stone-100'}`}>
                    {q.name}
                  </span>
                  <span className="shrink-0 text-[10px] tracking-[0.15em] text-white/35 uppercase">{q.date ? 'jednorazowo' : describeRepeat(q)}</span>
                </motion.button>
              </li>
            ))}
            {s.scheduled.length === 0 && <li className="px-2 font-lore text-base text-white/40 italic">Nic nie zaplanowano.</li>}
          </ul>

          {!past && (
            <QuickAdd date={dayKeyValue} isToday={dayKeyValue === today} onAdd={actions.saveQuest} onMore={onEdit} id="quick-plan" />
          )}
        </motion.div>
      </AnimatePresence>
    </Panel>
  )
}

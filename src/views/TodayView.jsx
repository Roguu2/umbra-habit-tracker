import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, Reorder, motion } from 'framer-motion'
import QuestCard from '../components/QuestCard'
import QuickAdd from '../components/QuickAdd'
import WeakSpotHint from '../components/WeakSpotHint'
import RaiseBar from '../components/RaiseBar'
import { MiniRune, Panel } from '../components/ui'
import { formatDay, partOfDay, shiftKey } from '../lib/game'
import { byTime, dayStats, perfectDayStreak, questStreaks, weekCount } from '../lib/stats'
import { sfx } from '../lib/sfx'
import { t } from '../lib/i18n'

const PARTS = [
  { id: 'morning', label: t('Rano', 'Morning') },
  { id: 'afternoon', label: t('Popołudnie', 'Afternoon') },
  { id: 'evening', label: t('Wieczór', 'Evening') },
  { id: 'any', label: t('W ciągu dnia', 'Anytime') },
]

function useClock() {
  const [now, setNow] = useState(() => new Date().toTimeString().slice(0, 5))
  useEffect(() => {
    const id = setInterval(() => setNow(new Date().toTimeString().slice(0, 5)), 30000)
    return () => clearInterval(id)
  }, [])
  return now
}

export default function TodayView({ game, onEdit, onOpenPlan, onOpenQuiz }) {
  const { state, today, actions } = game
  const now = useClock()
  const stats = dayStats(state, today)
  const doneToday = state.history[today] ?? []
  // nawyki "X razy w tygodniu" widać, dopóki cel tygodnia nie jest osiągnięty (albo gdy zrobione dziś)
  const flexible = stats.flexible.filter((q) => doneToday.includes(q.id) || weekCount(state, q, today) < q.perWeek)
  const items = [...stats.scheduled, ...flexible, ...stats.extra.filter((q) => !q.archivedAt)].sort(byTime)

  // "Następne": pierwsze niewykonane zadanie z godziną, które jeszcze nie minęło (z godzinnym zapasem)
  const hourAgo = `${String(Math.max(0, Number(now.slice(0, 2)) - 1)).padStart(2, '0')}${now.slice(2)}`
  const next = items.find((q) => q.time && q.time >= hourAgo && !doneToday.includes(q.id))

  const groups = PARTS.map((p) => ({ ...p, items: items.filter((q) => partOfDay(q.time) === p.id) })).filter((g) => g.items.length)

  const card = (q, reorder) => {
    const streak = q.date ? { current: 0 } : questStreaks(state, q, today)
    return (
      <QuestCard
        key={q.id}
        quest={q}
        done={doneToday.includes(q.id)}
        checkedSteps={state.steps[today]?.[q.id]}
        streak={streak.current}
        streakUnit={streak.unit}
        count={state.counts?.[today]?.[q.id] ?? 0}
        onAddCount={actions.addCount}
        weekDone={q.perWeek ? weekCount(state, q, today) : null}
        isNext={q === next}
        index={items.indexOf(q)}
        onToggle={actions.toggleQuest}
        onToggleStep={actions.toggleStep}
        onEdit={onEdit}
        reorder={reorder}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-12">
      <section aria-labelledby="today-heading" className="space-y-6">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-1 sm:pl-1">
          <h2 id="today-heading" className="font-display text-xl font-black tracking-[0.2em] text-stone-100 uppercase">
            {t('Plan na dziś', "Today's Plan")}
          </h2>
          <span className="mb-1.5 hidden h-px flex-1 bg-gradient-to-r from-blood/70 via-white/10 to-transparent sm:block" />
          <span className="mb-0.5 font-lore text-sm text-white/40 italic">{formatDay(today)}</span>
        </div>

        {stats.paused && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-gold/60 bg-gold/[0.05] px-4 py-3"
          >
            <p className="text-[13px] text-white/70">
              <span className="font-display font-bold tracking-[0.15em] text-gold-bright uppercase">{t('Tryb urlopu', 'Vacation mode')}</span>
              {' — '}
              {t('passa i serie są bezpieczne. Możesz odpocząć.', 'your streaks are safe. Take your rest.')}
            </p>
            <button
              type="button"
              onClick={() => {
                sfx.page()
                actions.setVacation(false)
              }}
              className="cursor-pointer text-[11px] tracking-[0.2em] text-gold/80 uppercase hover:text-gold-bright"
            >
              {t('Wracam', "I'm back")}
            </button>
          </motion.div>
        )}

        <QuickAdd date={today} isToday onAdd={actions.saveQuest} onMore={onEdit} id="quick-today" suggest={items.length === 0} />

        {groups.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10 text-center">
            <p className="font-display text-sm tracking-[0.3em] text-gold/70 uppercase">{t('Pusty dzień', 'Empty day')}</p>
            <p className="mx-auto mt-2 max-w-sm font-lore text-lg text-white/40 italic">
              {t('Wpisz powyżej, co chcesz dziś zrobić, albo wybierz jedną z podpowiedzi.', 'Write above what you want to do today, or pick one of the suggestions.')}
            </p>
            <motion.button
              type="button"
              onClick={() => {
                sfx.page()
                onOpenQuiz()
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className="hud-cut-sm mt-6 cursor-pointer bg-black/40 px-6 py-3 font-display text-[11px] font-bold tracking-[0.25em] text-gold-bright uppercase ring-1 ring-gold/40 hover:ring-gold-bright"
            >
              {t('Nie wiesz od czego zacząć? Dobierz nawyki', "Not sure where to start? Find habits for me")}
            </motion.button>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {groups.map((g) => (
            <motion.div key={g.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="mb-3 flex items-center gap-3 pl-1 text-[10px] font-bold tracking-[0.35em] text-white/40 uppercase">
                {g.label}
                <span className="h-px flex-1 bg-white/[0.06]" />
              </p>
              {g.id === 'any' && g.items.length > 1 ? (
                <ReorderableList items={g.items} onCommit={actions.reorderQuests}>
                  {(q, reorder) => card(q, reorder)}
                </ReorderableList>
              ) : (
                <ul className="space-y-3">
                  <AnimatePresence mode="popLayout">{g.items.map((q) => card(q))}</AnimatePresence>
                </ul>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      <aside className="space-y-8 lg:mt-12">
        <Streak state={state} today={today} />
        <Tomorrow state={state} today={today} onOpenPlan={onOpenPlan} />
        <RaiseBar state={state} today={today} onRaise={actions.raiseBar} />
        <WeakSpotHint state={state} today={today} onAdd={actions.saveQuest} panel />
      </aside>
    </div>
  )
}

// Lista zadań bez godziny, którą można układać przeciąganiem (za uchwyt) albo strzałkami.
function ReorderableList({ items, onCommit, children }) {
  const [draft, setDraft] = useState(null)
  const draftRef = useRef(null)
  const list = draft ?? items

  const update = (next) => {
    draftRef.current = next
    setDraft(next)
  }

  const reorder = {
    onDrop: () => {
      if (draftRef.current) {
        sfx.tick()
        onCommit(draftRef.current.map((q) => q.id))
      }
      draftRef.current = null
      setDraft(null)
    },
    onMove: (id, dir) => {
      const i = items.findIndex((q) => q.id === id)
      const j = i + dir
      if (j < 0 || j >= items.length) return
      const next = [...items]
      ;[next[i], next[j]] = [next[j], next[i]]
      sfx.tick()
      onCommit(next.map((q) => q.id))
    },
  }

  return (
    <Reorder.Group as="ul" axis="y" values={list} onReorder={update} className="space-y-3">
      <AnimatePresence>{list.map((q) => children(q, reorder))}</AnimatePresence>
    </Reorder.Group>
  )
}

function Streak({ state, today }) {
  const streak = perfectDayStreak(state, today)
  return (
    <Panel title={t('Passa', 'Streak')} subtitle={t('pełne dni z rzędu', 'full days in a row')} delay={0.15}>
      <div className="flex items-center gap-5">
        <motion.span
          key={streak}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-gilded font-display text-5xl font-black tabular-nums"
        >
          {streak}
        </motion.span>
        <p className="text-[13px] leading-snug text-white/50">
          {streak === 0
            ? t('Wykonaj dziś cały plan, aby rozpalić passę.', 'Complete the whole plan today to kindle a streak.')
            : t(`Nie przerywaj — każdy pełny dzień dokłada ogień do stosu.`, `Don't break it — every full day adds fire to the pyre.`)}
        </p>
      </div>
    </Panel>
  )
}

function Tomorrow({ state, today, onOpenPlan }) {
  const key = shiftKey(today, 1)
  const d = dayStats(state, key)

  return (
    <Panel title={t('Jutro', 'Tomorrow')} subtitle={formatDay(key, { weekday: 'long', day: 'numeric', month: 'short' })} delay={0.25}>
      {d.scheduled.length ? (
        <ul className="space-y-2">
          {d.scheduled.map((q) => (
            <li key={q.id} className="flex items-center gap-3">
              <span className="w-11 text-right font-display text-xs tabular-nums text-white/45">{q.time ?? '—'}</span>
              <MiniRune rune={q.rune} tier={q.tier} size="size-6" />
              <span className="truncate text-sm text-stone-200">{q.name}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-lore text-base text-white/40 italic">{t('Nic jeszcze nie zaplanowano.', 'Nothing planned yet.')}</p>
      )}
      <motion.button
        type="button"
        onClick={() => {
          sfx.page()
          onOpenPlan(key)
        }}
        whileHover={{ x: 4 }}
        className="mt-5 cursor-pointer text-[11px] tracking-[0.2em] text-gold/80 uppercase hover:text-gold-bright"
      >
        {t('Zaplanuj jutro →', 'Plan tomorrow →')}
      </motion.button>
    </Panel>
  )
}

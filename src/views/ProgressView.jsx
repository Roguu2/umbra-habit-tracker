import { useState } from 'react'
import { motion } from 'framer-motion'
import Heatmap from '../components/charts/Heatmap'
import DayDetail from '../components/DayDetail'
import { MiniRune, Panel, StatTile, pct } from '../components/ui'
import { ACHIEVEMENTS } from '../lib/achievements'
import { CATEGORIES, formatDay } from '../lib/game'
import { categoryCounts, completionRate, perfectDayStreak } from '../lib/stats'

export default function ProgressView({ game }) {
  const { state, today, life, achievementCtx, actions } = game
  const [selected, setSelected] = useState(today)
  const rate7 = completionRate(state, 7, today)
  const streak = perfectDayStreak(state, today)

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Skuteczność · 7 dni" value={pct(rate7)} hint="wykonane z zaplanowanych" delay={0.05} />
        <StatTile label="Passa" value={streak} hint="pełne dni z rzędu" delay={0.1} />
        <StatTile label="Pełne dni" value={life.perfectDays} hint="łącznie" delay={0.15} />
        <StatTile label="Wykonane zadania" value={life.seals} hint="łącznie" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title="Kalendarz" subtitle="kliknij dzień" accent="blood">
          <Heatmap state={state} today={today} selected={selected} onSelect={setSelected} />
        </Panel>
        <Panel title="Wybrany dzień" delay={0.2} className="lg:mt-10">
          <DayDetail state={state} today={today} dayKeyValue={selected} actions={actions} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <Categories state={state} />
        <Achievements state={state} ctx={achievementCtx} />
      </div>
    </div>
  )
}

// Kategorie rozpoznawane automatycznie z nazw zadań — bez żadnych ustawień.
function Categories({ state }) {
  const counts = categoryCounts(state)
  const rows = Object.entries(CATEGORIES)
    .map(([k, c]) => ({ k, label: c.label, n: counts[k] ?? 0 }))
    .sort((a, b) => b.n - a.n)
  const max = Math.max(1, ...rows.map((r) => r.n))

  return (
    <Panel title="Na co idzie twój wysiłek" delay={0.25}>
      <ul className="space-y-4">
        {rows.map((r, i) => (
          <li key={r.k}>
            <div className="flex items-baseline justify-between text-[11px]">
              <span className="font-display font-bold tracking-[0.2em] text-stone-200 uppercase">{r.label}</span>
              <span className="tabular-nums text-white/45">{r.n}×</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blood-deep to-blood-bright"
                initial={{ width: 0 }}
                animate={{ width: `${(r.n / max) * 100}%` }}
                transition={{ type: 'spring', stiffness: 60, damping: 16, delay: 0.35 + i * 0.06 }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-[11px] leading-relaxed text-white/30">Kategorie dobierają się same na podstawie nazw zadań.</p>
    </Panel>
  )
}

function Achievements({ state, ctx }) {
  const unlocked = ACHIEVEMENTS.filter((a) => state.achievements[a.id]).length
  return (
    <Panel title="Osiągnięcia" subtitle={`${unlocked} z ${ACHIEVEMENTS.length}`} delay={0.3} accent="blood" className="lg:mt-10">
      <ul className="grid gap-2 sm:grid-cols-2">
        {ACHIEVEMENTS.map((a, i) => {
          const at = state.achievements[a.id]
          const [value, goal] = a.progress(ctx)
          return (
            <motion.li
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.03 }}
              className={`flex items-center gap-3 p-2.5 ${at ? 'bg-gold/[0.06]' : 'bg-black/25'}`}
              style={{ boxShadow: `inset 0 0 0 1px ${at ? 'rgba(226,180,90,0.3)' : 'rgba(255,255,255,0.05)'}` }}
            >
              <MiniRune rune={a.rune} tier="gold" lit={!!at} size="size-9" />
              <div className="min-w-0 flex-1">
                <p className={`truncate font-display text-[12px] font-bold ${at ? 'text-gold-bright' : 'text-white/55'}`}>{a.name}</p>
                {at ? (
                  <p className="text-[10px] text-gold/60">{formatDay(at, { day: 'numeric', month: 'short' })}</p>
                ) : (
                  <p className="truncate text-[10px] text-white/35">
                    {a.desc} <span className="tabular-nums">({Math.min(value, goal)}/{goal})</span>
                  </p>
                )}
              </div>
            </motion.li>
          )
        })}
      </ul>
    </Panel>
  )
}

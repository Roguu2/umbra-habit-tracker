import { useState } from 'react'
import { motion } from 'framer-motion'
import Heatmap from '../components/charts/Heatmap'
import DayDetail from '../components/DayDetail'
import CharacterSheet from '../components/CharacterSheet'
import RewardPath from '../components/RewardPath'
import { MiniRune, Panel, StatTile, pct } from '../components/ui'
import { ACHIEVEMENTS } from '../lib/achievements'
import { formatDay } from '../lib/game'
import { auraFor } from '../lib/rewards'
import { completionRate, perfectDayStreak } from '../lib/stats'
import { t } from '../lib/i18n'

export default function ProgressView({ game }) {
  const { state, today, maxLevel, totalExp, life, achievementCtx, actions } = game
  const [selected, setSelected] = useState(today)
  const rate7 = completionRate(state, 7, today)
  const streak = perfectDayStreak(state, today)

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label={t('Skuteczność · 7 dni', 'Completion rate · 7 days')} value={pct(rate7)} hint={t('wykonane z zaplanowanych', 'done of planned')} delay={0.05} />
        <StatTile label={t('Passa', 'Streak')} value={streak} hint={t('pełne dni z rzędu', 'full days in a row')} delay={0.1} />
        <StatTile label={t('Pełne dni', 'Full days')} value={life.perfectDays} hint={t('łącznie', 'all time')} delay={0.15} />
        <StatTile label={t('Wypalone pieczęcie', 'Seals burned')} value={life.seals} hint={t('łącznie — nigdy nie przepadają', 'all time — never lost')} delay={0.2} />
      </div>

      <CharacterSheet state={state} today={today} onAdd={actions.saveQuest} />

      <RewardPath maxLevel={maxLevel} totalExp={totalExp} aura={auraFor(state.profile, maxLevel)} onWear={actions.setAura} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title={t('Kalendarz', 'Calendar')} subtitle={t('kliknij dzień', 'click a day')} accent="blood">
          <Heatmap state={state} today={today} selected={selected} onSelect={setSelected} />
        </Panel>
        <Panel title={t('Wybrany dzień', 'Selected day')} delay={0.2} className="lg:mt-10">
          <DayDetail state={state} today={today} dayKeyValue={selected} actions={actions} />
        </Panel>
      </div>

      <Achievements state={state} ctx={achievementCtx} />
    </div>
  )
}

function Achievements({ state, ctx }) {
  const unlocked = ACHIEVEMENTS.filter((a) => state.achievements[a.id]).length
  return (
    <Panel title={t('Osiągnięcia', 'Achievements')} subtitle={`${unlocked} ${t('z', 'of')} ${ACHIEVEMENTS.length}`} delay={0.3} accent="blood">
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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

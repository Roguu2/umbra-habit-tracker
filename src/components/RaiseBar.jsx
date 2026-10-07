import { useState } from 'react'
import { motion } from 'framer-motion'
import { MiniRune, Panel } from './ui'
import { describeRepeat } from '../lib/game'
import { barCandidate } from '../lib/progression'
import { questStreaks } from '../lib/stats'
import { sfx } from '../lib/sfx'
import { plural, t } from '../lib/i18n'

// Propozycja trudniejszej wersji nawyku, który trzyma się od ~2 tygodni.
export default function RaiseBar({ state, today, onRaise }) {
  const [done, setDone] = useState(null) // potwierdzenie po podniesieniu: nowa wersja nawyku
  const pick = barCandidate(
    state.quests.filter((q) => !q.archivedAt),
    today,
    (q) => questStreaks(state, q, today),
  )

  if (!pick && !done) return null

  const accept = () => {
    sfx.levelUp()
    onRaise(pick.quest.id, pick.up)
    setDone(pick.up.name ?? `${pick.quest.name} · ${describeRepeat({ ...pick.quest, perWeek: pick.up.perWeek })}`)
    setTimeout(() => setDone(null), 4000)
  }

  const decline = () => {
    sfx.tick()
    onRaise(pick.quest.id, null)
  }

  return (
    <Panel title={t('Podnieś poprzeczkę', 'Raise the bar')} subtitle={t('nawyk się trzyma', 'the habit is holding')} delay={0.2}>
      {done ? (
        <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="border-l-2 border-gold/60 pl-3 text-[13px] text-white/70">
          <span className="text-gold-bright">▲</span> {t('Poprzeczka w górę:', 'Bar raised:')} <b className="text-stone-100">{done}</b>
        </motion.p>
      ) : (
        <motion.div key={pick.quest.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="border-l-2 border-gold/60 pl-3">
          <p className="text-[12px] leading-relaxed text-white/55">
            🔥 <b className="text-stone-100">{pick.streak.current}</b>{' '}
            {pick.streak.unit === 'week'
              ? plural(pick.streak.current, ['tydzień', 'tygodnie', 'tygodni'], ['week', 'weeks'])
              : pick.quest.days.length === 7
                ? plural(pick.streak.current, ['dzień', 'dni', 'dni'], ['day', 'days'])
                : plural(pick.streak.current, ['raz', 'razy', 'razy'], ['time', 'times'])}{' '}
            {t('z rzędu. Ten nawyk już cię nie męczy — gotów na więcej?', 'in a row. This habit no longer strains you — ready for more?')}
          </p>

          <div className="mt-3 flex items-center gap-3">
            <MiniRune rune={pick.quest.rune} tier={pick.quest.tier} lit size="size-8" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate text-white/40 line-through">
                {pick.up.name ? pick.quest.name : `${pick.quest.name} · ${describeRepeat(pick.quest)}`}
              </p>
              <p className="truncate text-gold-bright">
                {pick.up.name ?? `${pick.quest.name} · ${describeRepeat({ ...pick.quest, perWeek: pick.up.perWeek })}`}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <button type="button" onClick={accept} className="cursor-pointer text-[11px] font-bold tracking-[0.2em] text-gold-bright uppercase hover:text-white">
              ▲ {t('Podnieś poprzeczkę', 'Raise the bar')}
            </button>
            <button type="button" onClick={decline} className="cursor-pointer text-[11px] tracking-[0.2em] text-white/35 uppercase hover:text-white/70">
              {t('Jeszcze nie', 'Not yet')}
            </button>
          </div>
        </motion.div>
      )}
    </Panel>
  )
}

import { useMemo } from 'react'
import Modal, { Button } from './Modal'
import { MiniRune, pct } from './ui'
import { CATEGORIES, DAY_SHORT, TIERS, WEEK_ORDER, completionExp, dayKey, describeRepeat, formatDay, shiftKey, weekStart } from '../lib/game'
import { plural, t } from '../lib/i18n'
import { isPaused, isScheduledOn, questStreaks, weekCount } from '../lib/stats'

const WEEKS = 12

// Szczegóły jednego nawyku: serie, skuteczność, historia z ostatnich tygodni.
export default function HabitDetail({ quest, state, today, onClose, onEdit }) {
  return (
    <Modal open={Boolean(quest)} title={t('Nawyk', 'Habit')} onClose={onClose}>
      {quest && <Body quest={quest} state={state} today={today} onEdit={onEdit} />}
    </Modal>
  )
}

function Body({ quest, state, today, onEdit }) {
  const c = TIERS[quest.tier]
  const streaks = questStreaks(state, quest, today)
  const weekUnit = streaks.unit === 'week'

  const stats = useMemo(() => {
    const done = (k) => (state.history[k] ?? []).includes(quest.id)
    let total = 0
    let exp = 0 // wersja minimalna daje połowę EXP, więc sumujemy każde wykonanie osobno
    for (const [key, ids] of Object.entries(state.history)) {
      if (!ids.includes(quest.id)) continue
      total++
      exp += completionExp(state, quest, key)
    }

    // skuteczność z 30 zakończonych dni (dla nawyków tygodniowych: z ostatnich 4 pełnych tygodni)
    let rate = null
    if (quest.perWeek) {
      const weeks = [1, 2, 3, 4].map((w) => shiftKey(dayKey(weekStart(new Date())), -7 * w + 6)).filter((end) => end >= quest.createdAt)
      if (weeks.length) rate = weeks.filter((end) => weekCount(state, quest, end) >= quest.perWeek).length / weeks.length
    } else {
      let req = 0
      let ok = 0
      for (let i = 1; i <= 30; i++) {
        const k = shiftKey(today, -i)
        if (k < quest.createdAt) break
        if (!isScheduledOn(quest, k) || isPaused(state, k)) continue
        req++
        if (done(k)) ok++
      }
      if (req) rate = ok / req
    }

    // siatka: tygodnie w kolumnach, dni w wierszach
    const start = weekStart(new Date())
    start.setDate(start.getDate() - (WEEKS - 1) * 7)
    const first = dayKey(start)
    const grid = Array.from({ length: WEEKS }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => {
        const key = shiftKey(first, w * 7 + d)
        return {
          key,
          done: done(key),
          required: isScheduledOn(quest, key) && !isPaused(state, key),
          out: key > today || key < quest.createdAt,
        }
      }),
    )
    return { total, exp, rate, grid }
  }, [quest, state, today])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <MiniRune rune={quest.rune} tier={quest.tier} lit size="size-12" />
        <div className="min-w-0">
          <p className="font-display text-lg font-bold break-words text-stone-100">{quest.name}</p>
          <p className="text-[11px] tracking-[0.15em] text-white/45 uppercase">
            {CATEGORIES[quest.attr]?.label} · {describeRepeat(quest)}
            {quest.time && ` · ${quest.time}`}
            {quest.kind === 'count' && ` · ${quest.target} ${quest.unit ?? ''}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label={t('Seria', 'Streak')} value={`🔥 ${streaks.current}`} hint={weekUnit ? plural(streaks.current, ['tydzień', 'tygodnie', 'tygodni'], ['week', 'weeks']) : t('obecnie', 'current')} />
        <Stat label={t('Najlepsza', 'Best')} value={streaks.best} hint={weekUnit ? t('tygodni', 'weeks') : t('z rzędu', 'in a row')} />
        <Stat label={t('Skuteczność', 'Success')} value={pct(stats.rate)} hint={quest.perWeek ? t('4 tygodnie', '4 weeks') : t('30 dni', '30 days')} />
        <Stat label={t('Wykonano', 'Done')} value={stats.total} hint={`${stats.exp} EXP`} />
      </div>

      <div>
        <p className="mb-2 text-[10px] tracking-[0.3em] text-white/40 uppercase">
          {t(`Ostatnie ${WEEKS} tygodni`, `Last ${WEEKS} weeks`)}
        </p>
        <div className="flex gap-2">
          <div className="grid grid-rows-7 gap-[3px] pt-px text-[9px] leading-[12px] text-white/30">
            {WEEK_ORDER.map((d, i) => (
              <span key={d}>{i % 2 === 0 ? DAY_SHORT[d] : ''}</span>
            ))}
          </div>
          <div className="flex flex-1 gap-[3px] overflow-x-auto">
            {stats.grid.map((week) => (
              <div key={week[0].key} className="grid grid-rows-7 gap-[3px]">
                {week.map((d) => (
                  <span
                    key={d.key}
                    title={`${formatDay(d.key, { day: 'numeric', month: 'short' })}: ${
                      d.done ? t('wykonane', 'done') : d.required ? t('pominięte', 'missed') : t('wolne', 'free')
                    }`}
                    className="size-3 rounded-[2px]"
                    style={{
                      background: d.out ? 'transparent' : d.done ? c.main : d.required ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.03)',
                      boxShadow: d.done ? `0 0 5px ${c.glow}` : d.key === today ? 'inset 0 0 0 1px rgba(255,255,255,0.5)' : undefined,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <p className="mt-2 flex flex-wrap gap-x-4 text-[10px] text-white/35">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[2px]" style={{ background: c.main }} /> {t('wykonane', 'done')}
          </span>
          {!quest.perWeek && (
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-[2px] bg-white/10" /> {t('zaplanowane, pominięte', 'planned, missed')}
            </span>
          )}
        </p>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => onEdit(quest)}>{t('Edytuj', 'Edit')}</Button>
      </div>
    </div>
  )
}

function Stat({ label, value, hint }) {
  return (
    <div className="bg-black/30 p-3 ring-1 ring-white/[0.06]">
      <p className="text-[9px] tracking-[0.25em] text-white/40 uppercase">{label}</p>
      <p className="mt-1 font-display text-xl font-bold tabular-nums text-stone-100">{value}</p>
      <p className="text-[10px] text-white/35">{hint}</p>
    </div>
  )
}

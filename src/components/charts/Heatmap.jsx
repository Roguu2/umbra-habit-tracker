import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { DAY_SHORT, dayKey, formatDay, parseKey, shiftKey, weekStart } from '../../lib/game'
import { dayStats } from '../../lib/stats'
import { sfx } from '../../lib/sfx'
import { locale, t } from '../../lib/i18n'

const WEEKS = 20

// sekwencyjna skala jednej barwy (krew) + osobny stan "dzień idealny" (złoto, z legendą)
export function cellStyle(stats, { future, beforeStart }) {
  if (beforeStart) return { background: 'transparent', border: '1px solid rgba(255,255,255,0.03)' }
  if (future)
    return {
      background: 'transparent',
      border: `1px dashed ${stats.scheduled.length ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)'}`,
    }
  if (stats.paused) return { background: 'transparent', border: '1px solid rgba(226,180,90,0.35)' }
  // dzień neutralny: bez planu; aktywność ponad plan widać, ale nie jako wynik dnia
  if (stats.ratio === null) return { background: stats.exp ? 'rgba(226,180,90,0.16)' : 'rgba(255,255,255,0.035)' }
  if (stats.perfect) return { background: '#e2b45a', boxShadow: '0 0 8px rgba(226,180,90,0.55)' }
  if (stats.ratio === 0) return { background: '#1d1416', border: '1px solid rgba(224,34,61,0.18)' }
  if (stats.ratio < 0.34) return { background: '#4a0b16' }
  if (stats.ratio < 0.67) return { background: '#85122a' }
  return { background: '#c9183a' }
}

export default function Heatmap({ state, today, selected, onSelect }) {
  const [hover, setHover] = useState(null)

  const weeks = useMemo(() => {
    const first = weekStart(new Date())
    first.setDate(first.getDate() - (WEEKS - 1) * 7)
    const startKey = dayKey(first)
    return Array.from({ length: WEEKS }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => {
        const key = shiftKey(startKey, w * 7 + d)
        return {
          key,
          stats: dayStats(state, key),
          future: key > today,
          beforeStart: key < state.profile.startedAt,
        }
      }),
    )
  }, [state, today])

  // etykieta miesiąca nad tygodniem, w którym zmienia się miesiąc (z odstępem, żeby się nie nakładały)
  const monthLabels = []
  let lastLabel = -3
  weeks.forEach((week, i) => {
    const m = parseKey(week[0].key).getMonth()
    const changed = i === 0 || m !== parseKey(weeks[i - 1][0].key).getMonth()
    const nextChange = weeks.findIndex((w, j) => j > i && parseKey(w[0].key).getMonth() !== m)
    const roomy = i > 0 || nextChange === -1 || nextChange - i >= 3
    if (changed && roomy && i - lastLabel >= 3) {
      monthLabels[i] = parseKey(week[0].key).toLocaleDateString(locale(), { month: 'short' })
      lastLabel = i
    } else monthLabels[i] = ''
  })

  return (
    <div>
      <div className="relative flex gap-2">
        <div className="grid shrink-0 grid-rows-[14px_repeat(7,minmax(0,1fr))] gap-[3px] pt-px text-[9px] tracking-widest text-white/30 uppercase">
          <span />
          {[1, 2, 3, 4, 5, 6, 0].map((d, i) => (
            <span key={d} className="flex items-center leading-none">
              {i % 2 === 0 ? DAY_SHORT[d] : ''}
            </span>
          ))}
        </div>

        <div className="grid min-w-0 flex-1 items-start gap-[3px]" style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}>
          {weeks.map((week, w) => (
            <div key={week[0].key} className="flex flex-col gap-[3px]">
              <span className="h-[14px] overflow-visible whitespace-nowrap text-[9px] leading-[14px] tracking-widest text-white/30 uppercase">
                {monthLabels[w]}
              </span>
              {week.map((cell, d) => {
                const isSel = cell.key === selected
                const isToday = cell.key === today
                return (
                  <motion.button
                    key={cell.key}
                    type="button"
                    disabled={cell.beforeStart}
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 + w * 0.025 + d * 0.01, type: 'spring', stiffness: 260, damping: 20 }}
                    whileHover={cell.beforeStart ? undefined : { scale: 1.3, zIndex: 2 }}
                    onMouseEnter={() => setHover({ ...cell, w, d })}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover({ ...cell, w, d })}
                    onBlur={() => setHover(null)}
                    onClick={() => {
                      sfx.tick()
                      onSelect(cell.key)
                    }}
                    aria-label={`${formatDay(cell.key)}: ${describe(cell)}`}
                    aria-pressed={isSel}
                    className="relative block aspect-square w-full cursor-pointer rounded-[2px] p-0 outline-none disabled:cursor-default"
                    style={{
                      ...cellStyle(cell.stats, cell),
                      outline: isSel ? '1.5px solid #ffe3a0' : isToday ? '1px solid rgba(255,90,110,0.9)' : undefined,
                      outlineOffset: 1,
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {hover && !hover.beforeStart && (
          <div
            className="pointer-events-none absolute z-10 w-48 border border-white/15 bg-[#0d0b0e]/95 px-3 py-2 shadow-xl backdrop-blur"
            style={{
              left: `clamp(0px, calc(28px + (100% - 28px) * ${(hover.w + 0.5) / WEEKS} - 96px), calc(100% - 192px))`,
              top: `calc(14px + (100% - 14px) * ${(hover.d + 1) / 7} + 8px)`,
            }}
          >
            <p className="font-display text-[11px] font-bold text-stone-100">{formatDay(hover.key)}</p>
            <p className="mt-0.5 text-[11px] text-white/55">{describe(hover)}</p>
          </div>
        )}
      </div>

      <Legend />
    </div>
  )
}

function describe({ stats, future }) {
  if (future) return stats.scheduled.length ? t(`zaplanowano ${stats.scheduled.length} (${stats.plannedExp} EXP)`, `${stats.scheduled.length} planned (${stats.plannedExp} EXP)`) : t('nic nie zaplanowano', 'nothing planned')
  if (stats.paused) return stats.shielded ? t('tarcza passy', 'streak shield') : t('urlop', 'vacation')
  if (stats.ratio === null) {
    const extra = stats.extra.length + stats.flexDone.length
    return extra ? t(`wolne · ponad plan: ${extra} · ${stats.exp} EXP`, `rest day · extra: ${extra} · ${stats.exp} EXP`) : t('wolne', 'rest day')
  }
  const base = `${stats.scheduledDone.length}/${stats.scheduled.length} ${t('wykonane', 'done')} · ${stats.exp} EXP`
  return stats.perfect ? `${base} · ${t('pełny dzień', 'full day')}` : base
}

function Legend() {
  const steps = ['#1d1416', '#4a0b16', '#85122a', '#c9183a']
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] tracking-[0.15em] text-white/40 uppercase">
      <span className="flex items-center gap-1.5">
        {t('mniej', 'less')}
        {steps.map((c) => (
          <span key={c} className="size-2.5 rounded-[2px]" style={{ background: c }} />
        ))}
        {t('więcej', 'more')}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-[2px] bg-[#e2b45a] shadow-[0_0_6px_rgba(226,180,90,0.6)]" />
        {t('pełny dzień', 'full day')}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-[2px] bg-white/[0.035]" />
        {t('wolne', 'rest day')}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-[2px] border border-dashed border-white/20" />
        {t('w planie', 'planned')}
      </span>
    </div>
  )
}

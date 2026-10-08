import { useMemo } from 'react'
import { MiniRune, Panel } from './ui'
import { BOSSES, defeatedBosses } from '../lib/bosses'
import { formatDay } from '../lib/game'
import { t } from '../lib/i18n'

// Bestiariusz: strażnicy tygodnia pokonani do tej pory (z historii) i zdobyte relikty; niepokonani są zakryci.
export default function Bestiary({ state, today }) {
  const defeated = useMemo(() => defeatedBosses(state, today), [state, today])
  const known = new Set(defeated.map((w) => w.boss.id))

  return (
    <Panel
      title={t('Pokonani strażnicy', 'Defeated wardens')}
      subtitle={t(`${known.size} z ${BOSSES.length}`, `${known.size} of ${BOSSES.length}`)}
      delay={0.35}
    >
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {BOSSES.map((boss) => {
          const wins = defeated.filter((w) => w.boss.id === boss.id)
          const won = wins.length > 0
          return (
            <li key={boss.id} className={`flex items-center gap-3 p-3 ring-1 ${won ? 'bg-gold/[0.04] ring-gold/25' : 'bg-black/20 ring-white/[0.05]'}`}>
              <MiniRune rune={boss.rune} tier="gold" lit={won} size="size-9" />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm ${won ? 'text-stone-100' : 'text-white/30'}`}>{won ? boss.name : '???'}</p>
                <p className="truncate text-[11px] text-white/40">
                  {won
                    ? `${boss.relic} · ${formatDay(wins[0].defeatedOn, { day: 'numeric', month: 'short' })}`
                    : t('jeszcze nie pokonany', 'not defeated yet')}
                </p>
              </div>
              {wins.length > 1 && <span className="shrink-0 text-xs tabular-nums text-gold-bright">×{wins.length}</span>}
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

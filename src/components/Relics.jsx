import { useMemo } from 'react'
import { MiniRune, Panel } from './ui'
import { RARITY, RELICS, relicCollection } from '../lib/relics'
import { formatDay } from '../lib/game'
import { t } from '../lib/i18n'

const TIER = { common: 'blood', rare: 'gold', legendary: 'gold' }

// Kolekcja znalezisk (lib/relics.js), wyliczona z historii; niezdobyte relikty są zakryte.
export default function Relics({ state }) {
  const collection = useMemo(() => relicCollection(state), [state])

  return (
    <Panel
      title={t('Znaleziska', 'Finds')}
      subtitle={t(`${collection.size} z ${RELICS.length} reliktów`, `${collection.size} of ${RELICS.length} relics`)}
      delay={0.35}
    >
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {RELICS.map((relic) => {
          const found = collection.get(relic.id)
          return (
            <li
              key={relic.id}
              className={`flex items-center gap-3 p-3 ring-1 ${
                found ? (relic.rarity === 'legendary' ? 'bg-gold/[0.07] ring-gold/50' : 'bg-white/[0.03] ring-white/10') : 'bg-black/20 ring-white/[0.05]'
              }`}
            >
              <MiniRune rune={relic.rune} tier={TIER[relic.rarity]} lit={Boolean(found)} size="size-9" />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm ${found ? 'text-stone-100' : 'text-white/30'}`}>{found ? relic.name : '???'}</p>
                <p className="truncate text-[11px] text-white/40">
                  {RARITY[relic.rarity].label}
                  {found && ` · ${formatDay(found.first, { day: 'numeric', month: 'short' })} · ${relic.desc}`}
                </p>
              </div>
              {found?.count > 1 && <span className="shrink-0 text-xs tabular-nums text-gold-bright">×{found.count}</span>}
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

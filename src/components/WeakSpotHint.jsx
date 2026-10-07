import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { MiniRune, Panel } from './ui'
import { attributeStats, weakSpot } from '../lib/attributes'
import { CATEGORIES, describeRepeat } from '../lib/game'
import { suggestForAttr, toQuestDrafts } from '../lib/recommend'
import { sfx } from '../lib/sfx'
import { t } from '../lib/i18n'

// Podpowiedź przy słabym atrybucie: co kuleje (albo czego brak) i gotowy nawyk do dodania jednym kliknięciem.
// "Nie teraz" ukrywa ją do końca dnia (tylko na tym urządzeniu).

const DISMISS_KEY = 'umbra-habit-tracker:tip-dismissed'

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY)
  } catch {
    return null
  }
}

export default function WeakSpotHint({ state, today, attrs, onAdd, panel = false }) {
  const stats = useMemo(() => attrs ?? attributeStats(state, today), [attrs, state, today])
  const weak = weakSpot(stats)
  const [index, setIndex] = useState(0)
  const [added, setAdded] = useState(null)
  const [dismissed, setDismissed] = useState(readDismissed)

  const names = state.quests.filter((q) => !q.archivedAt).map((q) => q.name)
  const options = weak ? suggestForAttr(weak.attr.k, names) : []
  const habit = options.length ? options[index % options.length] : null
  const draft = habit && toQuestDrafts([habit], { level: 'new' })[0]
  const hidden = !weak || dismissed === `${today}:${weak.attr.k}`

  if (hidden && !added) return null

  const add = () => {
    sfx.forge()
    onAdd(draft)
    setAdded(habit.name)
    setIndex(0)
    setTimeout(() => setAdded(null), 4000)
  }

  const dismiss = () => {
    sfx.tick()
    const value = `${today}:${weak.attr.k}`
    try {
      localStorage.setItem(DISMISS_KEY, value)
    } catch {
      // brak dostępu do storage — ukrywamy tylko do odświeżenia
    }
    setDismissed(value)
  }

  const body = (
    // bez animacji wyjścia — nowa treść (np. potwierdzenie dodania) ma się pokazać od razu
    <>
      {added ? (
        <motion.p
          key="added"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-l-2 border-gold/60 pl-3 text-[13px] text-white/70"
        >
          <span className="text-gold-bright">✓</span> {t('Dodano do planu:', 'Added to your plan:')} <b className="text-stone-100">{added}</b>
        </motion.p>
      ) : (
        <motion.div key={`${weak.attr.k}-${habit?.id}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="border-l-2 border-blood/60 pl-3">
          <p className="text-[12px] leading-relaxed text-white/55">
            {weak.type === 'lagging' ? (
              <>
                <b className="text-blood-bright">{weak.attr.label}</b>{' '}
                {t('słabnie — w ostatnich 14 dniach wykonano', 'is waning — in the last 14 days you completed')} {weak.attr.recent.done} {t('z', 'of')}{' '}
                {weak.attr.recent.planned} {t('zaplanowanych zadań.', weak.attr.recent.planned === 1 ? 'planned quest.' : 'planned quests.')}{' '}
                {habit && t('Może pomoże mniejszy krok:', 'A smaller step might help:')}
              </>
            ) : (
              <>
                {/* "atrybut" przed nazwą — odmiana pasuje do każdej nazwy (Siła, Umysł, Zdrowie…) */}
                {t('Atrybut', 'The')} <b className="text-white/80">{weak.attr.label}</b>{' '}
                {t('pozostaje nieodkryty.', 'attribute remains undiscovered.')} {habit && t('Na początek spróbuj:', 'To begin, try:')}
              </>
            )}
          </p>

          {habit && (
            <div className="mt-3 flex items-center gap-3">
              <MiniRune rune={CATEGORIES[weak.attr.k].rune} tier={CATEGORIES[weak.attr.k].tier} lit size="size-8" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-stone-100">{habit.name}</p>
                <p className="text-[10px] tracking-[0.12em] text-white/40 uppercase">
                  {draft.time && `${draft.time} · `}
                  {describeRepeat(draft)}
                  {draft.kind === 'count' && ` · ${draft.target} ${draft.unit}`}
                  {' · '}
                  <span className="text-gold/80">+{CATEGORIES[weak.attr.k].exp} EXP</span>
                </p>
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {habit && (
              <button type="button" onClick={add} className="cursor-pointer text-[11px] font-bold tracking-[0.2em] text-gold-bright uppercase hover:text-white">
                + {t('Dodaj do planu', 'Add to plan')}
              </button>
            )}
            {options.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  sfx.page()
                  setIndex((i) => i + 1)
                }}
                className="cursor-pointer text-[11px] tracking-[0.2em] text-white/45 uppercase hover:text-white"
              >
                ↻ {t('Inny', 'Another')}
              </button>
            )}
            <button type="button" onClick={dismiss} className="cursor-pointer text-[11px] tracking-[0.2em] text-white/30 uppercase hover:text-white/70">
              {t('Nie teraz', 'Not now')}
            </button>
          </div>
        </motion.div>
      )}
    </>
  )

  if (!panel) return body
  return (
    <Panel title={t('Podpowiedź', 'Tip')} subtitle={t('słaby punkt postaci', "your character's weak spot")} delay={0.2}>
      {body}
    </Panel>
  )
}

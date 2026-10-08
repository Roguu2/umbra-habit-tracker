import { useState } from 'react'
import { MiniRune, Panel } from './ui'
import { COMMISSION_BONUS, commissionsFor } from '../lib/commission'
import { CATEGORIES, autoProps, describeRepeat, expFor } from '../lib/game'
import { toQuestDrafts } from '../lib/recommend'
import { isPaused } from '../lib/stats'
import { sfx } from '../lib/sfx'
import { t } from '../lib/i18n'

// "↻ Inne" (raz dziennie) i "Nie teraz" — wygoda tylko tego urządzenia, jak "Nie teraz" w podpowiedziach
const PREFS_KEY = 'umbra-habit-tracker:commission'

function readPrefs(today) {
  try {
    const prefs = JSON.parse(localStorage.getItem(PREFS_KEY))
    if (prefs?.day === today) return prefs
  } catch {
    // brak dostępu do storage
  }
  return { day: today, skip: 0, dismissed: false }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // brak dostępu do storage — ustawienie działa do przeładowania
  }
}

const bonusLabel = `+${Math.round(COMMISSION_BONUS * 100)}%`

// Zlecenie dnia (lib/commission.js): jeden łatwy nawyk spoza planu; wykonany w dniu przyjęcia daje bonus EXP.
export default function CommissionCard({ state, today, onAdd }) {
  const [prefs, setPrefs] = useState(() => readPrefs(today))
  const current = prefs.day === today ? prefs : readPrefs(today)
  const update = (next) => {
    const value = { ...current, ...next }
    savePrefs(value)
    setPrefs(value)
  }

  if (isPaused(state, today)) return null

  // przyjęte dziś zlecenie: pokazujemy postęp zamiast nowej propozycji
  const accepted = state.quests.find((q) => q.commission === today && !q.archivedAt)
  if (accepted) {
    const done = (state.history[today] ?? []).includes(accepted.id)
    return (
      <Panel title={t('Zlecenie dnia', 'Daily commission')} subtitle={done ? t('wykonane', 'done') : t('przyjęte', 'accepted')} delay={0.2}>
        <p className="text-[13px] text-white/60">
          <b className="text-stone-100">{accepted.name}</b> —{' '}
          {done
            ? t(`wykonane z bonusem ${bonusLabel} EXP.`, `completed with a ${bonusLabel} EXP bonus.`)
            : t(`wykonaj dziś, a dostaniesz ${bonusLabel} EXP.`, `complete it today for ${bonusLabel} EXP.`)}
        </p>
      </Panel>
    )
  }

  if (current.dismissed) return null
  const candidates = commissionsFor(
    today,
    state.quests.filter((q) => !q.archivedAt).map((q) => q.name),
  )
  const habit = candidates[current.skip] ?? candidates[0]
  if (!habit) return null

  const draft = toQuestDrafts([habit], { level: 'new' })[0]
  const props = autoProps(habit.name)
  const category = CATEGORIES[props.attr]
  const exp = expFor({ ...props, commission: today }, today)

  return (
    <Panel title={t('Zlecenie dnia', 'Daily commission')} subtitle={t(`${bonusLabel} EXP, jeśli wykonasz dziś`, `${bonusLabel} EXP if done today`)} delay={0.2}>
      <div className="flex items-center gap-3">
        <MiniRune rune={category.rune} tier={category.tier} lit size="size-8" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-stone-100">{habit.name}</p>
          <p className="text-[10px] tracking-[0.12em] text-white/40 uppercase">
            {draft.time && `${draft.time} · `}
            {describeRepeat(draft)} · <span className="text-gold/80">+{exp} EXP {t('dziś', 'today')}</span>
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={() => {
            sfx.forge()
            onAdd({ ...draft, commission: today })
          }}
          className="cursor-pointer text-[11px] font-bold tracking-[0.2em] text-gold-bright uppercase hover:text-white"
        >
          + {t('Dodaj do planu', 'Add to plan')}
        </button>
        {current.skip === 0 && candidates.length > 1 && (
          <button
            type="button"
            onClick={() => {
              sfx.page()
              update({ skip: 1 })
            }}
            className="cursor-pointer text-[11px] tracking-[0.2em] text-white/45 uppercase hover:text-white"
          >
            ↻ {t('Inne', 'Another')}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            sfx.tick()
            update({ dismissed: true })
          }}
          className="cursor-pointer text-[11px] tracking-[0.2em] text-white/30 uppercase hover:text-white/70"
        >
          {t('Nie teraz', 'Not now')}
        </button>
      </div>
    </Panel>
  )
}

import { MiniRune, Panel } from './ui'
import { CATEGORIES } from '../lib/game'
import { prophecyFor } from '../lib/prophecy'
import { t } from '../lib/i18n'

// Przepowiednia dnia (lib/prophecy.js): tekst i kategoria z bonusem EXP, wyliczone z daty.
export default function Prophecy({ today }) {
  const omen = prophecyFor(today)
  if (!omen) return null
  const category = CATEGORIES[omen.attr]

  return (
    <Panel title={t('Przepowiednia dnia', 'Omen of the day')} delay={0.1}>
      <p className="font-lore text-[17px] leading-snug text-white/65 italic">„{omen.text}”</p>
      <p className="mt-3 flex items-center gap-2 text-[12px] text-white/55">
        <MiniRune rune={category.rune} tier={category.tier} lit size="size-6" />
        <span>
          {t('Dziś', 'Today')} <b className="text-stone-100">{category.label}</b> {t('daje', 'gives')}{' '}
          <span className="text-gold-bright">+{Math.round(omen.bonus * 100)}% EXP</span>
        </span>
      </p>
    </Panel>
  )
}

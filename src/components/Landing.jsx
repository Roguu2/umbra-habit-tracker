import { motion } from 'framer-motion'
import { MiniRune } from './ui'
import { lang, setLang, t } from '../lib/i18n'
import { sfx } from '../lib/sfx'

const OUT = [0.16, 1, 0.3, 1]

const FEATURES = [
  {
    rune: 0,
    tier: 'blood',
    title: t('Wypalaj pieczęcie', 'Burn the seals'),
    text: t(
      'Każdy wykonany nawyk to pieczęć, EXP i krok do kolejnego poziomu. Trening, czytanie, woda — wszystko się liczy.',
      'Every habit you complete burns a seal, earns EXP and brings you closer to the next level. Workouts, reading, water — it all counts.',
    ),
  },
  {
    rune: 2,
    tier: 'gold',
    title: t('Odkryj swoją klasę', 'Discover your class'),
    text: t(
      'Siła, kondycja, umysł, zdrowie. Twoje nawyki kształtują postać — Berserker, Mnich Popiołu, Alchemik…',
      'Strength, endurance, mind, vitality. Your habits shape your character — Berserker, Ash Monk, Alchemist…',
    ),
  },
  {
    rune: 4,
    tier: 'blood',
    title: t('Nie przerywaj passy', 'Keep the streak alive'),
    text: t(
      'Kalendarz, serie, osiągnięcia i przypomnienia, które przyjdą nawet przy zamkniętej aplikacji.',
      'Calendar, streaks, achievements and reminders that arrive even when the app is closed.',
    ),
  },
  {
    rune: 7,
    tier: 'gold',
    title: t('Telefon i komputer', 'Phone and computer'),
    text: t(
      'Zainstaluj jak aplikację i połącz urządzenia kodem QR. Bez konta, bez reklam, bez śledzenia.',
      'Install it like an app and link your devices with a QR code. No account, no ads, no tracking.',
    ),
  },
]

export default function Landing({ onStart, onHaveCode, onLegal }) {
  return (
    <motion.div
      className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-8 sm:px-8"
      exit={{ opacity: 0, y: -20, filter: 'blur(6px)' }}
      transition={{ duration: 0.4 }}
    >
      <header className="flex items-center justify-between">
        <span className="flex items-center gap-2.5">
          <img src="/icons/icon.svg" alt="" className="size-8" />
          <span className="font-display text-sm font-bold tracking-[0.35em] text-stone-200 uppercase">Umbra</span>
        </span>
        <button
          type="button"
          onClick={() => setLang(lang() === 'pl' ? 'en' : 'pl')}
          className="cursor-pointer text-[11px] tracking-[0.25em] text-white/45 uppercase hover:text-gold-bright"
        >
          {lang() === 'pl' ? 'English' : 'Polski'}
        </button>
      </header>

      <main className="flex flex-1 flex-col justify-center py-16">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: OUT }}
          className="text-[11px] tracking-[0.4em] text-blood-bright uppercase"
        >
          {t('Księga Nawyków', 'The Book of Habits')}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: OUT }}
          className="text-gilded mt-4 max-w-3xl font-display text-4xl leading-tight font-black sm:text-6xl"
        >
          {t('Zamień nawyki w przygodę.', 'Turn your habits into a quest.')}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease: OUT }}
          className="mt-6 max-w-xl font-lore text-xl text-white/60 italic sm:text-2xl"
        >
          {t(
            'Mroczny tracker nawyków w duchu RPG. Planuj dzień, wypalaj pieczęcie i patrz, jak twoja postać rośnie w siłę.',
            'A dark-fantasy habit tracker. Plan your day, burn the seals and watch your character grow in power.',
          )}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: OUT }}
          className="mt-10 flex flex-wrap items-center gap-5"
        >
          <motion.button
            type="button"
            onClick={() => {
              sfx.forge()
              onStart()
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="hud-cut-sm cursor-pointer bg-gradient-to-r from-blood-deep via-blood to-blood-deep px-9 py-4 font-display text-xs font-bold tracking-[0.3em] text-stone-100 uppercase shadow-[0_0_32px_rgba(195,20,47,0.45)]"
          >
            {t('Rozpocznij wędrówkę', 'Begin your journey')}
          </motion.button>
          <button
            type="button"
            onClick={() => {
              sfx.page()
              onHaveCode()
            }}
            className="cursor-pointer text-[11px] tracking-[0.25em] text-white/50 uppercase hover:text-gold-bright"
          >
            {t('Mam już kod z innego urządzenia', 'I already have a code')}
          </button>
        </motion.div>
        <p className="mt-4 text-[11px] text-white/35">{t('Za darmo. Bez konta. Działa od razu.', 'Free. No account. Works instantly.')}</p>

        <ul className="mt-16 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <motion.li
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55 + i * 0.08, ease: OUT }}
              className="relative"
            >
              <div className="hud-cut-sm absolute inset-0 bg-gradient-to-br from-white/12 to-white/[0.02]" />
              <div className="hud-cut-sm absolute inset-px bg-[#0a090c]/85 backdrop-blur-xl" />
              <div className="relative flex gap-4 p-5">
                <MiniRune rune={f.rune} tier={f.tier} lit size="size-10" />
                <div>
                  <h2 className="font-display text-sm font-bold tracking-[0.15em] text-stone-100 uppercase">{f.title}</h2>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{f.text}</p>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      </main>

      <footer className="flex justify-center pb-16 sm:pb-4">
        <button type="button" onClick={onLegal} className="cursor-pointer text-[10px] tracking-[0.3em] text-white/30 uppercase hover:text-white/60">
          {t('Prywatność i regulamin', 'Privacy & terms')}
        </button>
      </footer>
    </motion.div>
  )
}

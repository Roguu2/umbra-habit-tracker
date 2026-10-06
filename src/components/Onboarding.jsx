import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import RuneSeal from './RuneSeal'
import { DAY_SHORT, WEEK_ORDER } from '../lib/game'
import { sfx } from '../lib/sfx'

const STEPS = [
  {
    title: 'Witaj w Umbrze',
    text: 'Planuj dzień i buduj nawyki. Każde wykonane zadanie daje EXP, a twoja postać zdobywa kolejne poziomy.',
    Demo: LevelDemo,
  },
  {
    title: 'Wpisz, co chcesz zrobić',
    text: 'W zakładce Dziś wpisz zadanie i naciśnij Enter. Godzinę możesz dodać, ale nie musisz.',
    Demo: TypingDemo,
  },
  {
    title: 'Odhacz runę',
    text: 'Gdy wykonasz zadanie, kliknij runę obok niego. Kategoria i nagroda dobierają się same z nazwy.',
    Demo: SealDemo,
  },
  {
    title: 'Zaplanuj tydzień',
    text: 'Zadanie może być jednorazowe, codzienne albo na wybrane dni. Do treningu dodaj kroki, np. listę ćwiczeń.',
    Demo: WeekDemo,
  },
  {
    title: 'Jak masz na imię?',
    text: 'Postępy, kalendarz i osiągnięcia znajdziesz w zakładce Postępy. Ten poradnik otworzysz ponownie na dole strony.',
    Demo: null,
  },
]

export default function Onboarding({ open, defaultName, onFinish }) {
  return <AnimatePresence>{open && <Tour defaultName={defaultName} onFinish={onFinish} />}</AnimatePresence>
}

function Tour({ defaultName, onFinish }) {
  const [[step, dir], setStep] = useState([0, 1])
  const [name, setName] = useState(defaultName === 'Wędrowiec' ? '' : defaultName)
  const last = step === STEPS.length - 1
  const { title, text, Demo } = STEPS[step]

  const go = (delta) => {
    const next = step + delta
    if (next < 0 || next >= STEPS.length) return
    sfx.page()
    setStep([next, delta])
  }

  const finish = () => {
    sfx.forge()
    onFinish(name.trim())
  }

  // klawiatura: strzałki przełączają kroki, Esc pomija poradnik
  const keyHandler = useRef()
  keyHandler.current = (e) => {
    if (e.target.tagName === 'INPUT') return
    if (e.key === 'ArrowRight') go(1)
    if (e.key === 'ArrowLeft') go(-1)
    if (e.key === 'Escape') onFinish('')
  }
  useEffect(() => {
    const h = (e) => keyHandler.current(e)
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-[70] grid place-items-end overflow-y-auto sm:place-items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        initial={{ opacity: 0, y: 50, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
        className="relative w-full max-w-md"
      >
        <div className="hud-cut absolute inset-0 bg-gradient-to-b from-gold/50 via-white/[0.06] to-blood/50" />
        <div className="hud-cut absolute inset-px bg-[#0b0a0d]/95 backdrop-blur-2xl" />

        <div className="relative p-6 sm:p-7">
          {/* postęp */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5" aria-label={`Krok ${step + 1} z ${STEPS.length}`}>
              {STEPS.map((_, i) => (
                <motion.span
                  key={i}
                  className="h-1 rounded-full"
                  animate={{ width: i === step ? 28 : 10, backgroundColor: i <= step ? '#ff4259' : 'rgba(255,255,255,0.15)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              ))}
            </div>
            {!last && (
              <button
                type="button"
                onClick={() => onFinish('')}
                className="cursor-pointer text-[11px] tracking-[0.2em] text-white/40 uppercase hover:text-white"
              >
                Pomiń
              </button>
            )}
          </div>

          {/* treść kroku */}
          <div className="relative mt-6 min-h-[340px] overflow-hidden">
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.div
                key={step}
                custom={dir}
                initial={{ opacity: 0, x: dir * 40, filter: 'blur(6px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: dir * -40, filter: 'blur(6px)' }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="grid h-44 place-items-center bg-black/30 ring-1 ring-white/[0.06]">
                  {Demo ? (
                    <Demo />
                  ) : (
                    <NameField value={name} onChange={setName} onSubmit={finish} />
                  )}
                </div>
                <p className="mt-6 text-[10px] tracking-[0.35em] text-gold/70 uppercase">
                  Krok {step + 1} / {STEPS.length}
                </p>
                <h2 id="tour-title" className="mt-2 font-display text-2xl font-black text-stone-100">
                  {title}
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-white/60">{text}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* nawigacja */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={step === 0}
              className="cursor-pointer px-2 py-2 text-[11px] tracking-[0.2em] text-white/50 uppercase hover:text-white disabled:invisible"
            >
              ← Wstecz
            </button>
            <motion.button
              type="button"
              onClick={last ? finish : () => go(1)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className="hud-cut-sm cursor-pointer bg-gradient-to-r from-blood-deep via-blood to-blood-deep px-8 py-3 font-display text-xs font-bold tracking-[0.3em] text-stone-100 uppercase shadow-[0_0_24px_rgba(195,20,47,0.35)]"
            >
              {last ? 'Zaczynamy' : 'Dalej'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function NameField({ value, onChange, onSubmit }) {
  return (
    <div className="w-full max-w-xs px-6 text-center">
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        maxLength={28}
        placeholder="Wędrowiec"
        aria-label="Imię postaci"
        className="w-full border-b border-white/20 bg-transparent pb-2 text-center font-display text-2xl text-stone-100 outline-none placeholder:text-white/25 focus:border-gold"
      />
      <p className="mt-3 text-[11px] text-white/35">Możesz to zmienić później, klikając imię u góry.</p>
    </div>
  )
}

// --- animowane podglądy ---------------------------------------------------

// pętla: co `ms` przełącza licznik kroków animacji
function useLoop(count, ms) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % count), ms)
    return () => clearInterval(id)
  }, [count, ms])
  return i
}

function LevelDemo() {
  const phase = useLoop(2, 2200)
  return (
    <div className="flex w-full max-w-[260px] items-center gap-5">
      <div className="relative grid size-20 shrink-0 place-items-center">
        <motion.svg viewBox="0 0 100 100" className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
          <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(201,162,74,0.5)" strokeWidth="1" strokeDasharray="1 3" />
          <path d="M50 8 86.4 71H13.6Z" fill="none" stroke="rgba(224,34,61,0.45)" strokeWidth="1" />
        </motion.svg>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={phase}
            initial={{ y: 14, opacity: 0, scale: 1.6 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -14, opacity: 0 }}
            className="text-gilded font-display text-3xl font-black"
          >
            {phase + 1}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="flex-1">
        <p className="text-[10px] tracking-[0.3em] text-white/40 uppercase">Doświadczenie</p>
        <div className="mt-2 h-2.5 overflow-hidden bg-black/60 ring-1 ring-white/10">
          <motion.div
            key={phase}
            className="h-full bg-gradient-to-r from-blood-deep via-blood to-gold"
            initial={{ width: '5%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.8, ease: [0.7, 0, 0.3, 1] }}
          />
        </div>
      </div>
    </div>
  )
}

function TypingDemo() {
  const full = 'Trening nóg'
  const [typed, setTyped] = useState('')
  const [added, setAdded] = useState(false)

  useEffect(() => {
    let i = 0
    let timer
    const tick = () => {
      if (i <= full.length) {
        setTyped(full.slice(0, i++))
        timer = setTimeout(tick, 110)
      } else {
        setAdded(true)
        timer = setTimeout(() => {
          setAdded(false)
          setTyped('')
          i = 0
          timer = setTimeout(tick, 600)
        }, 2200)
      }
    }
    timer = setTimeout(tick, 400)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="w-full max-w-[300px] space-y-3 px-4">
      <div className="flex items-center gap-2 bg-black/50 px-3 py-2.5 ring-1 ring-blood/50">
        <span className="font-display text-blood-bright">+</span>
        <span className="flex-1 font-display text-sm text-stone-100">
          {typed}
          <motion.span className="ml-px inline-block h-4 w-px bg-stone-200 align-middle" animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }} />
        </span>
        <span className="text-[11px] tabular-nums text-white/50">18:00</span>
      </div>
      <AnimatePresence>
        {added && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 bg-white/[0.04] px-3 py-2 ring-1 ring-white/10"
          >
            <span className="font-display text-xs font-bold tabular-nums text-stone-200">18:00</span>
            <span className="font-display text-sm font-bold text-stone-100">Trening nóg</span>
            <span className="ml-auto text-[10px] tracking-widest text-white/40 uppercase">Siła</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SealDemo() {
  const phase = useLoop(2, 1800)
  const [burst, setBurst] = useState(0)
  useEffect(() => {
    if (phase === 1) setBurst((b) => b + 1)
  }, [phase])
  const done = phase === 1

  return (
    <div className="flex w-full max-w-[300px] items-center gap-4 px-4">
      <div inert aria-hidden className="pointer-events-none">
        <RuneSeal rune={0} tier="blood" done={done} burstKey={done ? burst : 0} onToggle={() => {}} label="" />
      </div>
      <div className="relative">
        <p className={`font-display text-base font-bold transition-colors duration-500 ${done ? 'text-white/40' : 'text-stone-100'}`}>Trening nóg</p>
        <p className="text-[11px] tracking-widest text-blood-bright uppercase">+40 EXP</p>
        <AnimatePresence>
          {done && (
            <motion.span
              key={burst}
              className="absolute -top-5 left-0 font-display text-sm font-bold text-blood-bright"
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: -10, opacity: [0, 1, 0] }}
              transition={{ duration: 1.3 }}
            >
              +40 EXP
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function WeekDemo() {
  const lit = useLoop(9, 420)
  const pattern = [1, 2, 4, 5] // Pn Wt Cz Pt
  const steps = ['Przysiad 4×8', 'Martwy ciąg 3×6', 'Wykroki 3×10']

  return (
    <div className="w-full max-w-[300px] space-y-4 px-4">
      <div className="flex justify-between">
        {WEEK_ORDER.map((d, i) => {
          const on = pattern.includes(d) && i < lit
          return (
            <span key={d} className="relative grid size-8 place-items-center font-display text-[10px] font-bold">
              <motion.span
                className="absolute inset-[18%] rotate-45 border"
                animate={{
                  backgroundColor: on ? 'rgba(224,34,61,0.25)' : 'rgba(0,0,0,0.35)',
                  borderColor: on ? '#e0223d' : 'rgba(255,255,255,0.14)',
                }}
              />
              <span className={`relative ${on ? 'text-stone-100' : 'text-white/35'}`}>{DAY_SHORT[d]}</span>
            </span>
          )
        })}
      </div>
      <ul className="space-y-1.5">
        {steps.map((s, i) => {
          const on = lit > 3 + i * 2
          return (
            <li key={s} className="flex items-center gap-3 text-sm">
              <motion.span
                className="size-2.5 rotate-45 border"
                animate={{ backgroundColor: on ? '#e0223d' : 'rgba(0,0,0,0)', borderColor: on ? '#ff5a6e' : 'rgba(255,255,255,0.3)' }}
              />
              <span className={on ? 'text-white/35 line-through' : 'text-stone-200'}>{s}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

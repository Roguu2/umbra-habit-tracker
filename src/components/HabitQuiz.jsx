import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MiniRune } from './ui'
import { CATEGORIES, describeRepeat, detectCategory } from '../lib/game'
import { nextAlternative, recommend, toQuestDrafts } from '../lib/recommend'
import { sfx } from '../lib/sfx'
import { plural, t } from '../lib/i18n'

// Krótka ankieta: kilka pytań o cele i rytm dnia → gotowe nawyki do dodania jednym kliknięciem.

const GOALS = [
  { value: 'str', label: t('Siła', 'Strength'), sub: t('mięśnie i sylwetka', 'muscle and physique'), rune: CATEGORIES.str.rune, tier: 'blood' },
  { value: 'end', label: t('Kondycja', 'Endurance'), sub: t('ruch i wytrzymałość', 'movement and stamina'), rune: CATEGORIES.end.rune, tier: 'blood' },
  { value: 'vit', label: t('Zdrowie i sen', 'Health & sleep'), sub: t('jedzenie, woda, regeneracja', 'food, water, recovery'), rune: CATEGORIES.vit.rune, tier: 'gold' },
  { value: 'mind', label: t('Umysł i nauka', 'Mind & learning'), sub: t('czytanie, języki, rozwój', 'reading, languages, growth'), rune: CATEGORIES.mind.rune, tier: 'gold' },
  { value: 'calm', label: t('Spokój', 'Calm'), sub: t('mniej stresu, więcej skupienia', 'less stress, more focus'), rune: 1, tier: 'gold' },
  { value: 'life', label: t('Porządek dnia', 'Daily order'), sub: t('organizacja i rytm', 'organisation and rhythm'), rune: CATEGORIES.life.rune, tier: 'gold' },
]

const QUESTIONS = [
  {
    key: 'goals',
    multi: 2,
    title: t('Co chcesz wzmocnić?', 'What do you want to strengthen?'),
    text: t('Wybierz jeden albo dwa obszary.', 'Pick one or two areas.'),
    options: GOALS,
  },
  {
    key: 'life',
    title: t('Jak wygląda twój zwykły dzień?', 'What does your usual day look like?'),
    options: [
      { value: 'desk', label: t('Praca przy biurku', 'Desk job'), sub: t('dużo siedzenia, ekran', 'lots of sitting, screens') },
      { value: 'physical', label: t('Praca fizyczna', 'Physical work'), sub: t('ruchu mam sporo', 'I move a lot already') },
      { value: 'study', label: t('Nauka lub studia', 'School or university'), sub: t('zajęcia, książki, sesje', 'classes, books, exams') },
      { value: 'shift', label: t('Praca zmianowa', 'Shift work'), sub: t('każdy tydzień wygląda inaczej', 'every week looks different') },
      { value: 'home', label: t('Głównie w domu', 'Mostly at home'), sub: t('praca zdalna, dom, rodzina', 'remote work, home, family') },
    ],
  },
  {
    key: 'slot',
    title: t('Kiedy masz chwilę dla siebie?', 'When do you have time for yourself?'),
    skip: (a) => a.life === 'shift', // przy zmianach i tak nie ustawiamy godzin
    options: [
      { value: 'morning', label: t('Rano', 'In the morning'), sub: t('zanim dzień się rozkręci', 'before the day gets going') },
      { value: 'midday', label: t('W ciągu dnia', 'During the day'), sub: t('w przerwie, po południu', 'on a break, in the afternoon') },
      { value: 'evening', label: t('Wieczorem', 'In the evening'), sub: t('po pracy lub nauce', 'after work or study') },
    ],
  },
  {
    key: 'budget',
    title: t('Ile czasu dziennie możesz poświęcić?', 'How much time a day can you spare?'),
    options: [
      { value: 5, label: t('Około 5 minut', 'About 5 minutes'), sub: t('ledwo znajduję chwilę', 'I barely find a moment') },
      { value: 15, label: t('Około 15 minut', 'About 15 minutes'), sub: t('kwadrans się znajdzie', 'a quarter hour is doable') },
      { value: 30, label: t('30 minut i więcej', '30 minutes or more'), sub: t('mam czas, chcę działać', 'I have time and want to act') },
    ],
  },
  {
    key: 'level',
    title: t('Skąd startujesz?', 'Where are you starting from?'),
    options: [
      { value: 'new', label: t('Dopiero zaczynam', 'Just starting out'), sub: t('zacznę od małych kroków', "I'll start with small steps") },
      { value: 'some', label: t('Mam już jakieś nawyki', 'I already have some habits'), sub: t('mogę wziąć więcej', 'I can take on more') },
    ],
  },
]

export default function HabitQuiz({ open, existingNames, onAdd, onClose }) {
  return <AnimatePresence>{open && <Quiz existingNames={existingNames} onAdd={onAdd} onClose={onClose} />}</AnimatePresence>
}

function Quiz({ existingNames, onAdd, onClose }) {
  const [answers, setAnswers] = useState({ goals: [] })
  const [[step, dir], setStep] = useState([0, 1])
  const [result, setResult] = useState(null) // { ranked, picks, selected: Set, shown: Set }

  const steps = useMemo(() => QUESTIONS.filter((q) => !q.skip?.(answers)), [answers])
  const atResult = step >= steps.length
  const question = steps[step]

  const go = (next, nextAnswers = answers) => {
    const list = QUESTIONS.filter((q) => !q.skip?.(nextAnswers))
    if (next < 0) return
    if (next >= list.length) {
      const { picks, ranked } = recommend(nextAnswers, existingNames)
      setResult({ ranked, picks, selected: new Set(picks.map((x) => x.id)), shown: new Set(picks.map((x) => x.id)) })
      sfx.forge()
    } else sfx.page()
    setStep([next, next > step ? 1 : -1])
  }

  const choose = (q, value) => {
    if (q.multi) {
      const cur = answers.goals
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur.slice(-(q.multi - 1)), value]
      setAnswers({ ...answers, goals: next })
      return
    }
    const next = { ...answers, [q.key]: value }
    setAnswers(next)
    setTimeout(() => go(step + 1, next), 220) // pojedynczy wybór od razu przechodzi dalej
  }

  // Esc zamyka; strzałka w lewo cofa
  const keyHandler = useRef()
  keyHandler.current = (e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft' && step > 0) go(step - 1)
  }
  useEffect(() => {
    const handler = (e) => keyHandler.current(e)
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const answered = question && (question.multi ? answers.goals.length > 0 : answers[question.key] !== undefined)
  const total = steps.length + 1

  return (
    <motion.div
      className="fixed inset-0 z-[60] grid place-items-end overflow-y-auto sm:place-items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
    >
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-title"
        initial={{ opacity: 0, y: 50, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
        className="relative w-full max-w-lg"
      >
        <div className="hud-cut absolute inset-0 bg-gradient-to-b from-gold/50 via-white/[0.06] to-blood/50" />
        <div className="hud-cut absolute inset-px bg-[#0b0a0d]/95 backdrop-blur-2xl" />

        <div className="relative p-6 sm:p-7">
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5" aria-label={t(`Krok ${step + 1} z ${total}`, `Step ${step + 1} of ${total}`)}>
              {Array.from({ length: total }, (_, i) => (
                <motion.span
                  key={i}
                  className="h-1 rounded-full"
                  animate={{ width: i === step ? 28 : 10, backgroundColor: i <= step ? '#ff4259' : 'rgba(255,255,255,0.15)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              ))}
            </div>
            <button type="button" onClick={onClose} className="cursor-pointer text-[11px] tracking-[0.2em] text-white/40 uppercase hover:text-white">
              {atResult ? t('Zamknij', 'Close') : t('Pomiń', 'Skip')}
            </button>
          </div>

          <div className="relative mt-6 min-h-[420px] overflow-hidden">
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.div
                key={atResult ? 'result' : question.key}
                initial={{ opacity: 0, x: dir * 40, filter: 'blur(6px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: dir * -40, filter: 'blur(6px)' }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {atResult ? (
                  <Result result={result} setResult={setResult} answers={answers} />
                ) : (
                  <Question q={question} answers={answers} onChoose={choose} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => go(step - 1)}
              disabled={step === 0}
              className="cursor-pointer px-2 py-2 text-[11px] tracking-[0.2em] text-white/50 uppercase hover:text-white disabled:invisible"
            >
              ← {t('Wstecz', 'Back')}
            </button>
            {atResult ? (
              <AddButton result={result} answers={answers} onAdd={onAdd} />
            ) : (
              <motion.button
                type="button"
                onClick={() => go(step + 1)}
                disabled={!answered}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                className="hud-cut-sm cursor-pointer bg-gradient-to-r from-blood-deep via-blood to-blood-deep px-8 py-3 font-display text-xs font-bold tracking-[0.3em] text-stone-100 uppercase shadow-[0_0_24px_rgba(195,20,47,0.35)] disabled:cursor-not-allowed disabled:opacity-35"
              >
                {step === steps.length - 1 ? t('Dobierz', 'Show me') : t('Dalej', 'Next')}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Question({ q, answers, onChoose }) {
  const isOn = (v) => (q.multi ? answers.goals.includes(v) : answers[q.key] === v)
  return (
    <>
      <p className="text-[10px] tracking-[0.35em] text-gold/70 uppercase">{t('Dobór nawyków', 'Habit finder')}</p>
      <h2 id="quiz-title" className="mt-2 font-display text-2xl font-black text-stone-100">
        {q.title}
      </h2>
      {q.text && <p className="mt-2 text-[14px] text-white/55">{q.text}</p>}
      <div role={q.multi ? 'group' : 'radiogroup'} aria-label={q.title} className={`mt-5 grid gap-2 ${q.multi ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {q.options.map((o) => {
          const on = isOn(o.value)
          return (
            <motion.button
              key={o.value}
              type="button"
              role={q.multi ? 'checkbox' : 'radio'}
              aria-checked={on}
              onClick={() => {
                sfx.tick()
                onChoose(q, o.value)
              }}
              whileTap={{ scale: 0.97 }}
              className={`flex cursor-pointer items-center gap-3 px-3.5 py-3 text-left ring-1 transition-colors ${
                on ? 'bg-blood/20 ring-blood-bright/70' : 'bg-black/30 ring-white/10 hover:bg-white/[0.04] hover:ring-white/25'
              }`}
            >
              {o.rune !== undefined && <MiniRune rune={o.rune} tier={o.tier} lit={on} size="size-8" />}
              <span className="min-w-0">
                <span className="block font-display text-sm font-bold text-stone-100">{o.label}</span>
                <span className="block text-[11px] leading-snug text-white/45">{o.sub}</span>
              </span>
            </motion.button>
          )
        })}
      </div>
    </>
  )
}

function Result({ result, setResult, answers }) {
  const { picks, selected } = result
  const drafts = toQuestDrafts(
    picks.filter((x) => selected.has(x.id)),
    answers,
  )
  const draftOf = (x) => drafts.find((d) => d.name === x.name) ?? toQuestDrafts([x], { ...answers, life: 'shift' })[0]

  const toggle = (x) => {
    sfx.tick()
    const next = new Set(selected)
    if (next.has(x.id)) next.delete(x.id)
    else next.add(x.id)
    setResult({ ...result, selected: next })
  }

  const swap = (x) => {
    const alt = nextAlternative(result.ranked, picks, x, result.shown)
    if (!alt) return
    sfx.page()
    const nextSelected = new Set(selected)
    nextSelected.delete(x.id)
    nextSelected.add(alt.id)
    setResult({
      ...result,
      picks: picks.map((p) => (p === x ? alt : p)),
      selected: nextSelected,
      shown: new Set([...result.shown, alt.id]),
    })
  }

  return (
    <>
      <p className="text-[10px] tracking-[0.35em] text-gold/70 uppercase">{t('Twoja ścieżka', 'Your path')}</p>
      <h2 id="quiz-title" className="mt-2 font-display text-2xl font-black text-stone-100">
        {t('Nawyki dobrane dla ciebie', 'Habits chosen for you')}
      </h2>
      <p className="mt-2 text-[14px] text-white/55">
        {picks.length
          ? t('Odznacz, czego nie chcesz, albo wylosuj inną propozycję. Wszystko zmienisz potem w planie.', "Untick what you don't want or roll another suggestion. You can change everything later in the plan.")
          : t('Masz już w planie wszystko, co mogę zaproponować. Spróbuj innych odpowiedzi.', 'Your plan already has everything I could suggest. Try different answers.')}
      </p>

      <ul className="mt-5 space-y-2">
        <AnimatePresence initial={false} mode="popLayout">
          {picks.map((x) => {
            const on = selected.has(x.id)
            const cat = CATEGORIES[detectCategory(x.name)]
            const d = draftOf(x)
            return (
              <motion.li
                key={x.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`flex items-center gap-3 px-3 py-2.5 ring-1 transition-colors ${on ? 'bg-white/[0.04] ring-white/15' : 'bg-black/20 ring-white/[0.06]'}`}
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  aria-label={x.name}
                  onClick={() => toggle(x)}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                >
                  <MiniRune rune={cat.rune} tier={cat.tier} lit={on} size="size-8" />
                  <span className="min-w-0">
                    <span className={`block truncate text-sm ${on ? 'text-stone-100' : 'text-white/40 line-through'}`}>{x.name}</span>
                    <span className="block text-[10px] tracking-[0.12em] text-white/40 uppercase">
                      {d.time && `${d.time} · `}
                      {describeRepeat(d)}
                      {d.kind === 'count' && ` · ${d.target} ${d.unit}`}
                      {d.kind === 'avoid' && ` · ${t('unikam', 'avoid')}`}
                      {' · '}
                      <span className="text-gold/80">+{cat.exp} EXP</span>
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => swap(x)}
                  aria-label={t(`Inna propozycja zamiast: ${x.name}`, `Another suggestion instead of: ${x.name}`)}
                  title={t('Inna propozycja', 'Another suggestion')}
                  className="shrink-0 cursor-pointer px-2 py-1 text-base text-white/35 transition-colors hover:text-gold-bright"
                >
                  ↻
                </button>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
    </>
  )
}

function AddButton({ result, answers, onAdd }) {
  const chosen = result.picks.filter((x) => result.selected.has(x.id))
  const n = chosen.length
  return (
    <motion.button
      type="button"
      disabled={n === 0}
      onClick={() => onAdd(toQuestDrafts(chosen, answers))}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      className="hud-cut-sm cursor-pointer bg-gradient-to-r from-blood-deep via-blood to-blood-deep px-6 py-3 font-display text-xs font-bold tracking-[0.25em] text-stone-100 uppercase shadow-[0_0_24px_rgba(195,20,47,0.35)] disabled:cursor-not-allowed disabled:opacity-35"
    >
      {t('Dodaj', 'Add')} {n} {plural(n, ['nawyk', 'nawyki', 'nawyków'], ['habit', 'habits'])}
    </motion.button>
  )
}

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import DayPicker from './DayPicker'
import { Segmented } from './ui'
import { ALL_DAYS, CATEGORIES, WORK_DAYS, dayKey, detectCategory, formatDay } from '../lib/game'
import { sfx } from '../lib/sfx'

function repeatOf(q) {
  if (q.date) return 'once'
  const d = [...(q.days ?? ALL_DAYS)].sort().join()
  if (d === ALL_DAYS.join()) return 'daily'
  if (d === WORK_DAYS.join()) return 'workdays'
  return 'custom'
}

// Jedno okno do dodawania i edycji. draft: { id?, name, time, days, date, steps }
export default function QuestEditor({ draft, onSave, onRemove, onClose }) {
  return (
    <AnimatePresence>
      {draft && <EditorBody key={draft.id ?? 'new'} draft={draft} onSave={onSave} onRemove={onRemove} onClose={onClose} />}
    </AnimatePresence>
  )
}

function EditorBody({ draft, onSave, onRemove, onClose }) {
  const editing = Boolean(draft.id)
  const [name, setName] = useState(draft.name ?? '')
  const [time, setTime] = useState(draft.time ?? '')
  const [repeat, setRepeat] = useState(repeatOf(draft))
  const [days, setDays] = useState(draft.days?.length ? draft.days : [1, 3, 5])
  const [date, setDate] = useState(draft.date ?? dayKey())
  const [steps, setSteps] = useState(draft.steps ?? [])
  const [stepDraft, setStepDraft] = useState('')
  const [confirmRemove, setConfirmRemove] = useState(false)
  const nameRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    setTimeout(() => nameRef.current?.focus(), 80)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const category = name.trim() ? CATEGORIES[detectCategory(name)] : null
  const valid = name.trim() && (repeat !== 'custom' || days.length > 0)

  const addStep = () => {
    if (!stepDraft.trim()) return
    sfx.tick()
    setSteps((s) => [...s, stepDraft.trim()])
    setStepDraft('')
  }

  const submit = (e) => {
    e?.preventDefault()
    if (!valid) return
    const allSteps = stepDraft.trim() ? [...steps, stepDraft.trim()] : steps
    sfx.forge()
    onSave({
      id: draft.id,
      name: name.trim(),
      time,
      steps: allSteps,
      date: repeat === 'once' ? date : null,
      days: { daily: ALL_DAYS, workdays: WORK_DAYS, custom: days, once: [] }[repeat],
    })
    onClose()
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-end overflow-y-auto sm:place-items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <motion.form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-label={editing ? 'Edytuj zadanie' : 'Nowe zadanie'}
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className="relative w-full max-w-lg"
      >
        <div className="hud-cut absolute inset-0 bg-gradient-to-b from-blood/50 via-white/[0.06] to-gold/30" />
        <div className="hud-cut absolute inset-px bg-[#0b0a0d]/95 backdrop-blur-2xl" />

        <div className="relative space-y-6 p-6 sm:p-7">
          <header className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold tracking-[0.3em] text-stone-200 uppercase">
              {editing ? 'Edytuj zadanie' : 'Nowe zadanie'}
            </h2>
            <button type="button" onClick={onClose} aria-label="Zamknij" className="cursor-pointer px-2 text-white/40 hover:text-white">
              ✕
            </button>
          </header>

          <div>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Co chcesz zrobić?"
              maxLength={60}
              aria-label="Nazwa"
              className="w-full border-b border-white/15 bg-transparent pb-2 font-display text-xl text-stone-100 outline-none transition-colors placeholder:text-white/25 focus:border-blood-bright"
            />
            <div className="mt-2 h-4 text-[11px] tracking-[0.15em] text-white/40 uppercase">
              <AnimatePresence mode="wait">
                {category && (
                  <motion.span key={category.label} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="inline-block">
                    {category.label} · <span className="text-gold-bright">+{category.exp} EXP</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          <Field label="Godzina" hint="opcjonalnie">
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                aria-label="Godzina"
                className="border border-white/15 bg-black/40 px-3 py-2 font-display text-base text-stone-100 outline-none [color-scheme:dark] focus:border-blood-bright"
              />
              {time && (
                <button type="button" onClick={() => setTime('')} className="cursor-pointer text-[11px] tracking-widest text-white/40 uppercase hover:text-white">
                  bez godziny
                </button>
              )}
            </div>
          </Field>

          <Field label="Kiedy">
            <Segmented
              id="editor-repeat"
              value={repeat}
              onChange={setRepeat}
              options={[
                { value: 'once', label: 'Jednorazowo' },
                { value: 'daily', label: 'Codziennie' },
                { value: 'workdays', label: 'Pn–Pt' },
                { value: 'custom', label: 'Wybrane dni' },
              ]}
            />
            <div className="mt-3">
              {repeat === 'custom' && <DayPicker days={days} onChange={setDays} />}
              {repeat === 'once' && (
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="date"
                    value={date}
                    min={dayKey()}
                    onChange={(e) => e.target.value && setDate(e.target.value)}
                    aria-label="Data"
                    className="border border-white/15 bg-black/40 px-3 py-2 font-display text-sm text-stone-100 outline-none [color-scheme:dark] focus:border-blood-bright"
                  />
                  <span className="font-lore text-base text-white/45 italic">{formatDay(date)}</span>
                </div>
              )}
            </div>
          </Field>

          <Field label="Kroki" hint="opcjonalnie — np. ćwiczenia w treningu">
            {steps.length > 0 && (
              <ol className="mb-2 space-y-1">
                <AnimatePresence initial={false}>
                  {steps.map((s, i) => (
                    <motion.li
                      key={`${s}-${i}`}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      className="group flex items-center gap-3 text-sm text-stone-200"
                    >
                      <span className="w-4 text-right text-[11px] tabular-nums text-white/30">{i + 1}.</span>
                      <span className="flex-1">{s}</span>
                      <button
                        type="button"
                        onClick={() => setSteps((all) => all.filter((_, j) => j !== i))}
                        aria-label={`Usuń krok ${s}`}
                        className="cursor-pointer px-1 text-xs text-white/25 hover:text-blood-bright"
                      >
                        ✕
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ol>
            )}
            <div className="flex gap-2">
              <input
                value={stepDraft}
                onChange={(e) => setStepDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addStep()
                  }
                }}
                placeholder="np. Przysiad 4×8"
                maxLength={60}
                aria-label="Nowy krok"
                className="min-w-0 flex-1 border-b border-white/10 bg-transparent py-1 text-sm text-stone-200 outline-none placeholder:text-white/25 focus:border-gold/60"
              />
              <button type="button" onClick={addStep} className="cursor-pointer px-2 text-[11px] tracking-widest text-gold/80 uppercase hover:text-gold-bright">
                + dodaj
              </button>
            </div>
          </Field>

          <footer className="flex items-center justify-between gap-3 pt-2">
            {editing ? (
              <button
                type="button"
                onClick={() => {
                  if (!confirmRemove) {
                    sfx.tick()
                    setConfirmRemove(true)
                    return
                  }
                  sfx.abandon()
                  onRemove(draft.id)
                  onClose()
                }}
                className="cursor-pointer text-[11px] tracking-[0.2em] text-blood-bright/70 uppercase hover:text-blood-bright"
              >
                {confirmRemove ? 'Na pewno usunąć?' : 'Usuń'}
              </button>
            ) : (
              <span />
            )}
            <motion.button
              type="submit"
              disabled={!valid}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="hud-cut-sm cursor-pointer bg-gradient-to-r from-blood-deep via-blood to-blood-deep px-8 py-3 font-display text-xs font-bold tracking-[0.3em] text-stone-100 uppercase shadow-[0_0_24px_rgba(195,20,47,0.35)] disabled:cursor-not-allowed disabled:opacity-35"
            >
              {editing ? 'Zapisz' : 'Dodaj do planu'}
            </motion.button>
          </footer>
        </div>
      </motion.form>
    </motion.div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <p className="mb-2 text-[10px] tracking-[0.3em] text-white/40 uppercase">
        {label} {hint && <span className="tracking-normal normal-case text-white/25">· {hint}</span>}
      </p>
      {children}
    </div>
  )
}

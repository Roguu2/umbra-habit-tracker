import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, Reorder, motion, useDragControls } from 'framer-motion'
import { STEP_MAX_LENGTH, stepsFromText } from '../lib/steps'
import { sfx } from '../lib/sfx'
import { t } from '../lib/i18n'

// Kroki w edytorze mają stabilne id (klucz Reacta — edycja nie przemontowuje wiersza) i from:
// indeks w zapisanym zadaniu albo null dla nowego. Z from useGame przenosi postęp kroków (lib/steps.js).
let seq = 0
const stepOf = (text, from = null) => ({ id: `step-${++seq}`, text, from })
export const toEditorSteps = (steps = []) => steps.map((text, i) => stepOf(text, i))

const UNDO_MS = 6000

// steps / onChange — lista kroków edytora; draft / onDraftChange — pole „Nowy krok”
export default function StepsEditor({ steps, onChange, draft, onDraftChange }) {
  const [removed, setRemoved] = useState(null) // { step, index } — ostatnio usunięty, do cofnięcia

  useEffect(() => {
    if (!removed) return
    const id = setTimeout(() => setRemoved(null), UNDO_MS)
    return () => clearTimeout(id)
  }, [removed])

  const add = (texts) => {
    if (!texts.length) return
    sfx.tick()
    onChange([...steps, ...texts.map((text) => stepOf(text))])
  }

  const addDraft = () => {
    add(stepsFromText(draft))
    onDraftChange('')
  }

  const update = (id, text) => onChange(steps.map((s) => (s.id === id ? { ...s, text } : s)))

  const remove = (id) => {
    const index = steps.findIndex((s) => s.id === id)
    sfx.tick()
    setRemoved({ step: steps[index], index })
    onChange(steps.filter((s) => s.id !== id))
  }

  const undo = () => {
    const next = [...steps]
    next.splice(Math.min(removed.index, next.length), 0, removed.step)
    sfx.tick()
    onChange(next)
    setRemoved(null)
  }

  const move = (id, dir) => {
    const i = steps.findIndex((s) => s.id === id)
    const j = i + dir
    if (j < 0 || j >= steps.length) return
    const next = [...steps]
    ;[next[i], next[j]] = [next[j], next[i]]
    sfx.tick()
    onChange(next)
  }

  return (
    <>
      {steps.length > 0 && (
        <Reorder.Group as="ol" axis="y" values={steps} onReorder={onChange} className="mb-2 space-y-1">
          <AnimatePresence initial={false}>
            {steps.map((step, i) => (
              <StepRow key={step.id} step={step} index={i} count={steps.length} onUpdate={update} onRemove={remove} onMove={move} />
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}

      <AnimatePresence>
        {removed && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 overflow-hidden text-[11px] text-white/45"
            role="status"
          >
            {t('Usunięto krok', 'Step removed')} „{removed.step.text}” ·{' '}
            <button type="button" onClick={undo} className="cursor-pointer tracking-widest text-gold/80 uppercase hover:text-gold-bright">
              {t('cofnij', 'undo')}
            </button>
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addDraft()
            }
          }}
          // kilka linii naraz (np. lista ćwiczeń z notatek) — każda linia to osobny krok
          onPaste={(e) => {
            const text = e.clipboardData.getData('text')
            if (!/\r?\n/.test(text.trim())) return
            e.preventDefault()
            add(stepsFromText(text))
          }}
          placeholder={t('np. Przysiad 4×8', 'e.g. Squat 4×8')}
          maxLength={STEP_MAX_LENGTH}
          aria-label={t('Nowy krok', 'New step')}
          title={t('Możesz wkleić kilka linii — każda będzie osobnym krokiem', 'You can paste several lines — each becomes a step')}
          className="min-w-0 flex-1 border-b border-white/10 bg-transparent py-1 text-sm text-stone-200 outline-none placeholder:text-white/25 focus:border-gold/60"
        />
        <button type="button" onClick={addDraft} className="cursor-pointer px-2 text-[11px] tracking-widest text-gold/80 uppercase hover:text-gold-bright">
          {t('+ dodaj', '+ add')}
        </button>
      </div>
    </>
  )
}

const arrowClass = 'cursor-pointer px-1 text-[10px] text-white/30 hover:text-gold-bright disabled:cursor-default disabled:opacity-0'

function StepRow({ step, index, count, onUpdate, onRemove, onMove }) {
  const controls = useDragControls()
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(step.text)
  const closed = useRef(false)
  const label = useRef(null)
  const refocus = useRef(false)

  // po Enter/Esc fokus wraca na krok, żeby dało się dalej pracować klawiaturą
  useEffect(() => {
    if (editing || !refocus.current) return
    refocus.current = false
    label.current?.focus()
  }, [editing])

  const startEdit = () => {
    closed.current = false
    setText(step.text)
    setEditing(true)
  }

  const finish = (save, fromKey = false) => {
    if (closed.current) return
    closed.current = true
    refocus.current = fromKey
    setEditing(false)
    const value = text.trim().slice(0, STEP_MAX_LENGTH)
    if (save && !value) onRemove(step.id)
    else if (save && value !== step.text) onUpdate(step.id, value)
  }

  return (
    <Reorder.Item
      value={step}
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      whileDrag={{ scale: 1.02, zIndex: 10 }}
      className="group relative flex items-center gap-2 bg-[#0b0a0d] text-sm text-stone-200"
    >
      <button
        type="button"
        aria-label={t(`Przeciągnij krok ${step.text}`, `Drag step ${step.text}`)}
        title={t('Przeciągnij, aby zmienić kolejność', 'Drag to reorder')}
        onPointerDown={(e) => {
          e.preventDefault()
          controls.start(e)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault()
            onMove(step.id, e.key === 'ArrowUp' ? -1 : 1)
          }
        }}
        className="cursor-grab touch-none px-0.5 text-xs text-white/25 hover:text-white/60 active:cursor-grabbing"
      >
        ⠿
      </button>
      <span className="w-4 text-right text-[11px] tabular-nums text-white/30">{index + 1}.</span>

      {editing ? (
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => finish(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              finish(true, true)
            } else if (e.key === 'Escape') {
              // Escape anuluje edycję kroku, a nie zamyka całego okna (useEscape słucha na window)
              e.stopPropagation()
              finish(false, true)
            }
          }}
          maxLength={STEP_MAX_LENGTH}
          aria-label={t('Treść kroku', 'Step text')}
          className="min-w-0 flex-1 border-b border-gold/60 bg-transparent py-0.5 text-sm text-stone-100 outline-none"
        />
      ) : (
        <button
          ref={label}
          type="button"
          onClick={startEdit}
          aria-label={t(`Edytuj krok: ${step.text}`, `Edit step: ${step.text}`)}
          className="min-w-0 flex-1 cursor-text truncate py-0.5 text-left hover:text-white"
        >
          {step.text}
        </button>
      )}

      <button type="button" onClick={() => onMove(step.id, -1)} disabled={index === 0} aria-label={t(`Przesuń w górę: ${step.text}`, `Move up: ${step.text}`)} className={arrowClass}>
        ▲
      </button>
      <button
        type="button"
        onClick={() => onMove(step.id, 1)}
        disabled={index === count - 1}
        aria-label={t(`Przesuń w dół: ${step.text}`, `Move down: ${step.text}`)}
        className={arrowClass}
      >
        ▼
      </button>
      <button
        type="button"
        onClick={() => onRemove(step.id)}
        aria-label={t(`Usuń krok ${step.text}`, `Remove step ${step.text}`)}
        className="cursor-pointer px-1 text-xs text-white/25 hover:text-blood-bright"
      >
        ✕
      </button>
    </Reorder.Item>
  )
}

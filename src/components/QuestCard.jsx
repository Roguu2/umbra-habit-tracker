import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, Reorder, motion, useDragControls } from 'framer-motion'
import RuneSeal from './RuneSeal'
import { CATEGORIES, TIERS } from '../lib/game'
import { sfx } from '../lib/sfx'

// reorder: { onDrop, onMove } — włącza przeciąganie (tylko dla zadań bez godziny)
// index: pozycja na liście — opóźnia wejście karty (efekt kaskady)
export default function QuestCard({ quest, done, checkedSteps = [], streak, isNext, index = 0, onToggle, onToggleStep, onEdit, reorder }) {
  const dragControls = useDragControls()
  const [burstKey, setBurstKey] = useState(0)
  const [open, setOpen] = useState(false)
  const c = TIERS[quest.tier]
  const hasSteps = quest.steps.length > 0

  // efekt i dźwięk przy każdej zmianie stanu — także gdy zadanie zaliczy się samo po ostatnim kroku
  const prevDone = useRef(done)
  useEffect(() => {
    if (done && !prevDone.current) {
      setBurstKey((k) => k + 1)
      sfx.seal(quest.tier)
    } else if (!done && prevDone.current) {
      sfx.unseal()
    }
    prevDone.current = done
  }, [done, quest.tier])

  const toggleOpen = () => {
    if (!hasSteps) return
    sfx.tick()
    setOpen((v) => !v)
  }

  // w trybie przeciągania karta jest elementem Reorder; przeciąga się tylko za uchwyt
  const Outer = reorder ? Reorder.Item : motion.li
  const outerProps = reorder
    ? {
        value: quest,
        dragListener: false,
        dragControls,
        onDragEnd: reorder.onDrop,
        whileDrag: { scale: 1.03, zIndex: 30, filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.6))' },
      }
    : { layout: true, whileHover: { y: -3 } }

  // Wejście animuje sama karta (nie warianty rodzica) — dzięki temu karty zawsze się pokazują,
  // także po powrocie na zakładkę, kiedy AnimatePresence pomija animację początkową listy.
  return (
    <Outer
      {...outerProps}
      initial={{ opacity: 0, x: -24, filter: 'blur(6px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: 60, scale: 0.95, filter: 'blur(8px)', transition: { duration: 0.3 } }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 24,
        opacity: { duration: 0.4, delay: Math.min(index, 8) * 0.06 },
        x: { type: 'spring', stiffness: 140, damping: 18, delay: Math.min(index, 8) * 0.06 },
        filter: { duration: 0.4, delay: Math.min(index, 8) * 0.06 },
      }}
      className="group relative list-none"
    >
      {/* tło: ramka + szkło */}
      <div
        className="hud-cut absolute inset-0 transition-[background] duration-500"
        style={{
          background: done
            ? `linear-gradient(120deg, ${c.main}55, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.02))`
            : isNext
              ? `linear-gradient(120deg, ${c.main}99, rgba(255,255,255,0.06) 45%, rgba(255,255,255,0.1))`
              : 'linear-gradient(120deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.08))',
        }}
      />
      <div className="hud-cut absolute inset-px overflow-hidden bg-[#0b0a0d]/85 backdrop-blur-xl">
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: `radial-gradient(120% 140% at 0% 50%, ${c.glow.replace(/[\d.]+\)$/, '0.14)')}, transparent 60%)` }}
        />
        {burstKey > 0 && (
          <motion.div
            key={burstKey}
            className="absolute inset-y-0 w-2/3"
            style={{ background: `linear-gradient(100deg, transparent, ${c.glow}, rgba(255,255,255,0.25), transparent)` }}
            initial={{ x: '-100%', opacity: 1 }}
            animate={{ x: '170%', opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
          />
        )}
      </div>

      <div className="relative flex items-center gap-3 py-3.5 pl-3 pr-3 sm:gap-4 sm:pl-4 sm:pr-4">
        <div className="w-11 shrink-0 text-center sm:w-12">
          {quest.time ? (
            <span className={`font-display text-sm font-bold tabular-nums ${done ? 'text-white/30' : 'text-stone-200'}`}>{quest.time}</span>
          ) : reorder ? (
            <button
              type="button"
              aria-label={`Zmień kolejność: ${quest.name} (przeciągnij lub użyj strzałek)`}
              title="Przeciągnij, aby zmienić kolejność"
              onPointerDown={(e) => {
                e.preventDefault()
                sfx.tick()
                dragControls.start(e)
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  e.preventDefault()
                  reorder.onMove(quest.id, e.key === 'ArrowUp' ? -1 : 1)
                }
              }}
              className="mx-auto grid size-9 cursor-grab touch-none place-items-center text-white/25 transition-colors hover:text-white/70 active:cursor-grabbing"
            >
              <svg viewBox="0 0 12 18" className="h-4 w-3" aria-hidden>
                {[3, 9, 15].map((y) =>
                  [3, 9].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" fill="currentColor" />),
                )}
              </svg>
            </button>
          ) : (
            <span className="font-display text-sm text-white/20">—</span>
          )}
        </div>

        <RuneSeal
          rune={quest.rune}
          tier={quest.tier}
          done={done}
          burstKey={burstKey}
          onToggle={() => onToggle(quest.id)}
          label={`${quest.name}: oznacz jako ${done ? 'niewykonane' : 'wykonane'}`}
        />

        <motion.div
          className={`min-w-0 flex-1 ${hasSteps ? 'cursor-pointer' : ''}`}
          onClick={toggleOpen}
          initial={false}
          animate={{ opacity: done ? 0.5 : 1 }}
          transition={{ duration: 0.8, delay: done ? 0.35 : 0 }}
        >
          <div className="relative inline-block max-w-full">
            <h3 className="font-display text-[15px] leading-snug font-bold tracking-wide break-words text-stone-100 sm:text-base">{quest.name}</h3>
            <motion.span
              className="absolute left-0 top-1/2 h-px w-full origin-left"
              style={{ background: `linear-gradient(90deg, ${c.bright}, transparent)` }}
              initial={false}
              animate={{ scaleX: done ? 1 : 0 }}
              transition={{ duration: 0.5, delay: done ? 0.25 : 0, ease: 'easeInOut' }}
            />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] tracking-[0.12em] text-white/40 uppercase">
            {isNext && !done && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-1.5 py-px text-[9px] font-bold tracking-[0.2em]"
                style={{ color: c.bright, boxShadow: `inset 0 0 0 1px ${c.main}` }}
              >
                Następne
              </motion.span>
            )}
            <span>{CATEGORIES[quest.attr]?.label}</span>
            <span style={{ color: c.bright }}>+{quest.exp} EXP</span>
            {streak > 0 && <span title="Seria wykonań">🔥 {streak}</span>}
            {hasSteps && (
              <span className="flex items-center gap-1 text-white/55">
                {checkedSteps.length}/{quest.steps.length} kroków
                <motion.svg viewBox="0 0 12 12" className="size-2.5" animate={{ rotate: open ? 90 : 0 }}>
                  <path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" />
                </motion.svg>
              </span>
            )}
          </div>
        </motion.div>

        {onEdit && (
          <motion.button
            type="button"
            onClick={() => {
              sfx.tick()
              onEdit(quest)
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={`Edytuj: ${quest.name}`}
            className="grid size-8 shrink-0 cursor-pointer place-items-center text-white/30 transition-colors hover:text-gold-bright sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          >
            <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
              <path d="M11 2.5l2.5 2.5L6 12.5H3.5V10Z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
          </motion.button>
        )}
      </div>

      {/* kroki */}
      <AnimatePresence initial={false}>
        {open && hasSteps && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden pl-[76px] pr-4 sm:pl-[92px]"
          >
            <ul className="space-y-1 pb-4">
              {quest.steps.map((step, i) => {
                const on = checkedSteps.includes(i)
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => {
                        sfx.tick()
                        onToggleStep(quest.id, i)
                      }}
                      className="flex w-full cursor-pointer items-center gap-3 py-1 text-left"
                    >
                      <motion.span
                        className="size-3 shrink-0 rotate-45 border"
                        initial={false}
                        animate={{
                          backgroundColor: on ? c.main : 'rgba(0,0,0,0)',
                          borderColor: on ? c.bright : 'rgba(255,255,255,0.3)',
                          boxShadow: on ? `0 0 8px ${c.glow}` : '0 0 0 rgba(0,0,0,0)',
                        }}
                      />
                      <span className={`text-sm transition-colors ${on ? 'text-white/35 line-through' : 'text-stone-200'}`}>{step}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* unoszące się +EXP */}
      <AnimatePresence>
        {burstKey > 0 && done && (
          <motion.span
            key={burstKey}
            className="pointer-events-none absolute left-24 top-1 font-display text-sm font-bold"
            style={{ color: c.bright, textShadow: `0 0 12px ${c.main}` }}
            initial={{ y: 10, opacity: 0, scale: 0.8 }}
            animate={{ y: -28, opacity: [0, 1, 1, 0], scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
          >
            +{quest.exp} EXP
          </motion.span>
        )}
      </AnimatePresence>
    </Outer>
  )
}

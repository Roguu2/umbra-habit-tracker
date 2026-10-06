import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { MiniRune, Panel } from './ui'
import { attributeStats, characterClass, weakSpot } from '../lib/attributes'
import { TIERS } from '../lib/game'

const SIZE = 300
const C = SIZE / 2
// margines na etykiety osi wychodzące poza koło
const PAD_X = 64
const PAD_Y = 30
const VIEW = { x: -PAD_X, y: -PAD_Y, w: SIZE + 2 * PAD_X, h: SIZE + 2 * PAD_Y }
const R = 96
const GOLD = '#e2b45a'
const SURFACE = '#09080b'

const angle = (i, n) => -Math.PI / 2 + (i * 2 * Math.PI) / n
const point = (i, n, r) => [C + Math.cos(angle(i, n)) * r, C + Math.sin(angle(i, n)) * r]

export default function CharacterSheet({ state, today }) {
  const attrs = useMemo(() => attributeStats(state, today), [state, today])
  const cls = characterClass(attrs)
  const weak = weakSpot(attrs)

  return (
    <Panel title="Karta postaci" subtitle="atrybuty rosną z każdą pieczęcią" delay={0.25}>
      <div className="grid items-center gap-8 md:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <Radar attrs={attrs} />

        <div className="space-y-6">
          <div>
            <p className="text-[10px] tracking-[0.3em] text-white/40 uppercase">Klasa</p>
            <motion.p
              key={cls.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-gilded mt-1 font-display text-2xl font-black tracking-wide sm:text-3xl"
            >
              {cls.name}
            </motion.p>
            <p className="mt-1.5 font-lore text-base text-white/55 italic">{cls.desc}</p>
          </div>

          <ul className="space-y-3">
            {attrs.map((a, i) => (
              <li key={a.k} className="flex items-center gap-3">
                <MiniRune rune={a.rune} tier={a.tier} lit={a.exp > 0} size="size-8" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2 text-[11px]">
                    <span className="font-display font-bold tracking-[0.2em] text-stone-200 uppercase">{a.label}</span>
                    <span className="tabular-nums text-white/45">
                      <span className="font-display text-sm font-bold text-stone-100">Lv {a.level}</span> · {a.current}/{a.needed}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${TIERS[a.tier].main}55, ${TIERS[a.tier].main})` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(a.current / a.needed) * 100}%` }}
                      transition={{ type: 'spring', stiffness: 60, damping: 16, delay: 0.35 + i * 0.06 }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {weak && (
            <p className="border-l-2 border-blood/60 pl-3 text-[12px] leading-relaxed text-white/55">
              {weak.type === 'lagging' ? (
                <>
                  <b className="text-blood-bright">{weak.attr.label}</b> słabnie — w ostatnich 14 dniach wykonano {weak.attr.recent.done} z{' '}
                  {weak.attr.recent.planned} zaplanowanych zadań.
                </>
              ) : (
                <>
                  <b className="text-white/80">{weak.attr.label}</b> pozostaje nieodkryta — dodaj zadanie z tej dziedziny, by rozwinąć atrybut.
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </Panel>
  )
}

function Radar({ attrs }) {
  const [hover, setHover] = useState(null)
  const n = attrs.length
  const max = Math.max(...attrs.map((a) => a.exp))
  // promień = udział względem najsilniejszego atrybutu; minimalny, żeby kształt był widoczny
  const radii = attrs.map((a) => (max ? Math.max(0.06, a.exp / max) * R : 0))
  const shape = radii.map((r, i) => point(i, n, r).join(',')).join(' ')
  const active = hover === null ? null : attrs[hover]

  return (
    <div className="relative mx-auto w-full max-w-[380px]">
      <svg viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} className="w-full" role="img" aria-label="Wykres atrybutów postaci">
        {/* siatka */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <polygon
            key={f}
            points={attrs.map((_, i) => point(i, n, R * f).join(',')).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        ))}
        {attrs.map((_, i) => {
          const [x, y] = point(i, n, R)
          return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        })}

        {/* kształt postaci */}
        {max > 0 && (
          <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 70, damping: 14, delay: 0.3 }} style={{ originX: '50%', originY: '50%' }}>
            <polygon points={shape} fill={`${GOLD}26`} stroke={GOLD} strokeWidth="2" strokeLinejoin="round" />
            {radii.map((r, i) => {
              const [x, y] = point(i, n, r)
              return <circle key={i} cx={x} cy={y} r={hover === i ? 5.5 : 4} fill={GOLD} stroke={SURFACE} strokeWidth="2" />
            })}
          </motion.g>
        )}

        {/* pola najechania — większe niż znaczniki */}
        {attrs.map((a, i) => {
          const [x, y] = point(i, n, Math.max(radii[i], R * 0.35))
          return (
            <circle
              key={a.k}
              cx={x}
              cy={y}
              r="20"
              fill="transparent"
              tabIndex={0}
              aria-label={`${a.label}: poziom ${a.level}, ${a.exp} EXP`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="cursor-default outline-none"
            />
          )
        })}
      </svg>

      {/* etykiety osi w HTML — stały rozmiar tekstu niezależnie od skali wykresu */}
      {attrs.map((a, i) => {
        const [x, y] = point(i, n, R + 20)
        const align = Math.abs(x - C) < 4 ? 'center' : x > C ? 'left' : 'right'
        const shift = { center: '-50%', left: '0', right: '-100%' }[align]
        return (
          <div
            key={a.k}
            className="pointer-events-none absolute whitespace-nowrap leading-tight select-none"
            style={{
              left: `${((x - VIEW.x) / VIEW.w) * 100}%`,
              top: `${((y - VIEW.y) / VIEW.h) * 100}%`,
              transform: `translate(${shift}, ${y < C - R / 2 ? '-100%' : y > C + R / 2 ? '0' : '-50%'})`,
              textAlign: align,
            }}
          >
            <p className="font-display text-[10px] font-bold tracking-[0.08em] text-stone-200 uppercase">{a.label}</p>
            <p className="text-[10px] tabular-nums text-white/45">Lv {a.level}</p>
          </div>
        )
      })}

      {active && (
        <div
          className="pointer-events-none absolute z-20 w-40 -translate-x-1/2 border border-white/15 bg-[#0d0b0e]/95 px-3 py-2 text-[11px] shadow-xl"
          style={{
            left: `${((point(hover, n, Math.max(radii[hover], R * 0.35))[0] - VIEW.x) / VIEW.w) * 100}%`,
            top: `${((point(hover, n, Math.max(radii[hover], R * 0.35))[1] - VIEW.y) / VIEW.h) * 100 + 8}%`,
          }}
        >
          <p className="font-display text-[11px] font-bold tracking-[0.2em] text-stone-100 uppercase">{active.label}</p>
          <p className="mt-1 tabular-nums text-white/60">
            Poziom {active.level} · {active.exp} EXP łącznie
          </p>
          <p className="tabular-nums text-white/40">
            14 dni: {active.recent.done}/{active.recent.planned} zadań
          </p>
        </div>
      )}
    </div>
  )
}

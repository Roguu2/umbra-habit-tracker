// --- Efekt odhaczenia: combo, siła i wibracja ---------------------------------------------
// Combo żyje tylko w pamięci (bez zapisu): kolejne odhaczenia tego samego dnia w krótkich odstępach
// wzmacniają efekt. Siła rośnie z EXP zadania — zwykłe zadania dostają subtelny efekt, trudne pełny.

import { isMuted } from './sfx.js'

export const COMBO_WINDOW_MS = 90_000
export const COMBO_MAX = 5

let last = { day: null, at: 0, combo: 0 }

// rejestruje odhaczenie i zwraca poziom combo (1 = pojedyncze odhaczenie)
export function registerCheck(day, now = Date.now()) {
  const chained = last.day === day && now - last.at <= COMBO_WINDOW_MS
  const combo = chained ? Math.min(COMBO_MAX, last.combo + 1) : 1
  last = { day, at: now, combo }
  return combo
}

// siła efektu 0–1: 15 EXP (codzienność) → 0, 45 EXP i więcej → 1
export const weightOf = (exp) => Math.min(1, Math.max(0, (exp - 15) / 30))

export const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

// lekka wibracja na telefonie — tylko gdy jest dostępna, a dźwięk i animacje nie są wyłączone
export function vibrate(pattern) {
  if (isMuted() || prefersReducedMotion() || typeof navigator === 'undefined' || !navigator.vibrate) return
  navigator.vibrate(pattern)
}

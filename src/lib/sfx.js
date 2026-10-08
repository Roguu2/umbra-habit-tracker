// Syntezowane efekty dźwiękowe w klimacie kuźni (Web Audio API) — bez plików audio.
// Kontekst audio powstaje leniwie przy pierwszym dźwięku, czyli zawsze po geście użytkownika.

const STORAGE_KEY = 'umbra-sfx-muted'

let ctx = null
let master = null
let reverbIn = null
let noiseBuf = null

let muted = (() => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
})()

export const isMuted = () => muted

export function setMuted(value) {
  muted = value
  try {
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
  } catch {
    // brak storage — ustawienie działa tylko w tej sesji
  }
}

function audio() {
  if (muted) return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()

    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -16
    comp.ratio.value = 5
    comp.attack.value = 0.002
    master = ctx.createGain()
    master.gain.value = 0.55
    master.connect(comp)
    comp.connect(ctx.destination)

    // pogłos kamiennej kuźni — krótszy i gęstszy niż katedralny
    const conv = ctx.createConvolver()
    conv.buffer = impulse(1.8, 3)
    const wet = ctx.createGain()
    wet.gain.value = 0.45
    conv.connect(wet)
    wet.connect(master)
    reverbIn = conv

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = noiseBuf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function impulse(seconds, decay) {
  const len = ctx.sampleRate * seconds
  const buf = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
  }
  return buf
}

// --- prymitywy -------------------------------------------------------------

// wyjście głosu: sygnał suchy + regulowana wysyłka na pogłos
function out(send) {
  const g = ctx.createGain()
  g.connect(master)
  if (send > 0) {
    const s = ctx.createGain()
    s.gain.value = send
    g.connect(s)
    s.connect(reverbIn)
  }
  return g
}

function envelope(param, start, peak, attack, dur) {
  param.setValueAtTime(0.0001, start)
  param.exponentialRampToValueAtTime(peak, start + attack)
  param.exponentialRampToValueAtTime(0.0001, start + dur)
}

function tone({ freq, to, type = 'sine', t = 0, dur = 0.5, gain = 0.2, attack = 0.005, send = 0.3, filter }) {
  const start = ctx.currentTime + t
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (to) osc.frequency.exponentialRampToValueAtTime(to, start + dur)

  const g = ctx.createGain()
  envelope(g.gain, start, gain, attack, dur)

  let node = osc
  if (filter) {
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = filter
    osc.connect(f)
    node = f
  }
  node.connect(g)
  g.connect(out(send))
  osc.start(start)
  osc.stop(start + dur + 0.05)
}

function noise({ t = 0, dur = 0.3, gain = 0.1, type = 'bandpass', freq = 1000, to, q = 1, attack = 0.01, send = 0.3 }) {
  const start = ctx.currentTime + t
  const src = ctx.createBufferSource()
  src.buffer = noiseBuf
  src.loop = true

  const f = ctx.createBiquadFilter()
  f.type = type
  f.Q.value = q
  f.frequency.setValueAtTime(freq, start)
  if (to) f.frequency.exponentialRampToValueAtTime(to, start + dur)

  const g = ctx.createGain()
  envelope(g.gain, start, gain, attack, dur)

  src.connect(f)
  f.connect(g)
  g.connect(out(send))
  src.start(start, Math.random())
  src.stop(start + dur + 0.05)
}

// --- kuźnia ------------------------------------------------------------------

// Mody drgań stalowego kowadła (nieharmoniczne). Każdy mod gra w parze lekko rozstrojonej,
// co daje charakterystyczne "pływanie" dźwięku dzwoniącego metalu.
const ANVIL_MODES = [1, 2.32, 4.25, 6.63, 9.38]

// Uderzenie młota w kowadło: trzask + masa + dzwonienie.
function strike(t, { pitch = 650, power = 1, ring = 1.2, send = 0.35 } = {}) {
  noise({ t, dur: 0.03, gain: 0.55 * power, type: 'highpass', freq: 2000, attack: 0.001, send: 0.15 })
  noise({ t, dur: 0.07, gain: 0.25 * power, type: 'bandpass', freq: pitch * 1.7, q: 3, attack: 0.001, send: 0.2 })
  tone({ freq: 150, to: 70, t, dur: 0.16, gain: 0.5 * power, attack: 0.001, send: 0.05 })
  ANVIL_MODES.forEach((ratio, i) => {
    const dur = ring * (1 - i * 0.15)
    const g = (0.15 * power) / (i + 1.3)
    tone({ freq: pitch * ratio, t, dur, gain: g, attack: 0.001, send })
    tone({ freq: pitch * ratio + 1.2 + i * 0.8, t, dur: dur * 0.85, gain: g * 0.6, attack: 0.001, send })
  })
}

// Mały metaliczny "tink" — dłuto, gwóźdź, drobny element.
function ting(t, pitch, gain) {
  noise({ t, dur: 0.012, gain: gain * 1.4, type: 'highpass', freq: 4000, attack: 0.0008, send: 0.1 })
  tone({ freq: pitch, t, dur: 0.18, gain, attack: 0.001, send: 0.3 })
  tone({ freq: pitch * 2.32, t, dur: 0.1, gain: gain * 0.5, attack: 0.001, send: 0.3 })
}

// Iskry: krótkie, ostre trzaski coraz rzadsze w czasie.
function sparks(t, count, spread, gain = 0.12) {
  for (let i = 0; i < count; i++) {
    const at = t + Math.pow(Math.random(), 1.8) * spread
    const fade = 1 - (at - t) / (spread * 1.2)
    noise({
      t: at,
      dur: 0.004 + Math.random() * 0.012,
      gain: gain * (0.4 + Math.random() * 0.6) * Math.max(0.2, fade),
      type: 'highpass',
      freq: 3000 + Math.random() * 5000,
      attack: 0.0008,
      send: 0.3,
    })
  }
}

// Syk hartowania: para + trzaskanie wrzącej wody.
function quench(t, dur = 1.2, gain = 1) {
  noise({ t, dur, gain: 0.07 * gain, type: 'highpass', freq: 5200, attack: 0.04, send: 0.25 })
  noise({ t, dur: dur * 0.8, gain: 0.04 * gain, type: 'bandpass', freq: 2600, to: 1100, q: 0.8, attack: 0.03, send: 0.3 })
  sparks(t + 0.05, Math.round(16 * dur), dur * 0.9, 0.05 * gain)
}

// Miech: ciepły podmuch z rosnącym filtrem.
function bellows(t, dur = 0.8, gain = 1) {
  noise({ t, dur, gain: 0.22 * gain, type: 'lowpass', freq: 220, to: 900, q: 0.7, attack: dur * 0.55, send: 0.2 })
  noise({ t: t + dur * 0.3, dur: dur * 0.7, gain: 0.05 * gain, type: 'bandpass', freq: 1400, q: 0.6, attack: dur * 0.3, send: 0.2 })
}

const play =
  (fn) =>
  (...args) => {
    if (!audio()) return
    fn(...args)
  }

export const sfx = {
  // odhaczenie zadania — uderzenie w kowadło i iskry (krew: ciężej i niżej, złoto: jaśniej).
  // combo (1–5) podnosi ton i dokłada dźwięczenie, weight (0–1, z EXP zadania) dodaje mocy i iskier.
  seal: play((tier = 'blood', { combo = 1, weight = 0 } = {}) => {
    const up = 1 + 0.06 * (combo - 1)
    if (tier === 'gold') strike(0, { pitch: 900 * up, power: 0.85 + 0.3 * weight, ring: 1.6 })
    else strike(0, { pitch: 520 * up, power: 1.1 + 0.35 * weight, ring: 1.3 })
    sparks(0.01, 14 + Math.round(10 * weight) + 3 * (combo - 1), 0.5 + 0.2 * weight, 0.14)
    if (combo > 1) ting(0.07, 1600 * Math.pow(2, (2 * (combo - 1)) / 12), 0.05 + 0.01 * combo)
  }),

  // pełny dzień — krótki finał (dwa wznoszące uderzenia i iskry), wyraźnie krótszy niż awans
  dayComplete: play(() => {
    strike(0, { pitch: 660, power: 0.7, ring: 1.4 })
    strike(0.16, { pitch: 990, power: 0.8, ring: 1.9 })
    ting(0.18, 2640, 0.07)
    sparks(0.17, 26, 0.7, 0.13)
  }),

  // odznaczenie — głuche stuknięcie, jak młot o skórzany fartuch
  unseal: play(() => {
    tone({ freq: 190, to: 90, type: 'triangle', dur: 0.14, gain: 0.3, attack: 0.002, filter: 700, send: 0.1 })
    noise({ dur: 0.07, gain: 0.12, type: 'lowpass', freq: 900, attack: 0.002, send: 0.1 })
  }),

  // dodanie zadania — rytm kowala: dwa lżejsze uderzenia, jedno mocne i hartowanie
  forge: play(() => {
    strike(0, { pitch: 620, power: 0.55, ring: 0.5 })
    strike(0.19, { pitch: 620, power: 0.6, ring: 0.5 })
    strike(0.4, { pitch: 600, power: 1.05, ring: 1.4 })
    sparks(0.41, 18, 0.6)
    quench(0.75, 1.1)
  }),

  // usunięcie — upuszczony kawałek żelaza odbija się od kamiennej posadzki
  abandon: play(() => {
    strike(0, { pitch: 300, power: 0.6, ring: 0.5, send: 0.4 })
    strike(0.12, { pitch: 318, power: 0.35, ring: 0.4, send: 0.4 })
    strike(0.2, { pitch: 296, power: 0.18, ring: 0.3, send: 0.4 })
    tone({ freq: 62, to: 45, dur: 0.7, gain: 0.25, send: 0.2 })
  }),

  // nowy poziom — miech, potężne uderzenie, deszcz iskier, dwa wykończenia i para
  levelUp: play(() => {
    bellows(0, 0.85, 1.1)
    strike(0.75, { pitch: 420, power: 1.35, ring: 2.4, send: 0.5 })
    tone({ freq: 58, to: 30, t: 0.75, dur: 1.5, gain: 0.6, send: 0.2 })
    sparks(0.76, 40, 1.2, 0.14)
    strike(1.3, { pitch: 640, power: 0.7, ring: 1.8 })
    strike(1.62, { pitch: 860, power: 0.6, ring: 2.2 })
    quench(1.95, 1.4, 0.9)
  }),

  // osiągnięcie — trzy coraz wyższe uderzenia
  achievement: play(() => {
    strike(0, { pitch: 520, power: 0.55, ring: 1.5 })
    strike(0.17, { pitch: 660, power: 0.55, ring: 1.6 })
    strike(0.34, { pitch: 880, power: 0.7, ring: 2 })
    sparks(0.35, 22, 0.8)
  }),

  // drobne dźwięki interfejsu
  tick: play(() => ting(0, 2800 + Math.random() * 300, 0.075)),

  // zamknięcie okna — krótki podmuch miecha
  whoosh: play(() => bellows(0, 0.38, 0.6)),

  // zmiana zakładki — zgrzyt ostrza o osełkę
  page: play(() => {
    noise({ dur: 0.2, gain: 0.07, type: 'bandpass', freq: 1700, to: 2900, q: 4, attack: 0.03, send: 0.15 })
    noise({ dur: 0.16, gain: 0.03, type: 'highpass', freq: 6000, attack: 0.02, send: 0.1 })
  }),

  // zapis imienia/notatki — dwa stuknięcia dłutem
  quill: play(() => {
    ting(0, 2600, 0.06)
    ting(0.09, 3100, 0.05)
  }),
}

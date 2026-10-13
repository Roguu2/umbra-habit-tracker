// Kroki zadania. Postęp dnia to lista indeksów: state.steps[dzień][id zadania] = [0, 2].
// Indeksy (a nie identyfikatory) zostają, bo tak zapisują je też starsze wersje aplikacji na innych
// urządzeniach — zmiana kształtu quest.steps zepsułaby im synchronizację. Zamiast tego edytor przy zapisie
// podaje origin: dla każdego kroku po edycji jego dawny indeks albo null (nowy krok), a postęp
// przenosimy na nowe miejsca. Dzięki temu poprawka tekstu ani zmiana kolejności nie odhacza
// ani nie odznacza kroków.

export const STEP_MAX_LENGTH = 60

// wklejony tekst → osobne kroki (linia = krok), puste linie pomijamy
export const stepsFromText = (text) =>
  String(text)
    .split(/\r?\n/)
    .map((line) => line.trim().slice(0, STEP_MAX_LENGTH))
    .filter(Boolean)

// gdy edytor nie podał origin (starsze wywołania): kroki zostają na swoich indeksach
export const sameOrigin = (oldCount, newCount) => Array.from({ length: newCount }, (_, i) => (i < oldCount ? i : null))

// postęp kroków po edycji. fullyDone(dzień) — zadanie zaliczone tego dnia w pełnej wersji:
// wtedy wszystkie kroki (także dopisane) są odhaczone, bo zaliczone zadanie ma odhaczone wszystkie kroki
export function remapStepProgress(stepsByDay, questId, origin, fullyDone) {
  const out = {}
  for (const [key, day] of Object.entries(stepsByDay)) {
    const checked = day?.[questId]
    if (!checked) {
      out[key] = day
      continue
    }
    const next =
      fullyDone(key) && origin.length
        ? origin.map((_, i) => i)
        : origin.flatMap((from, i) => (from !== null && checked.includes(from) ? [i] : []))
    out[key] = { ...day, [questId]: next }
  }
  return out
}

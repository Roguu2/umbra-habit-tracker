// Deterministyczna "losowość": ten sam napis zawsze daje tę samą liczbę z [0, 1) — na każdym urządzeniu,
// w każdej strefie czasowej i po przeładowaniu. Używamy jej tam, gdzie wynik ma wynikać z historii
// (relikty, przepowiednia, zlecenie dnia), a nie z zapisanego losowania.

// FNV-1a (32 bity) z dodatkowym wymieszaniem bitów, żeby podobne napisy (kolejne daty) dawały odległe wyniki
export function hash01(text) {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return (h >>> 0) / 2 ** 32
}

// wybór elementu listy według hasha
export const pick = (list, text) => list[Math.floor(hash01(text) * list.length)]

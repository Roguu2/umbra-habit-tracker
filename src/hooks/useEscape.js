import { useEffect, useRef } from 'react'

// Escape zamyka okno. Rodzic zwykle przekazuje onClose jako nową funkcję przy każdym renderze,
// więc trzymamy najnowszą w ref — listener rejestruje się raz, a nie przy każdym renderze rodzica.
export function useEscape(onClose, active = true) {
  const latest = useRef(onClose)
  useEffect(() => {
    latest.current = onClose
  })

  useEffect(() => {
    if (!active) return
    const onKey = (e) => e.key === 'Escape' && latest.current()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])
}

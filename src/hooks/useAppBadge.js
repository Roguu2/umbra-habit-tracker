import { useEffect } from 'react'
import { questsLeft } from '../lib/schedule.js'

// Odznaka na ikonie zainstalowanej aplikacji: ile zadań zostało na dziś. Gdy aplikacja jest zamknięta,
// aktualizuje ją service worker z danych przypomnienia (public/sw.js).
export function useAppBadge(state, today) {
  const left = questsLeft(state, today).length
  useEffect(() => {
    if (!('setAppBadge' in navigator)) return
    ;(left > 0 ? navigator.setAppBadge(left) : navigator.clearAppBadge()).catch(() => {})
  }, [left])
}

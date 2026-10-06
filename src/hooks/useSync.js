import { useCallback, useEffect, useRef, useState } from 'react'
import { migrateState } from '../lib/game'
import { isValidCode, loadMeta, mergeStates, normalizeCode, same, saveMeta, syncApi } from '../lib/sync'

const POLL_MS = 20000
const PUSH_DELAY_MS = 800

// status: 'off' | 'syncing' | 'ok' | 'offline' | 'error'
export function useSync(state, setState) {
  const [meta, setMetaState] = useState(loadMeta)
  const [status, setStatus] = useState(() => (meta ? 'syncing' : 'off'))

  const metaRef = useRef(meta)
  const stateRef = useRef(state)
  stateRef.current = state
  const busy = useRef(false)
  const again = useRef(false)

  const setMeta = useCallback((m) => {
    metaRef.current = m
    saveMeta(m)
    setMetaState(m)
  }, [])

  // przyjęcie stanu z serwera; jeśli tu też były zmiany — scalenie
  const adopt = useCallback(
    (remote, local) => {
      const remoteState = migrateState(remote.state)
      const m = metaRef.current
      const merged = same(local, m.base) ? remoteState : mergeStates(m.base, local, remoteState)
      setMeta({ ...m, rev: remote.rev, base: remoteState })
      if (!same(merged, local)) {
        // zmiana stanu uruchomi wysyłkę scalonej wersji (efekt niżej)
        setState((cur) => (cur === local ? merged : mergeStates(local, cur, merged)))
      } else if (!same(merged, remoteState)) {
        again.current = true
      }
    },
    [setMeta, setState],
  )

  const syncOnce = useCallback(async () => {
    const m = metaRef.current
    const local = stateRef.current

    if (!same(local, m.base)) {
      const res = await syncApi.push(m.code, m.rev, local)
      if (res.status === 200) return setMeta({ ...m, rev: res.data.rev, base: local })
      if (res.status === 409) return adopt(res.data, local)
      if (res.status === 404) return setMeta(null)
      throw new Error(res.data.error ?? `HTTP ${res.status}`)
    }

    const res = await syncApi.pull(m.code)
    if (res.status === 404) return setMeta(null)
    if (res.status !== 200) throw new Error(res.data.error ?? `HTTP ${res.status}`)
    if (res.data.rev !== m.rev) adopt(res.data, local)
  }, [adopt, setMeta])

  const sync = useCallback(async () => {
    if (!metaRef.current) return
    if (busy.current) {
      again.current = true
      return
    }
    busy.current = true
    setStatus('syncing')
    try {
      do {
        again.current = false
        await syncOnce()
      } while (again.current && metaRef.current)
      setStatus(metaRef.current ? 'ok' : 'off')
    } catch {
      setStatus(navigator.onLine ? 'error' : 'offline')
    } finally {
      busy.current = false
    }
  }, [syncOnce])

  // wysyłka po każdej zmianie (z krótkim opóźnieniem, żeby seria kliknięć poszła jednym zapisem)
  useEffect(() => {
    if (!meta) return
    const id = setTimeout(sync, PUSH_DELAY_MS)
    return () => clearTimeout(id)
  }, [state, meta?.code, sync]) // eslint-disable-line react-hooks/exhaustive-deps

  // pobieranie zmian z innych urządzeń: co chwilę, po powrocie do karty i po odzyskaniu sieci
  useEffect(() => {
    if (!meta) return
    const onVisible = () => document.visibilityState === 'visible' && sync()
    const id = setInterval(() => document.visibilityState === 'visible' && sync(), POLL_MS)
    window.addEventListener('focus', sync)
    window.addEventListener('online', sync)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', sync)
      window.removeEventListener('online', sync)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [meta?.code, sync]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- akcje -------------------------------------------------------------------

  // pierwsze urządzenie: wysyła swoje dane i dostaje kod
  const createCode = useCallback(async () => {
    const local = stateRef.current
    setStatus('syncing')
    try {
      const res = await syncApi.create(local)
      if (res.status !== 201) throw new Error(res.data.error ?? `HTTP ${res.status}`)
      setMeta({ code: res.data.code, rev: res.data.rev, base: local })
      setStatus('ok')
      return null
    } catch {
      setStatus(navigator.onLine ? 'error' : 'offline')
      return 'Nie udało się połączyć z serwerem. Spróbuj ponownie.'
    }
  }, [setMeta])

  // kolejne urządzenie: dane z kodu zastępują lokalne
  const joinCode = useCallback(
    async (input) => {
      const code = normalizeCode(input)
      if (!isValidCode(code)) return 'Kod ma 12 znaków, np. ABCD-EFGH-JKLM.'
      setStatus('syncing')
      try {
        const res = await syncApi.pull(code)
        if (res.status === 404) {
          setStatus(metaRef.current ? 'ok' : 'off')
          return 'Nie ma takiego kodu. Sprawdź, czy przepisałeś go poprawnie.'
        }
        if (res.status !== 200) throw new Error(res.data.error ?? `HTTP ${res.status}`)
        const remoteState = migrateState(res.data.state)
        setMeta({ code, rev: res.data.rev, base: remoteState })
        setState(remoteState)
        setStatus('ok')
        return null
      } catch {
        setStatus(navigator.onLine ? 'error' : 'offline')
        return 'Nie udało się połączyć z serwerem. Spróbuj ponownie.'
      }
    },
    [setMeta, setState],
  )

  const disconnect = useCallback(() => {
    setMeta(null)
    setStatus('off')
  }, [setMeta])

  // aktualny kod bez czekania na ponowne renderowanie (np. zaraz po createCode)
  const getCode = useCallback(() => metaRef.current?.code ?? null, [])

  return { code: meta?.code ?? null, getCode, status, syncNow: sync, createCode, joinCode, disconnect }
}

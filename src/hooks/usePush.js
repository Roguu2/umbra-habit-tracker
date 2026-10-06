import { useCallback, useEffect, useRef, useState } from 'react'
import { getInstallPrompt, getSubscription, isStandalone, loadPrefs, onInstallPrompt, pushApi, pushSupport, savePrefs } from '../lib/push'

// Przypomnienia wymagają kodu synchronizacji — z niego serwer wie, co jest w planie i co już odhaczone.
export function usePush(sync) {
  const [prefs, setPrefsState] = useState(loadPrefs)
  const [permission, setPermission] = useState(() => ('Notification' in window ? Notification.permission : 'default'))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const support = pushSupport()

  const prefsRef = useRef(prefs)
  const setPrefs = useCallback((p) => {
    prefsRef.current = p
    savePrefs(p)
    setPrefsState(p)
  }, [])

  const run = useCallback(async (fn) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      return true
    } catch (err) {
      setError(err.message || 'Coś poszło nie tak. Spróbuj ponownie.')
      return false
    } finally {
      setBusy(false)
    }
  }, [])

  const register = useCallback(async (code, p) => {
    const sub = await getSubscription(true)
    await pushApi.save(code, sub, p)
  }, [])

  const enable = useCallback(
    () =>
      run(async () => {
        const result = await Notification.requestPermission()
        setPermission(result)
        if (result !== 'granted') throw new Error('Bez zgody na powiadomienia przypomnienia nie zadziałają.')
        if (!sync.getCode()) {
          const err = await sync.createCode()
          if (err) throw new Error(err)
        }
        const next = { ...prefsRef.current, enabled: true }
        await register(sync.getCode(), next)
        setPrefs(next)
      }),
    [run, sync, register, setPrefs],
  )

  const disable = useCallback(
    () =>
      run(async () => {
        const sub = await getSubscription()
        if (sub) {
          await pushApi.remove(sub.endpoint).catch(() => {})
          await sub.unsubscribe()
        }
        setPrefs({ ...prefsRef.current, enabled: false })
      }),
    [run, setPrefs],
  )

  const update = useCallback(
    (patch) => {
      const next = { ...prefsRef.current, ...patch }
      setPrefs(next)
      if (next.enabled && sync.getCode()) run(() => register(sync.getCode(), next))
    },
    [run, sync, register, setPrefs],
  )

  const test = useCallback(
    () =>
      run(async () => {
        const sub = await getSubscription()
        if (!sub) throw new Error('Przypomnienia nie są włączone na tym urządzeniu.')
        await pushApi.test(sub.endpoint)
      }),
    [run],
  )

  // zmiana kodu synchronizacji przenosi przypomnienia; odłączenie — wyłącza je
  const lastCode = useRef(sync.code)
  useEffect(() => {
    if (lastCode.current === sync.code) return
    lastCode.current = sync.code
    if (!prefsRef.current.enabled) return
    if (sync.code) run(() => register(sync.code, prefsRef.current))
    else disable()
  }, [sync.code, run, register, disable])

  // po starcie odświeżamy subskrypcję (przeglądarka mogła ją wymienić)
  useEffect(() => {
    if (support !== 'ok' || !prefsRef.current.enabled || !sync.code || Notification.permission !== 'granted') return
    register(sync.code, prefsRef.current).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // --- instalacja aplikacji ---
  const [installEvent, setInstallEvent] = useState(getInstallPrompt)
  const [installed, setInstalled] = useState(isStandalone)
  useEffect(
    () =>
      onInstallPrompt((e) => {
        setInstallEvent(e)
        if (!e) setInstalled(true)
      }),
    [],
  )
  const install = useCallback(async () => {
    if (!installEvent) return
    installEvent.prompt()
    const { outcome } = await installEvent.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setInstallEvent(null)
  }, [installEvent])

  return {
    support,
    permission,
    prefs,
    busy,
    error,
    enable,
    disable,
    update,
    test,
    canInstall: Boolean(installEvent),
    installed,
    install,
  }
}

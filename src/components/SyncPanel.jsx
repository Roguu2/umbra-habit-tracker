import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import QrCode from './QrCode'
import { formatCode, shareLink } from '../lib/sync'
import { sfx } from '../lib/sfx'

const STATUS = {
  off: { label: 'Tylko to urządzenie', color: 'rgba(255,255,255,0.3)' },
  syncing: { label: 'Synchronizuję…', color: '#e2b45a' },
  ok: { label: 'Zsynchronizowano', color: '#5fd38a' },
  offline: { label: 'Brak sieci — wyślę zmiany później', color: '#e2b45a' },
  error: { label: 'Błąd połączenia — ponowię', color: '#ff4259' },
}

function StatusDot({ status }) {
  const s = STATUS[status]
  return (
    <span className="relative flex size-2">
      {status === 'syncing' && <span className="absolute inset-0 animate-ping rounded-full opacity-60" style={{ background: s.color }} />}
      <span className="relative size-2 rounded-full" style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
    </span>
  )
}

// przycisk w rogu ekranu
export function SyncButton({ status, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={() => {
        sfx.page()
        onClick()
      }}
      aria-label={`Synchronizacja: ${STATUS[status].label}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.6 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      className="hud-cut-sm flex cursor-pointer items-center gap-2.5 bg-[#0b0a0d]/80 px-3.5 py-2.5 ring-1 ring-white/10 backdrop-blur-xl"
    >
      <svg viewBox="0 0 16 16" className="size-4" aria-hidden fill="none" stroke={status === 'off' ? 'rgba(255,255,255,0.35)' : '#e2b45a'} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 6.5A5 5 0 0 0 3.6 5M3 9.5a5 5 0 0 0 9.4 1.5" />
        <path d="M13.2 3v3.5H9.7M2.8 13V9.5h3.5" />
      </svg>
      <StatusDot status={status} />
      <span className="font-display text-[10px] tracking-[0.3em] text-white/45 uppercase">Sync</span>
    </motion.button>
  )
}

export default function SyncPanel({ open, sync, initialCode, onClose }) {
  return <AnimatePresence>{open && <PanelBody sync={sync} initialCode={initialCode} onClose={onClose} />}</AnimatePresence>
}

function PanelBody({ sync, initialCode, onClose }) {
  const [input, setInput] = useState(initialCode ?? '')
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)
  const [copied, setCopied] = useState(null)
  const [confirmLeave, setConfirmLeave] = useState(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const run = async (action) => {
    setPending(true)
    setError(null)
    const err = await action()
    setPending(false)
    if (err) {
      sfx.abandon()
      setError(err)
    } else {
      sfx.forge()
      setInput('')
    }
  }

  const copy = async (what, text) => {
    try {
      await navigator.clipboard.writeText(text)
      sfx.tick()
      setCopied(what)
      setTimeout(() => setCopied(null), 1800)
    } catch {
      setError('Nie udało się skopiować — przepisz kod ręcznie.')
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-end overflow-y-auto sm:place-items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Synchronizacja"
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className="relative w-full max-w-lg"
      >
        <div className="hud-cut absolute inset-0 bg-gradient-to-b from-gold/40 via-white/[0.06] to-blood/40" />
        <div className="hud-cut absolute inset-px bg-[#0b0a0d]/95 backdrop-blur-2xl" />

        <div className="relative space-y-6 p-6 sm:p-7">
          <header className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold tracking-[0.3em] text-stone-200 uppercase">Synchronizacja</h2>
            <button type="button" onClick={onClose} aria-label="Zamknij" className="cursor-pointer px-2 text-white/40 hover:text-white">
              ✕
            </button>
          </header>

          <div className="flex items-center gap-2.5 text-xs text-white/55">
            <StatusDot status={sync.status} />
            {STATUS[sync.status].label}
          </div>

          {sync.code ? (
            <>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative shrink-0 self-center p-1.5 ring-1 ring-gold/40 sm:self-auto">
                  <QrCode text={shareLink(sync.code)} className="block size-44 sm:size-40" />
                </div>
                <div>
                  <p className="mb-2 text-[10px] tracking-[0.3em] text-white/40 uppercase">Twój kod</p>
                  <p className="font-display text-2xl font-bold tracking-[0.15em] text-gold-bright tabular-nums">{formatCode(sync.code)}</p>
                  <p className="mt-3 font-lore text-base text-white/50 italic">
                    Zeskanuj kod QR aparatem telefonu albo wpisz kod na drugim urządzeniu — plany, postęp i EXP będą wszędzie te same.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <GhostButton onClick={() => copy('code', formatCode(sync.code))}>{copied === 'code' ? 'Skopiowano ✓' : 'Kopiuj kod'}</GhostButton>
                <GhostButton onClick={() => copy('link', shareLink(sync.code))}>{copied === 'link' ? 'Skopiowano ✓' : 'Kopiuj link'}</GhostButton>
                <GhostButton onClick={sync.syncNow}>Synchronizuj teraz</GhostButton>
              </div>

              <p className="text-[11px] leading-relaxed text-white/35">
                Kod działa jak hasło — każdy, kto go zna, widzi i może zmieniać Twoje dane. Nie udostępniaj go innym.
              </p>

              <footer className="flex justify-start pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!confirmLeave) {
                      sfx.tick()
                      setConfirmLeave(true)
                      setTimeout(() => setConfirmLeave(false), 4000)
                      return
                    }
                    sfx.abandon()
                    sync.disconnect()
                    setConfirmLeave(false)
                  }}
                  className="cursor-pointer text-[11px] tracking-[0.2em] text-blood-bright/70 uppercase hover:text-blood-bright"
                >
                  {confirmLeave ? 'Na pewno odłączyć? (dane zostaną na tym urządzeniu)' : 'Odłącz to urządzenie'}
                </button>
              </footer>
            </>
          ) : (
            <>
              <p className="font-lore text-base text-white/55 italic">
                Połącz komputer i telefon — plany, odhaczone zadania, poziom i osiągnięcia będą wszędzie takie same.
              </p>

              <section>
                <p className="mb-2 text-[10px] tracking-[0.3em] text-white/40 uppercase">To pierwsze urządzenie</p>
                <motion.button
                  type="button"
                  disabled={pending}
                  onClick={() => run(sync.createCode)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="hud-cut-sm cursor-pointer bg-gradient-to-r from-blood-deep via-blood to-blood-deep px-6 py-3 font-display text-xs font-bold tracking-[0.3em] text-stone-100 uppercase shadow-[0_0_24px_rgba(195,20,47,0.35)] disabled:cursor-wait disabled:opacity-50"
                >
                  Utwórz kod
                </motion.button>
              </section>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  run(() => sync.joinCode(input))
                }}
              >
                <p className="mb-2 text-[10px] tracking-[0.3em] text-white/40 uppercase">Masz już kod z innego urządzenia?</p>
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value.toUpperCase())}
                    placeholder="ABCD-EFGH-JKLM"
                    maxLength={16}
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="Kod synchronizacji"
                    className="min-w-0 flex-1 border-b border-white/15 bg-transparent pb-2 font-display text-lg tracking-[0.15em] text-stone-100 outline-none transition-colors placeholder:text-white/20 focus:border-gold/70"
                  />
                  <GhostButton type="submit" disabled={pending || !input.trim()}>
                    Połącz
                  </GhostButton>
                </div>
                <p className="mt-2 text-[11px] text-white/35">Dane z tego urządzenia zostaną zastąpione danymi z kodu.</p>
              </form>
            </>
          )}

          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm text-blood-bright">
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function GhostButton({ children, type = 'button', ...props }) {
  return (
    <button
      type={type}
      {...props}
      className="cursor-pointer border border-white/15 bg-black/30 px-3.5 py-2 text-[11px] tracking-[0.2em] text-white/70 uppercase transition-colors hover:border-gold/60 hover:text-gold-bright disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  )
}

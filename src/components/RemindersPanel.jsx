import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Segmented } from './ui'
import { GhostButton } from './SyncPanel'
import { isIOS } from '../lib/push'
import { sfx } from '../lib/sfx'
import { t } from '../lib/i18n'

// przycisk w rogu ekranu
export function ReminderButton({ enabled, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={() => {
        sfx.page()
        onClick()
      }}
      aria-label={enabled ? t('Przypomnienia: włączone', 'Reminders: on') : t('Przypomnienia i aplikacja', 'Reminders and app')}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.6 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      className="hud-cut-sm relative flex cursor-pointer items-center bg-[#0b0a0d]/80 px-3.5 py-2.5 ring-1 ring-white/10 backdrop-blur-xl"
    >
      <svg viewBox="0 0 16 16" className="size-4" aria-hidden fill="none" stroke={enabled ? '#e2b45a' : 'rgba(255,255,255,0.4)'} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 11.5V7a4 4 0 0 1 8 0v4.5l1 1.5H3Z" />
        <path d="M6.5 14.5a1.6 1.6 0 0 0 3 0" />
      </svg>
      {enabled && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-gold-bright shadow-[0_0_6px_#e2b45a]" />}
    </motion.button>
  )
}

export default function RemindersPanel({ open, push, hasCode, onClose }) {
  return <AnimatePresence>{open && <PanelBody push={push} hasCode={hasCode} onClose={onClose} />}</AnimatePresence>
}

function PanelBody({ push, hasCode, onClose }) {
  const [tested, setTested] = useState(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const toggle = async () => {
    const ok = await (push.prefs.enabled ? push.disable() : push.enable())
    if (ok) push.prefs.enabled ? sfx.abandon() : sfx.forge()
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
        aria-label={t('Aplikacja i przypomnienia', 'App and reminders')}
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className="relative w-full max-w-lg"
      >
        <div className="hud-cut absolute inset-0 bg-gradient-to-b from-gold/40 via-white/[0.06] to-blood/40" />
        <div className="hud-cut absolute inset-px bg-[#0b0a0d]/95 backdrop-blur-2xl" />

        <div className="relative space-y-7 p-6 sm:p-7">
          <header className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold tracking-[0.3em] text-stone-200 uppercase">{t('Aplikacja i przypomnienia', 'App and reminders')}</h2>
            <button type="button" onClick={onClose} aria-label={t('Zamknij', 'Close')} className="cursor-pointer px-2 text-white/40 hover:text-white">
              ✕
            </button>
          </header>

          <Section label={t('Aplikacja na ekranie głównym', 'App on the Home Screen')}>
            {push.installed ? (
              <p className="text-sm text-white/60">
                <span className="text-gold-bright">✓</span> {t('Umbra działa tu jako aplikacja.', 'Umbra runs here as an app.')}
              </p>
            ) : push.canInstall ? (
              <div className="space-y-2">
                <GhostButton onClick={push.install}>{t('Zainstaluj na tym urządzeniu', 'Install on this device')}</GhostButton>
                <Hint>{t('Własna ikona, pełny ekran, działa też bez internetu.', 'Its own icon, full screen, works offline too.')}</Hint>
              </div>
            ) : isIOS() ? (
              <Hint>
                {t('W Safari stuknij', 'In Safari, tap')} <b className="text-white/70">{t('Udostępnij', 'Share')}</b> {t('(kwadrat ze strzałką), potem', '(the square with an arrow), then')}{' '}
                <b className="text-white/70">{t('Do ekranu początkowego', 'Add to Home Screen')}</b>.
              </Hint>
            ) : (
              <Hint>
                {t('W menu przeglądarki wybierz', 'In the browser menu, choose')} <b className="text-white/70">{t('Zainstaluj aplikację', 'Install app')}</b> {t('lub', 'or')}{' '}
                <b className="text-white/70">{t('Dodaj do ekranu głównego', 'Add to Home Screen')}</b>.
              </Hint>
            )}
          </Section>

          <Section label={t('Przypomnienia', 'Reminders')}>
            {push.support === 'ios-install' ? (
              <Hint>
                {t(
                  'Na iPhonie przypomnienia działają w zainstalowanej aplikacji (iOS 16.4 lub nowszy). Zainstaluj ją, otwórz z ikony i wróć tutaj.',
                  'On iPhone, reminders work in the installed app (iOS 16.4 or later). Install it, open it from the icon and come back here.',
                )}
              </Hint>
            ) : push.support === 'unsupported' ? (
              <Hint>{t('Ta przeglądarka nie obsługuje powiadomień push.', 'This browser does not support push notifications.')}</Hint>
            ) : push.permission === 'denied' ? (
              <Hint>
                {t(
                  'Powiadomienia są zablokowane dla tej strony. Odblokuj je w ustawieniach przeglądarki (ikona kłódki przy adresie) i wróć tutaj.',
                  'Notifications are blocked for this site. Unblock them in your browser settings (the padlock icon by the address) and come back here.',
                )}
              </Hint>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <motion.button
                    type="button"
                    disabled={push.busy}
                    onClick={toggle}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`hud-cut-sm cursor-pointer px-6 py-3 font-display text-xs font-bold tracking-[0.3em] uppercase disabled:cursor-wait disabled:opacity-50 ${
                      push.prefs.enabled
                        ? 'bg-black/40 text-white/60 ring-1 ring-white/15'
                        : 'bg-gradient-to-r from-blood-deep via-blood to-blood-deep text-stone-100 shadow-[0_0_24px_rgba(195,20,47,0.35)]'
                    }`}
                  >
                    {push.prefs.enabled ? t('Wyłącz', 'Turn off') : t('Włącz przypomnienia', 'Turn on reminders')}
                  </motion.button>
                  {push.prefs.enabled && (
                    <GhostButton
                      disabled={push.busy}
                      onClick={async () => {
                        if (await push.test()) {
                          sfx.tick()
                          setTested(true)
                        }
                      }}
                    >
                      {tested ? t('Wysłano ✓', 'Sent ✓') : t('Wyślij testowe', 'Send a test')}
                    </GhostButton>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-[11px] text-white/45">{t('Przed zadaniem z godziną', 'Before a timed quest')}</p>
                  <Segmented
                    id="push-lead"
                    size="sm"
                    value={push.prefs.lead}
                    onChange={(lead) => push.update({ lead })}
                    options={[
                      { value: 0, label: t('O czasie', 'On time') },
                      { value: 5, label: '5 min' },
                      { value: 15, label: '15 min' },
                      { value: 30, label: '30 min' },
                    ]}
                  />
                </div>

                <div>
                  <p className="mb-2 text-[11px] text-white/45">{t('Wieczorem, gdy zostały zadania', 'In the evening, if quests remain')}</p>
                  <Segmented
                    id="push-evening"
                    size="sm"
                    value={push.prefs.evening ?? 'off'}
                    onChange={(v) => push.update({ evening: v === 'off' ? null : v })}
                    options={[
                      { value: 'off', label: t('Wył.', 'Off') },
                      { value: '19:00', label: '19:00' },
                      { value: '20:00', label: '20:00' },
                      { value: '21:00', label: '21:00' },
                      { value: '22:00', label: '22:00' },
                    ]}
                  />
                </div>

                <Hint>
                  {t(
                    'Przychodzą także przy zamkniętej stronie. Dotyczą zadań z ustawioną godziną; odhaczone wcześniej zadania nie są przypominane.',
                    "They arrive even when the page is closed. They apply to quests with a set time; quests you've already completed won't trigger a reminder.",
                  )}
                  {!hasCode && t(' Włączenie utworzy kod synchronizacji — dzięki niemu serwer wie, co masz w planie.', ' Turning them on creates a sync code — it lets the server know what you have planned.')}
                </Hint>
              </div>
            )}

            <AnimatePresence>
              {push.error && (
                <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 text-sm text-blood-bright">
                  {push.error}
                </motion.p>
              )}
            </AnimatePresence>
          </Section>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Section({ label, children }) {
  return (
    <section>
      <p className="mb-3 text-[10px] tracking-[0.3em] text-white/40 uppercase">{label}</p>
      {children}
    </section>
  )
}

const Hint = ({ children }) => <p className="text-[12px] leading-relaxed text-white/45">{children}</p>

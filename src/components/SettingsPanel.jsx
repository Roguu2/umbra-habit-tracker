import { useRef, useState } from 'react'
import Modal, { Button, Hint, Section } from './Modal'
import { Segmented } from './ui'
import { exportBackup, readBackup } from '../lib/backup'
import { formatDay } from '../lib/game'
import { lang, setLang, t } from '../lib/i18n'
import { isMuted, setMuted, sfx } from '../lib/sfx'
import { isPaused } from '../lib/stats'

// Jedno miejsce na wszystkie ustawienia: postać, język, dane, synchronizacja, pomoc.
export default function SettingsPanel({ open, onClose, ...props }) {
  return (
    <Modal open={open} title={t('Ustawienia', 'Settings')} onClose={onClose}>
      <SettingsBody onClose={onClose} {...props} />
    </Modal>
  )
}

function SettingsBody({ game, sync, push, onClose, onOpen }) {
  const { state, actions } = game
  const [name, setName] = useState(state.profile.name)
  const [muted, setMutedState] = useState(isMuted)
  const [pending, setPending] = useState(null) // kopia wczytana z pliku, czeka na potwierdzenie
  const [fileError, setFileError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const fileRef = useRef(null)

  const go = (panel) => {
    sfx.page()
    onClose()
    onOpen(panel)
  }

  const saveName = () => {
    const clean = name.trim()
    if (clean && clean !== state.profile.name) actions.renameHero(clean.slice(0, 24))
    else setName(state.profile.name)
  }

  const pickFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setFileError(null)
    const result = await readBackup(file)
    if (result.error) setFileError(result.error)
    else setPending(result)
  }

  const deleteAll = async () => {
    if (!confirmDelete) {
      sfx.tick()
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 5000)
      return
    }
    setDeleting(true)
    if (push.prefs.enabled) await push.disable()
    await sync.deleteRemote()
    actions.reset()
    sfx.abandon()
    setDeleting(false)
    onClose()
  }

  return (
    <div className="space-y-7">
      <Section label={t('Postać', 'Character')}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          maxLength={24}
          aria-label={t('Imię postaci', 'Character name')}
          className="w-full border-b border-white/15 bg-transparent pb-2 font-display text-lg text-stone-100 outline-none focus:border-gold/60"
        />
      </Section>

      <Section label={t('Język i dźwięk', 'Language & sound')}>
        <div className="flex flex-wrap gap-3">
          <Segmented
            id="settings-lang"
            size="sm"
            value={lang()}
            onChange={(l) => setLang(l)}
            options={[
              { value: 'pl', label: 'Polski' },
              { value: 'en', label: 'English' },
            ]}
          />
          <Segmented
            id="settings-sound"
            size="sm"
            value={muted ? 'off' : 'on'}
            onChange={(v) => {
              setMuted(v === 'off')
              setMutedState(v === 'off')
              if (v === 'on') sfx.tick()
            }}
            options={[
              { value: 'on', label: t('Dźwięk', 'Sound') },
              { value: 'off', label: t('Cisza', 'Muted') },
            ]}
          />
        </div>
      </Section>

      <Section label={t('Tryb urlopu', 'Vacation mode')}>
        <div className="space-y-2">
          <Segmented
            id="settings-vacation"
            size="sm"
            value={isPaused(state, game.today) ? 'on' : 'off'}
            onChange={(v) => {
              sfx.page()
              actions.setVacation(v === 'on')
            }}
            options={[
              { value: 'off', label: t('Wyłączony', 'Off') },
              { value: 'on', label: t('Na urlopie', 'On vacation') },
            ]}
          />
          <Hint>
            {t(
              'Choroba, wyjazd, trudny tydzień? Dni urlopu nie przerywają passy ani serii i nie przychodzą wtedy przypomnienia.',
              "Sick, travelling, rough week? Vacation days won't break your streaks, and reminders stay silent.",
            )}
          </Hint>
        </div>
      </Section>

      <Section label={t('Urządzenia', 'Devices')}>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => go('sync')}>{sync.code ? t('Synchronizacja ✓', 'Sync ✓') : t('Synchronizacja', 'Sync')}</Button>
          <Button onClick={() => go('reminders')}>
            {push.prefs.enabled ? t('Przypomnienia ✓', 'Reminders ✓') : t('Aplikacja i przypomnienia', 'App & reminders')}
          </Button>
        </div>
      </Section>

      <Section label={t('Kopia zapasowa', 'Backup')}>
        {pending ? (
          <div className="space-y-3 border-l-2 border-gold/50 pl-3">
            <p className="text-[13px] text-white/70">
              {t('Wczytać kopię z', 'Restore the backup from')}{' '}
              <b className="text-stone-100">
                {pending.exportedAt ? formatDay(pending.exportedAt.slice(0, 10), { day: 'numeric', month: 'long', year: 'numeric' }) : '?'}
              </b>
              ? {t('Obecne dane zostaną zastąpione', 'Your current data will be replaced')}
              {sync.code && t(' — także na połączonych urządzeniach', ' — on connected devices too')}.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  actions.importState(pending.state)
                  sfx.forge()
                  setPending(null)
                  onClose()
                }}
              >
                {t('Wczytaj', 'Restore')}
              </Button>
              <Button onClick={() => setPending(null)}>{t('Anuluj', 'Cancel')}</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  sfx.tick()
                  exportBackup(state)
                }}
              >
                {t('Eksportuj do pliku', 'Export to file')}
              </Button>
              <Button onClick={() => fileRef.current?.click()}>{t('Wczytaj z pliku', 'Import from file')}</Button>
              <input ref={fileRef} type="file" accept="application/json,.json" onChange={pickFile} hidden />
            </div>
            <Hint>
              {t(
                'Plik zawiera cały plan i historię. Zrób kopię co jakiś czas — przyda się, gdy zmienisz telefon lub wyczyścisz przeglądarkę.',
                'The file holds your whole plan and history. Make one now and then — handy when you change phones or clear your browser.',
              )}
            </Hint>
            {fileError && <p className="text-sm text-blood-bright">{fileError}</p>}
          </div>
        )}
      </Section>

      <Section label={t('Pomoc', 'Help')}>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => go('tour')}>{t('Poradnik', 'Guide')}</Button>
          <Button onClick={() => go('feedback')}>{t('Zgłoś problem lub pomysł', 'Report a problem or idea')}</Button>
          <Button onClick={() => go('legal')}>{t('Prywatność i regulamin', 'Privacy & terms')}</Button>
        </div>
      </Section>

      <Section label={t('Strefa niebezpieczna', 'Danger zone')}>
        <Button danger disabled={deleting} onClick={deleteAll}>
          {confirmDelete ? t('Kliknij ponownie — tego nie da się cofnąć', 'Click again — this cannot be undone') : t('Usuń wszystkie dane', 'Delete all data')}
        </Button>
        <div className="mt-2">
          <Hint>
            {sync.code
              ? t(
                  'Usuwa plan, historię i postęp z tego urządzenia oraz z serwera, odłącza synchronizację i wyłącza przypomnienia.',
                  'Deletes your plan, history and progress from this device and the server, disconnects sync and turns off reminders.',
                )
              : t('Usuwa plan, historię i postęp z tego urządzenia.', 'Deletes your plan, history and progress from this device.')}
          </Hint>
        </div>
      </Section>
    </div>
  )
}

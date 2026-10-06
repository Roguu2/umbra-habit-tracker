// --- Kopia zapasowa: eksport i import danych do pliku JSON ---------------------

import { dayKey, migrateState } from './game'
import { t } from './i18n.js'

const APP = 'umbra-habit-tracker'

export function exportBackup(state) {
  const data = { app: APP, exportedAt: new Date().toISOString(), state }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `umbra-${dayKey()}.json`
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// zwraca { state } albo { error }
export async function readBackup(file) {
  if (file.size > 5_000_000) return { error: t('Plik jest za duży.', 'The file is too large.') }
  try {
    const data = JSON.parse(await file.text())
    const raw = data?.app === APP ? data.state : null
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.quests) || typeof raw.history !== 'object') {
      return { error: t('To nie jest kopia zapasowa Umbry.', 'This is not an Umbra backup.') }
    }
    return { state: migrateState(raw), exportedAt: data.exportedAt }
  } catch {
    return { error: t('Nie udało się odczytać pliku.', 'Could not read the file.') }
  }
}

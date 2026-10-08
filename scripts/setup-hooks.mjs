// Włącza hooki gita z katalogu .githooks — npm uruchamia to samo po `npm install` (skrypt "prepare").
// Poza repozytorium gita (np. na serwerze budującym bez historii) po prostu nic nie robi.
import { execSync } from 'node:child_process'

try {
  execSync('git config core.hooksPath .githooks', { stdio: 'ignore' })
} catch {
  // brak gita albo repozytorium — hooki nie są potrzebne
}

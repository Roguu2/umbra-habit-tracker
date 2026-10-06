import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// czcionki z własnego serwera (bez Google Fonts — prywatność i działanie offline).
import '@fontsource/cinzel/500.css'
import '@fontsource/cinzel/700.css'
import '@fontsource/cinzel/900.css'
import '@fontsource/cormorant-garamond/500-italic.css'
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import './index.css'
import App from './App.jsx'
import { detectLite } from './lib/perf'
import { t } from './lib/i18n'
import { captureInstallPrompt, registerServiceWorker } from './lib/push'

if (detectLite()) document.documentElement.dataset.lite = ''
document.title = t('Umbra · Księga Nawyków', 'Umbra · The Book of Habits')
captureInstallPrompt()
registerServiceWorker()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

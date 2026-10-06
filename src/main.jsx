import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { detectLite } from './lib/perf'
import { captureInstallPrompt, registerServiceWorker } from './lib/push'

if (detectLite()) document.documentElement.dataset.lite = ''
captureInstallPrompt()
registerServiceWorker()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { useMemo } from 'react'
import qrcode from 'qrcode-generator'
import { t } from '../lib/i18n'

// Kod QR jako SVG: ciemne moduły na jasnym tle (odwrócone kolory część aparatów odczytuje źle)
// z marginesem 4 modułów, którego wymaga specyfikacja.
const QUIET = 4

export default function QrCode({ text, className = '' }) {
  const { size, path } = useMemo(() => {
    const qr = qrcode(0, 'M')
    qr.addData(text)
    qr.make()
    const n = qr.getModuleCount()
    let d = ''
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) if (qr.isDark(row, col)) d += `M${col + QUIET} ${row + QUIET}h1v1h-1z`
    }
    return { size: n + QUIET * 2, path: d }
  }, [text])

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} role="img" aria-label={t('Kod QR do połączenia urządzenia', 'QR code to connect a device')} shapeRendering="crispEdges">
      <rect width={size} height={size} fill="#f3ead6" />
      <path d={path} fill="#0b0a0d" />
    </svg>
  )
}

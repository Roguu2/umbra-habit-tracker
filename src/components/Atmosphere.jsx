import { useEffect, useMemo, useState } from 'react'
import { AURAS, DEFAULT_AURA } from '../lib/rewards'

// Profil rozmytego koła (koło o promieniu R splecione z rozkładem Gaussa o odchyleniu sigma — dokładnie to,
// co robi CSS `filter: blur(sigma)`), policzony raz i zapisany jako gradient radialny.
// Wygląda tak samo jak rozmyty element, ale przeglądarka nie musi co klatkę liczyć filtra.
function blurredDisc(R, sigma, rgb, alpha, samples = 16) {
  const outer = R + 3 * sigma
  const step = R / 30
  const points = []
  for (let x = -R; x <= R; x += step) for (let y = -R; y <= R; y += step) if (x * x + y * y <= R * R) points.push([x, y])
  const norm = (step * step) / (2 * Math.PI * sigma * sigma)
  const stops = Array.from({ length: samples + 1 }, (_, i) => {
    const d = (outer * i) / samples
    let sum = 0
    for (const [x, y] of points) sum += Math.exp(-((x - d) ** 2 + y * y) / (2 * sigma * sigma))
    return `rgba(${rgb},${(alpha * Math.min(1, sum * norm)).toFixed(4)}) ${((i / samples) * 100).toFixed(1)}%`
  })
  return { outer, background: `radial-gradient(closest-side, ${stops.join(', ')})` }
}

function useViewport() {
  const read = () => ({ w: window.innerWidth, h: window.innerHeight })
  const [size, setSize] = useState(read)
  useEffect(() => {
    let id
    const onResize = () => {
      clearTimeout(id)
      id = setTimeout(() => setSize(read()), 150)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

// Tło: głęboka czerń, dryfujące poświaty, ziarno i unoszące się żarzące drobiny.
// Wszystkie animacje są w CSS (index.css), więc nie obciążają głównego wątku.
// Kolory pochodzą z aury (lib/rewards.js) — zmiana aury przemalowuje tło bez przeskoku drobin.
export default function Atmosphere({ aura = DEFAULT_AURA }) {
  const { w, h } = useViewport()
  const palette = AURAS[aura] ?? AURAS[DEFAULT_AURA]
  const [[rgbA, alphaA], [rgbB, alphaB]] = palette.glow

  // poświaty: pierwsza 70vw (blur 140px), druga 55vw (blur 160px)
  const glows = useMemo(() => {
    const a = blurredDisc(0.35 * w, 140, rgbA, alphaA)
    const b = blurredDisc(0.275 * w, 160, rgbB, alphaB)
    return [
      { ...a, cls: 'drift-a', left: 0.15 * w - a.outer, top: 0.35 * h + 0.35 * w - a.outer },
      { ...b, cls: 'drift-b', right: 0.125 * w - b.outer, top: -0.2 * h + 0.275 * w - b.outer },
    ]
  }, [w, h, rgbA, alphaA, rgbB, alphaB])

  const embers = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 1 + Math.random() * 2.5,
        duration: 12 + Math.random() * 16,
        delay: Math.random() * 18,
        drift: (Math.random() - 0.5) * 120,
        tone: Math.random(), // poniżej palette.share → drugi kolor aury
      })),
    [],
  )

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {glows.map((g) => (
        <div
          key={g.cls}
          className={`${g.cls} absolute`}
          style={{ left: g.left, right: g.right, top: g.top, width: g.outer * 2, height: g.outer * 2, background: g.background }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.85)_100%)]" />
      <div className="grain absolute inset-0 opacity-[0.07] mix-blend-overlay" />

      {embers.map((e) => {
        const [color, shadow] = palette.embers[e.tone < palette.share ? 1 : 0]
        return (
          <span
            key={e.id}
            className="ember absolute -bottom-4 rounded-full"
            style={{
              left: `${e.left}%`,
              width: e.size,
              height: e.size,
              background: color,
              boxShadow: `0 0 ${e.size * 4}px ${shadow}`,
              '--drift': `${e.drift}px`,
              '--dur': `${e.duration}s`,
              '--delay': `${e.delay}s`,
            }}
          />
        )
      })}
    </div>
  )
}

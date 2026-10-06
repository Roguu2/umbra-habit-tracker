// Bez akceleracji sprzętowej przeglądarka rysuje wszystko na procesorze — wtedy włączamy tryb "lite",
// który wyłącza tylko najdroższe efekty (rozmycie tła pod panelami, rozmycie w animacjach wejścia,
// mieszanie warstwy ziarna). Adres z ?lite=1 / ?lite=0 wymusza tryb ręcznie.
export function detectLite() {
  const forced = new URLSearchParams(location.search).get('lite')
  if (forced !== null) return forced !== '0'
  try {
    // failIfMajorPerformanceCaveat: przy renderowaniu programowym kontekst nie powstaje
    const gl = document.createElement('canvas').getContext('webgl', { failIfMajorPerformanceCaveat: true })
    if (!gl) return true
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : ''
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer)
  } catch {
    return false
  }
}

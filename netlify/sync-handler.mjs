// Wspólna logika API synchronizacji (/api/sync).
// Na Netlify działa jako funkcja z Netlify Blobs, lokalnie obsługuje ją serwer Vite (patrz vite.config.js).
//
// POST            { state }          → nowy kod, { code, rev }
// GET  ?code=X                       → { rev, state }
// PUT  ?code=X    { baseRev, state } → { rev }, albo 409 z aktualnym { rev, state }, gdy ktoś zapisał wcześniej

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ' // bez 0/O i 1/I, łatwiej przepisać z ekranu
const CODE_RE = /^[2-9A-HJ-NP-Z]{12}$/
const MAX_BYTES = 1_000_000

const normalizeCode = (raw) => String(raw ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '')

function newCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

async function readBody(req) {
  const text = await req.text()
  if (text.length > MAX_BYTES) return null
  try {
    const body = JSON.parse(text)
    return body && typeof body.state === 'object' && body.state !== null ? body : null
  } catch {
    return null
  }
}

const doc = (rev, state) => ({ rev, state, updatedAt: new Date().toISOString() })

export function createSyncHandler(getStore) {
  return async (req) => {
    try {
      const store = getStore()

      if (req.method === 'POST') {
        const body = await readBody(req)
        if (!body) return json(400, { error: 'Nieprawidłowe dane' })
        for (let i = 0; i < 5; i++) {
          const code = newCode()
          const { modified } = await store.setJSON(code, doc(1, body.state), { onlyIfNew: true })
          if (modified) return json(201, { code, rev: 1 })
        }
        return json(500, { error: 'Nie udało się utworzyć kodu' })
      }

      const code = normalizeCode(new URL(req.url).searchParams.get('code'))
      if (!CODE_RE.test(code)) return json(400, { error: 'Nieprawidłowy kod' })

      const entry = await store.getWithMetadata(code, { type: 'json' })
      if (!entry) return json(404, { error: 'Nie ma takiego kodu' })

      if (req.method === 'GET') return json(200, { rev: entry.data.rev, state: entry.data.state })

      if (req.method === 'PUT') {
        const body = await readBody(req)
        if (!body || !Number.isInteger(body.baseRev)) return json(400, { error: 'Nieprawidłowe dane' })
        if (body.baseRev !== entry.data.rev) return json(409, { rev: entry.data.rev, state: entry.data.state })

        const rev = entry.data.rev + 1
        const { modified } = await store.setJSON(code, doc(rev, body.state), { onlyIfMatch: entry.etag })
        if (!modified) {
          // inne urządzenie zapisało w międzyczasie
          const fresh = await store.get(code, { type: 'json' })
          return json(409, { rev: fresh.rev, state: fresh.state })
        }
        return json(200, { rev })
      }

      return json(405, { error: 'Metoda niedozwolona' })
    } catch (err) {
      console.error(err)
      return json(500, { error: 'Błąd serwera' })
    }
  }
}

// Magazyn w pliku JSON — tylko do lokalnego `npm run dev`, naśladuje API Netlify Blobs.
export async function createFileStore(file) {
  const { readFileSync, writeFileSync, mkdirSync } = await import('node:fs')
  const { dirname } = await import('node:path')
  let data = {}
  try {
    data = JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    // brak pliku — pusty magazyn
  }
  let counter = 0
  const save = () => {
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, JSON.stringify(data))
  }
  return {
    async get(key) {
      return data[key] ? structuredClone(data[key].value) : null
    },
    async getWithMetadata(key) {
      const e = data[key]
      return e ? { data: structuredClone(e.value), etag: e.etag } : null
    },
    async setJSON(key, value, opts = {}) {
      const cur = data[key]
      if (opts.onlyIfNew && cur) return { modified: false }
      if (opts.onlyIfMatch && cur?.etag !== opts.onlyIfMatch) return { modified: false }
      const etag = `"${Date.now()}-${++counter}"`
      data[key] = { value, etag }
      save()
      return { modified: true, etag }
    },
  }
}

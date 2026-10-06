import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createFileStore, createSyncHandler } from './netlify/sync-handler.mjs'

// lokalnie /api/sync obsługuje serwer Vite (dane w .netlify/dev-sync.json), na Netlify — funkcja
function devSyncApi() {
  return {
    name: 'dev-sync-api',
    async configureServer(server) {
      const store = await createFileStore('.netlify/dev-sync.json')
      const handle = createSyncHandler(() => store)
      server.middlewares.use('/api/sync', async (req, res) => {
        const chunks = []
        for await (const chunk of req) chunks.push(chunk)
        const response = await handle(
          new Request(`http://localhost${req.originalUrl}`, {
            method: req.method,
            headers: { 'Content-Type': req.headers['content-type'] ?? 'application/json' },
            body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
          }),
        )
        res.statusCode = response.status
        response.headers.forEach((value, key) => res.setHeader(key, value))
        res.end(Buffer.from(await response.arrayBuffer()))
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devSyncApi()],
})

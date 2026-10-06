import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createFileStore, createSyncHandler } from './netlify/sync-handler.mjs'
import { createPushHandler, runReminders } from './netlify/push-handler.mjs'

// Lokalnie /api/* obsługuje serwer Vite (dane w .netlify/dev-*.json), na Netlify — funkcje.
// /api/dev-reminders ręcznie uruchamia to, co na Netlify robi zaplanowana funkcja co 5 minut.
function devApi() {
  return {
    name: 'dev-api',
    async configureServer(server) {
      const stores = {
        sync: await createFileStore('.netlify/dev-sync.json'),
        subs: await createFileStore('.netlify/dev-push.json'),
        config: await createFileStore('.netlify/dev-config.json'),
      }
      const routes = {
        '/api/sync': createSyncHandler(() => stores.sync),
        '/api/push': createPushHandler(() => stores),
        '/api/dev-reminders': async () => Response.json({ sent: await runReminders(stores) }),
      }
      for (const [path, handle] of Object.entries(routes)) {
        server.middlewares.use(path, async (req, res) => {
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
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devApi()],
})

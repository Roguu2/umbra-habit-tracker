import { createSyncHandler } from '../sync-handler.mjs'
import { netlifyStores } from '../stores.mjs'

export default createSyncHandler(() => netlifyStores().sync)

export const config = { path: '/api/sync' }

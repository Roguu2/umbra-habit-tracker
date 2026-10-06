import { getStore } from '@netlify/blobs'
import { createSyncHandler } from '../sync-handler.mjs'

export default createSyncHandler(() => getStore({ name: 'umbra-sync', consistency: 'strong' }))

export const config = { path: '/api/sync' }

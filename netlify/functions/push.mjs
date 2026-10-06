import { createPushHandler } from '../push-handler.mjs'
import { netlifyStores } from '../stores.mjs'

export default createPushHandler(netlifyStores)

export const config = { path: '/api/push' }

import { getStore } from '@netlify/blobs'

export const netlifyStores = () => ({
  sync: getStore({ name: 'umbra-sync', consistency: 'strong' }),
  subs: getStore({ name: 'umbra-push', consistency: 'strong' }),
  config: getStore({ name: 'umbra-config', consistency: 'strong' }),
})

import { runReminders } from '../push-handler.mjs'
import { netlifyStores } from '../stores.mjs'

// zaplanowana funkcja Netlify — co 5 minut wysyła należne przypomnienia
export default async () => {
  const sent = await runReminders(netlifyStores())
  console.log(`reminders sent: ${sent}`)
}

export const config = { schedule: '*/5 * * * *' }

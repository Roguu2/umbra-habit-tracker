// Sprawdza przypomnienia push na serwerze: `npm run check:reminders`
// (a) wszystko odhaczone → bez „ostatniej szansy”; (b) coś zostało → push o 23:00, tylko raz;
// (c) drzemka 30 min → jeszcze raz po czasie, tylko raz, nie po odhaczeniu i nie po północy;
// do tego: starsze subskrypcje bez pola lastCall, „wył.”, minimum dnia w treści, urlop, liczba dla odznaki.

import { DEFAULT_LAST_CALL, createPushHandler, dueReminders, runReminders } from '../netlify/push-handler.mjs'

const errors = []
const check = (ok, msg) => ok || errors.push(msg)

// magazyn w pamięci z tym samym API co Netlify Blobs / createFileStore
function memoryStore() {
  const data = new Map()
  return {
    data,
    get: async (key) => (data.has(key) ? structuredClone(data.get(key)) : null),
    setJSON: async (key, value, opts = {}) => {
      if (opts.onlyIfNew && data.has(key)) return { modified: false }
      data.set(key, structuredClone(value))
      return { modified: true }
    },
    delete: async (key) => data.delete(key),
    list: async () => ({ blobs: [...data.keys()].map((key) => ({ key })) }),
  }
}

const DAY = '2026-10-14' // środa; Europe/Warsaw = UTC+2 (czas letni)
const at = (hhmm, day = DAY) => new Date(`${day}T${hhmm}:00+02:00`)
const quest = (id, name, extra = {}) => ({ id, name, days: [0, 1, 2, 3, 4, 5, 6], date: null, createdAt: '2026-10-01', archivedAt: null, exp: 25, ...extra })
const QUESTS = [quest('q-push', 'Pompki', { minimum: '10 pompek' }), quest('q-read', 'Czytanie')]
const stateWith = (done, extra = {}) => ({ quests: QUESTS, history: { [DAY]: done }, pauses: [], ...extra })
const SUB = { code: 'CODE', subscription: { endpoint: 'https://push.example/abc', keys: {} }, tz: 'Europe/Warsaw', lead: 15, evening: null, lang: 'pl', sent: {} }
const lastOf = (r) => r.due.filter((x) => x.kind === 'last')

// --- dueReminders ------------------------------------------------------------------------

// (a) wszystko odhaczone → nic
check(lastOf(dueReminders(stateWith(['q-push', 'q-read']), { ...SUB, lastCall: '23:00' }, at('23:00'))).length === 0, '(a) push mimo odhaczonych zadań')

// (b) coś zostało → o 23:00 jest, przed 23:00 nie ma
const due = lastOf(dueReminders(stateWith(['q-read']), { ...SUB, lastCall: '23:00' }, at('23:00')))
check(due.length === 1, `(b) brak „ostatniej szansy” o 23:00 (${due.length})`)
check(lastOf(dueReminders(stateWith([]), { ...SUB, lastCall: '23:00' }, at('22:50'))).length === 0, '(b) „ostatnia szansa” przed czasem')
const msg = due[0] ?? {}
check(msg.tag === `${DAY}:last` && msg.title === 'Passa w niebezpieczeństwie', `(b) zły tag/tytuł: ${msg.tag} ${msg.title}`)
check(/Zostało 1 zadanie na dziś · 1 h do północy\./.test(msg.body), `(b) treść: ${msg.body}`)
check(msg.body?.includes('Wystarczy: 10 pompek (Pompki).'), `(b) brak podpowiedzi minimum: ${msg.body}`)
check(msg.left === 1, `(b) left dla odznaki: ${msg.left}`)
const en = lastOf(dueReminders(stateWith([]), { ...SUB, lang: 'en', lastCall: '23:30' }, at('23:35')))[0]
check(en?.title === 'Your streak is on the line' && en.body.startsWith('2 quests left today · 25 min until midnight.'), `(b) angielska treść: ${en?.body}`)

// starsza subskrypcja bez pola → domyślna godzina; „wył.” → nic; urlop → nic
check(lastOf(dueReminders(stateWith([]), SUB, at(DEFAULT_LAST_CALL))).length === 1, 'brak pola lastCall nie działa jak domyślne')
check(lastOf(dueReminders(stateWith([]), { ...SUB, lastCall: 'off' }, at('23:00'))).length === 0, '„wył.” wysyła')
check(dueReminders(stateWith([], { pauses: [{ from: DAY, to: null }] }), SUB, at('23:00')).due.length === 0, 'urlop wysyła')

// wieczorne zostaje (łagodniejsze), z liczbą dla odznaki
const evening = dueReminders(stateWith([]), { ...SUB, evening: '20:00', lastCall: 'off' }, at('20:05')).due[0]
check(evening?.kind === 'evening' && !/passy/.test(evening.body) && evening.left === 2, `wieczorne: ${evening?.body}`)

// --- runReminders: raz dziennie i drzemka ---------------------------------------------------

const subs = memoryStore()
const sync = memoryStore()
const config = memoryStore()
const stores = { subs, sync, config }
const handler = createPushHandler(() => stores)
const sentLog = []
const sender = async (keys, subscription, payload) => sentLog.push(payload)
const setDone = async (done) => sync.setJSON('CODE', { state: stateWith(done) })
const lastSent = () => sentLog.filter((p) => p.kind === 'last')

await setDone(['q-read'])
const post = (query, body) => handler(new Request(`http://localhost/api/push${query}`, { method: 'POST', body: JSON.stringify(body) }))
check((await post('', { ...SUB, lastCall: '23:00' })).status === 200, 'zapis subskrypcji')
const [subKey] = subs.data.keys()
check(subs.data.get(subKey).lastCall === '23:00', 'lastCall nie zapisany')
check((await post('', { ...SUB, lastCall: '21:00' })).status === 200 && subs.data.get(subKey).lastCall === DEFAULT_LAST_CALL, 'niedozwolona godzina nie wraca do domyślnej')

await runReminders(stores, at('23:00'), sender)
await runReminders(stores, at('23:05'), sender)
check(lastSent().length === 1, `(b) „ostatnia szansa” wysłana ${lastSent().length}× zamiast raz`)
check(lastSent()[0]?.lang === 'pl' && lastSent()[0]?.snoozed === false, '(b) payload bez języka/znacznika drzemki')

// (c) drzemka: zapis przez API, ponowne wysłanie po czasie, tylko raz
const res = await post('?action=snooze', { endpoint: SUB.subscription.endpoint, snoozeMinutes: 30 })
const until = new Date(subs.data.get(subKey).snoozeUntil)
check(res.status === 200 && Math.abs(until - Date.now() - 30 * 60_000) < 5000, '(c) drzemka nie zapisana na 30 min')
// czas w teście jest udawany — ustawiamy koniec drzemki na 23:31
await subs.setJSON(subKey, { ...subs.data.get(subKey), snoozeUntil: at('23:31').toISOString() })
await runReminders(stores, at('23:20'), sender)
check(lastSent().length === 1, '(c) drzemka wysłana przed czasem')
await runReminders(stores, at('23:35'), sender)
await runReminders(stores, at('23:40'), sender)
check(lastSent().length === 2 && lastSent()[1].snoozed === true && lastSent()[1].tag === `${DAY}:last`, `(c) po drzemce: ${lastSent().length}×`)
check(subs.data.get(subKey).snoozeUntil === null, '(c) drzemka nie wyczyszczona po wysłaniu')

// (c) drzemka, ale w międzyczasie wszystko odhaczone → nic
// stan po wysłanej dziś „ostatniej szansie” i kliknięciu „Za 30 min”
const snoozed = (hhmm, day) =>
  subs.setJSON(subKey, { ...subs.data.get(subKey), sent: { [`${DAY}:last`]: true }, snoozeUntil: at(hhmm, day).toISOString() })
await snoozed('23:31')
await setDone(['q-read', 'q-push'])
await runReminders(stores, at('23:35'), sender)
check(lastSent().length === 2, '(c) drzemka mimo odhaczonych zadań')

// (c) drzemka kończąca się po północy → następnego dnia nic (i drzemka znika)
await setDone([])
await snoozed('00:10', '2026-10-15')
await sync.setJSON('CODE', { state: { quests: QUESTS, history: {}, pauses: [] } })
await runReminders(stores, at('00:15', '2026-10-15'), sender)
check(lastSent().length === 2, '(c) drzemka wysłana po północy')
check(subs.data.get(subKey).snoozeUntil === null, '(c) drzemka z poprzedniego dnia nie wyczyszczona')

if (errors.length) {
  console.log(`${errors.length} problemów:\n  ${errors.join('\n  ')}`)
  process.exit(1)
}
console.log('OK — ostatnia szansa (raz dziennie, tylko gdy coś zostało), drzemka, wieczorne, odznaka')

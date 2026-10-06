// Przypomnienia push. Subskrypcja urządzenia jest powiązana z kodem synchronizacji —
// dzięki temu serwer zna aktualny plan i wie, co jest już odhaczone.
//
// GET                                         → { publicKey }
// POST   { code, subscription, tz, lead, evening } → zapis / aktualizacja subskrypcji
// POST   ?action=test { endpoint }            → wysyła powiadomienie testowe
// DELETE { endpoint }                         → usunięcie subskrypcji

import { createHash } from 'node:crypto'
import webpush from 'web-push'
import { existsOn, isFlexible, isPaused, isScheduledOn, weekCount } from '../src/lib/schedule.js'

const LEADS = [0, 5, 15, 30]
const EVENINGS = [null, '19:00', '20:00', '21:00', '22:00']
// funkcja uruchamia się co 5 min, ale bywa opóźniona — okno z zapasem, duplikaty blokuje `sent`
const WINDOW_MIN = 20

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

const subKey = (endpoint) => createHash('sha256').update(endpoint).digest('hex').slice(0, 40)

async function readJson(req) {
  try {
    const text = await req.text()
    return text.length < 20_000 ? JSON.parse(text) : null
  } catch {
    return null
  }
}

export async function vapidKeys(config) {
  let keys = await config.get('vapid', { type: 'json' })
  if (!keys) {
    await config.setJSON('vapid', webpush.generateVAPIDKeys(), { onlyIfNew: true })
    keys = await config.get('vapid', { type: 'json' })
  }
  return keys
}

async function send(keys, subscription, payload) {
  return webpush.sendNotification(subscription, JSON.stringify(payload), {
    TTL: 60 * 60,
    urgency: 'high',
    vapidDetails: { subject: process.env.URL || 'mailto:umbra@example.com', publicKey: keys.publicKey, privateKey: keys.privateKey },
  })
}

// stores: { subs, config, sync } — każdy z API Netlify Blobs (get, getWithMetadata, setJSON, delete, list)
export function createPushHandler(getStores) {
  return async (req) => {
    try {
      const { subs, config, sync } = getStores()
      const url = new URL(req.url)

      if (req.method === 'GET') return json(200, { publicKey: (await vapidKeys(config)).publicKey })

      const body = await readJson(req)
      if (!body) return json(400, { error: 'Nieprawidłowe dane' })

      if (req.method === 'DELETE') {
        if (typeof body.endpoint === 'string') await subs.delete(subKey(body.endpoint))
        return json(200, { ok: true })
      }

      if (req.method !== 'POST') return json(405, { error: 'Metoda niedozwolona' })

      if (url.searchParams.get('action') === 'test') {
        const record = typeof body.endpoint === 'string' && (await subs.get(subKey(body.endpoint), { type: 'json' }))
        if (!record) return json(404, { error: 'Przypomnienia nie są włączone na tym urządzeniu' })
        const en = record.lang === 'en'
        await send(await vapidKeys(config), record.subscription, {
          title: en ? 'Umbra speaks' : 'Umbra przemawia',
          body: en ? 'Reminders are working. The seals await your will.' : 'Przypomnienia działają. Pieczęcie czekają na twoją wolę.',
          tag: 'test',
        })
        return json(200, { ok: true })
      }

      const { code, subscription, tz, lead, evening, lang } = body
      if (typeof subscription?.endpoint !== 'string' || !subscription.keys) return json(400, { error: 'Brak subskrypcji' })
      if (typeof code !== 'string' || !(await sync.get(code, { type: 'json' }))) return json(404, { error: 'Nieznany kod synchronizacji' })
      try {
        new Intl.DateTimeFormat('en', { timeZone: tz })
      } catch {
        return json(400, { error: 'Nieznana strefa czasowa' })
      }

      const key = subKey(subscription.endpoint)
      const prev = await subs.get(key, { type: 'json' })
      await subs.setJSON(key, {
        code,
        subscription,
        tz,
        lead: LEADS.includes(lead) ? lead : 15,
        evening: EVENINGS.includes(evening) ? evening : null,
        lang: lang === 'en' ? 'en' : 'pl',
        sent: prev?.sent ?? {},
        updatedAt: new Date().toISOString(),
      })
      return json(200, { ok: true })
    } catch (err) {
      console.error(err)
      return json(500, { error: 'Błąd serwera' })
    }
  }
}

// --- wyliczanie przypomnień -------------------------------------------------------

function localNow(now, tz) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  )
  return { key: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) }
}

const toMinutes = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))

function leftLabel(n, en) {
  if (en) return n === 1 ? '1 quest left today' : `${n} quests left today`
  const d = n % 10
  const dd = n % 100
  if (n === 1) return 'Zostało 1 zadanie na dziś'
  return d >= 2 && d <= 4 && (dd < 12 || dd > 14) ? `Zostały ${n} zadania na dziś` : `Zostało ${n} zadań na dziś`
}

// lista powiadomień do wysłania teraz (bez tych już wysłanych)
export function dueReminders(state, sub, now = new Date()) {
  const en = sub.lang === 'en'
  const { key, minutes } = localNow(now, sub.tz)
  const done = new Set(state.history?.[key] ?? [])
  if (isPaused(state, key)) return { key, due: [] } // urlop — cisza
  const today = (state.quests ?? []).filter((q) => isScheduledOn(q, key))
  // nawyki "X razy w tygodniu" z godziną — przypominamy, dopóki cel tygodnia nie jest osiągnięty
  const flexible = (state.quests ?? []).filter(
    (q) => isFlexible(q) && existsOn(q, key) && weekCount({ history: state.history ?? {} }, q, key) < q.perWeek,
  )
  const out = []

  for (const q of [...today, ...flexible]) {
    if (!q.time || done.has(q.id)) continue
    const start = toMinutes(q.time)
    const at = start - sub.lead
    // po godzinie startu nie przypominamy dłużej niż 10 min
    if (minutes < at || minutes >= at + WINDOW_MIN || minutes > start + 10) continue
    const left = start - minutes
    out.push({
      tag: `${key}:${q.id}`,
      title: q.name,
      body:
        left > 0
          ? `${en ? `In ${left} min` : `Za ${left} min`} · ${q.time} · +${q.exp} EXP`
          : `${en ? 'Now' : 'Teraz'} · ${q.time} · +${q.exp} EXP`,
    })
  }

  if (sub.evening) {
    const at = toMinutes(sub.evening)
    const left = today.filter((q) => !done.has(q.id))
    if (left.length && minutes >= at && minutes < at + WINDOW_MIN) {
      out.push({
        tag: `${key}:evening`,
        title: leftLabel(left.length, en),
        body: `${left.map((q) => q.name).slice(0, 3).join(', ')}${left.length > 3 ? '…' : ''} — ${en ? "don't break your streak." : 'nie przerywaj passy.'}`,
      })
    }
  }

  return { key, due: out.filter((r) => !sub.sent?.[r.tag]) }
}

// przebieg zaplanowanej funkcji: dla każdej subskrypcji wysyła należne przypomnienia
export async function runReminders({ subs, config, sync }, now = new Date(), sender = send) {
  const keys = await vapidKeys(config)
  const { blobs } = await subs.list()
  let sentCount = 0

  for (const { key } of blobs) {
    const sub = await subs.get(key, { type: 'json' })
    if (!sub) continue
    const doc = await sync.get(sub.code, { type: 'json' })
    if (!doc) {
      await subs.delete(key) // kod usunięty — subskrypcja bezużyteczna
      continue
    }

    const { key: day, due } = dueReminders(doc.state, sub, now)
    const sent = Object.fromEntries(Object.entries(sub.sent ?? {}).filter(([tag]) => tag.startsWith(day)))
    let gone = false

    for (const r of due) {
      try {
        await sender(keys, sub.subscription, { ...r, url: '/' })
        sent[r.tag] = true
        sentCount++
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          gone = true // przeglądarka wycofała subskrypcję
          break
        }
        console.error('push failed', err.statusCode ?? '', err.body ?? err.message)
      }
    }

    if (gone) await subs.delete(key)
    else if (due.length || Object.keys(sent).length !== Object.keys(sub.sent ?? {}).length) await subs.setJSON(key, { ...sub, sent })
  }
  return sentCount
}

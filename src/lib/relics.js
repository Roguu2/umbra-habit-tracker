// --- Znaleziska (relikty) -----------------------------------------------------------------
// Każde wykonanie zadania ma małą szansę na relikt. Wynik jest deterministyczny (hash z daty i id zadania),
// więc kolekcja wynika wprost z historii — bez zapisu, taka sama na każdym urządzeniu.
// Relikty są wyłącznie kosmetyczne: nie dają EXP ani innych korzyści.

import { t } from './i18n.js'
import { hash01, pick } from './random.js'

export const RELIC_CHANCE = 0.08

export const RARITY = {
  common: { weight: 70, label: t('pospolity', 'common') },
  rare: { weight: 25, label: t('rzadki', 'rare') },
  legendary: { weight: 5, label: t('legendarny', 'legendary') },
}

const relic = (id, rarity, rune, pl, en, descPl, descEn) => ({ id, rarity, rune, name: t(pl, en), desc: t(descPl, descEn) })

export const RELICS = [
  relic('rusty-nail', 'common', 0, 'Zardzewiały gwóźdź', 'Rusty Nail', 'Wyrwany z drzwi starej kuźni.', 'Torn from the door of an old forge.'),
  relic('ember-shard', 'common', 3, 'Odłamek żaru', 'Ember Shard', 'Wciąż ciepły, choć ogień dawno zgasł.', 'Still warm, though the fire died long ago.'),
  relic('bone-die', 'common', 8, 'Kościana kostka', 'Bone Die', 'Zawsze wypada szóstka. Prawie zawsze.', 'Always rolls a six. Almost always.'),
  relic('ash-feather', 'common', 1, 'Pióro z popiołu', 'Ash Feather', 'Rozsypuje się, gdy przestajesz w nie wierzyć.', 'It crumbles when you stop believing in it.'),
  relic('iron-ring', 'common', 5, 'Żelazny pierścień', 'Iron Ring', 'Zostawia na palcu ślad przysięgi.', 'It leaves the mark of an oath on your finger.'),
  relic('moth-wing', 'common', 2, 'Skrzydło ćmy', 'Moth Wing', 'Pachnie świecą, przy której ktoś czytał do świtu.', 'It smells of a candle someone read by until dawn.'),
  relic('river-stone', 'common', 4, 'Kamień z rzeki', 'River Stone', 'Gładki od lat cierpliwego płynięcia.', 'Smoothed by years of patient flowing.'),
  relic('wax-seal', 'common', 7, 'Woskowa pieczęć', 'Wax Seal', 'Odcisk herbu, którego nikt już nie pamięta.', 'The imprint of a crest no one remembers.'),
  relic('candle-stub', 'common', 3, 'Ogarek świecy', 'Candle Stub', 'Wystarczy na jeszcze jedną noc.', 'Enough for one more night.'),
  relic('crow-quill', 'common', 2, 'Krucze pióro', 'Crow Quill', 'Pisze tylko prawdę. Atrament nie jest potrzebny.', 'It writes only the truth. No ink required.'),
  relic('salt-pouch', 'common', 6, 'Sakiewka soli', 'Salt Pouch', 'Na progu chroni przed tym, co czai się w mroku.', 'On the threshold it wards off what lurks in the dark.'),
  relic('chipped-rune', 'common', 8, 'Wyszczerbiona runa', 'Chipped Rune', 'Jej znaczenie zatarł czas, moc została.', 'Time wore away its meaning, but not its power.'),
  relic('blood-vial', 'rare', 0, 'Fiolka krwi', 'Vial of Blood', 'Szkło pulsuje w rytm twojego serca.', 'The glass pulses in time with your heart.'),
  relic('silver-key', 'rare', 6, 'Srebrny klucz', 'Silver Key', 'Otwiera drzwi, których jeszcze nie znalazłeś.', 'It opens doors you have not found yet.'),
  relic('wolf-fang', 'rare', 4, 'Wilczy kieł', 'Wolf Fang', 'Należał do przewodnika stada, który nigdy nie zawrócił.', 'It belonged to a pack leader who never turned back.'),
  relic('star-map', 'rare', 2, 'Mapa gwiazd', 'Star Map', 'Gwiazdy na niej przesuwają się nocą.', 'The stars on it move at night.'),
  relic('oath-coin', 'rare', 5, 'Moneta przysięgi', 'Oath Coin', 'Wybita dla tych, którzy dotrzymują słowa wobec siebie.', 'Minted for those who keep their word to themselves.'),
  relic('frost-lantern', 'rare', 3, 'Mroźna latarnia', 'Frost Lantern', 'Świeci zimnym światłem, które nie gaśnie na wietrze.', 'It burns with a cold light no wind can put out.'),
  relic('phoenix-ash', 'legendary', 1, 'Popiół feniksa', 'Phoenix Ash', 'Garść popiołu, z której zawsze coś się odradza.', 'A handful of ash from which something is always reborn.'),
  relic('crown-of-dusk', 'legendary', 7, 'Korona Zmierzchu', 'Crown of Dusk', 'Nosił ją ktoś, kto nigdy nie odpuścił. Teraz czeka na ciebie.', 'Worn by one who never gave up. Now it waits for you.'),
]

// relikt znaleziony przy wykonaniu zadania `questId` w dniu `key` albo null
export function relicFor(key, questId) {
  const seed = `${key}|${questId}`
  if (hash01(`relic|${seed}`) >= RELIC_CHANCE) return null
  const total = Object.values(RARITY).reduce((sum, r) => sum + r.weight, 0)
  let roll = hash01(`relic-rarity|${seed}`) * total
  const rarity = Object.keys(RARITY).find((r) => (roll -= RARITY[r].weight) < 0) ?? 'common'
  return pick(
    RELICS.filter((r) => r.rarity === rarity),
    `relic-item|${seed}`,
  )
}

// znaleziska jednego dnia: [{ relic, key, questId }]
export function relicsOn(state, key) {
  const known = new Set(state.quests.map((q) => q.id))
  return (state.history[key] ?? [])
    .filter((id) => known.has(id))
    .map((questId) => ({ relic: relicFor(key, questId), key, questId }))
    .filter((f) => f.relic)
}

// kolekcja z całej historii: Map id reliktu → { relic, count, first } (first — dzień pierwszego znalezienia)
export function relicCollection(state) {
  const collection = new Map()
  for (const key of Object.keys(state.history).sort()) {
    for (const find of relicsOn(state, key)) {
      const entry = collection.get(find.relic.id)
      if (entry) entry.count++
      else collection.set(find.relic.id, { relic: find.relic, count: 1, first: key })
    }
  }
  return collection
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ALL_DAYS, autoProps, createInitialState, dayKey, levelFromExp, migrateState, shiftKey, totalExpOf } from '../lib/game'
import { isPaused, lifetimeStats } from '../lib/stats'
import { ACHIEVEMENTS } from '../lib/achievements'
import { shieldPauses } from '../lib/shields'
import { sfx } from '../lib/sfx'
import { useSync } from './useSync'

const STORAGE_KEY = 'umbra-habit-tracker:v1'

function load() {
  try {
    return migrateState(JSON.parse(localStorage.getItem(STORAGE_KEY)))
  } catch {
    return createInitialState()
  }
}

// bieżąca data odświeżana co 30 s — po północy aplikacja sama przechodzi na nowy dzień
function useToday() {
  const [today, setToday] = useState(dayKey)
  useEffect(() => {
    const id = setInterval(() => {
      const k = dayKey()
      setToday((prev) => (prev === k ? prev : k))
    }, 30000)
    return () => clearInterval(id)
  }, [])
  return today
}

// ustawia wykonanie zadania w danym dniu (EXP wynika z historii — patrz totalExpOf)
function setDone(s, quest, key, done) {
  const list = s.history[key] ?? []
  const was = list.includes(quest.id)
  if (was === done) return s
  return {
    ...s,
    history: { ...s.history, [key]: done ? [...list, quest.id] : list.filter((x) => x !== quest.id) },
  }
}

function setSteps(s, questId, key, indices) {
  return { ...s, steps: { ...s.steps, [key]: { ...s.steps[key], [questId]: indices } } }
}

function setCount(s, questId, key, n) {
  return { ...s, counts: { ...s.counts, [key]: { ...s.counts[key], [questId]: n } } }
}

const MAX_COUNT = 99

export function useGame() {
  const [state, setState] = useState(load)
  const today = useToday()
  const sync = useSync(state, setState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // brak dostępu do storage — aplikacja działa w pamięci
    }
  }, [state])

  const totalExp = useMemo(() => totalExpOf(state), [state.quests, state.history]) // eslint-disable-line react-hooks/exhaustive-deps
  const { level, current, needed } = levelFromExp(totalExp)
  // najwyższy osiągnięty poziom (odblokowuje nagrody); state.maxLevel nadąża dopiero w efekcie poniżej
  const maxLevel = Math.max(state.maxLevel, level)

  // --- akcje ---------------------------------------------------------------

  // kliknięcie pieczęci: przy zadaniu z krokami zaznacza/odznacza też wszystkie kroki,
  // przy liczniku ustawia go na cel albo zeruje
  const toggleQuest = useCallback(
    (id, key = today) => {
      setState((s) => {
        const quest = s.quests.find((q) => q.id === id)
        if (!quest) return s
        const done = !(s.history[key] ?? []).includes(id)
        let next = setDone(s, quest, key, done)
        if (quest.kind === 'count') next = setCount(next, id, key, done ? Math.max(quest.target, s.counts[key]?.[id] ?? 0) : 0)
        return quest.steps.length ? setSteps(next, id, key, done ? quest.steps.map((_, i) => i) : []) : next
      })
    },
    [today],
  )

  // licznik (np. szklanki wody): po dojściu do celu zadanie zalicza się samo
  const addCount = useCallback(
    (id, delta, key = today) => {
      setState((s) => {
        const quest = s.quests.find((q) => q.id === id)
        if (!quest || quest.kind !== 'count') return s
        const n = Math.min(MAX_COUNT, Math.max(0, (s.counts[key]?.[id] ?? 0) + delta))
        return setDone(setCount(s, id, key, n), quest, key, n >= quest.target)
      })
    },
    [today],
  )

  // odhaczenie kroku: po zaznaczeniu wszystkich zadanie zalicza się samo
  const toggleStep = useCallback(
    (id, index, key = today) => {
      setState((s) => {
        const quest = s.quests.find((q) => q.id === id)
        if (!quest) return s
        const checked = s.steps[key]?.[id] ?? []
        const indices = checked.includes(index) ? checked.filter((i) => i !== index) : [...checked, index]
        return setDone(setSteps(s, id, key, indices), quest, key, indices.length === quest.steps.length)
      })
    },
    [today],
  )

  // dodanie lub edycja — kategoria, kolor i EXP wynikają z nazwy
  // kind: 'check' (zwykłe) | 'count' (licznik do celu) | 'avoid' (czego unikać); perWeek: X razy w tygodniu
  const saveQuest = useCallback(
    ({ id, name, time, days, date, steps, kind = 'check', target, unit, perWeek }) => {
      setState((s) => {
        const fields = {
          name,
          time: time || null,
          days: date ? [] : perWeek ? ALL_DAYS : days,
          date: date || null,
          steps,
          kind,
          target: kind === 'count' ? Math.min(MAX_COUNT, Math.max(2, Number(target) || 2)) : null,
          unit: kind === 'count' ? (unit ?? '').trim().slice(0, 16) || null : null,
          perWeek: !date && perWeek ? Math.min(6, Math.max(1, Number(perWeek))) : null,
          ...autoProps(name),
        }
        if (id) return { ...s, quests: s.quests.map((q) => (q.id === id ? { ...q, ...fields } : q)) }
        const quest = {
          id: `q-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
          ...fields,
          custom: true,
          createdAt: date && date < today ? date : today,
          archivedAt: null,
        }
        return { ...s, quests: [...s.quests, quest] }
      })
    },
    [today],
  )

  // zadanie z historią trafia do archiwum (statystyki zostają), nieużywane znika całkowicie
  const removeQuest = useCallback(
    (id) => {
      setState((s) => {
        const used = Object.values(s.history).some((ids) => ids.includes(id))
        return {
          ...s,
          quests: used ? s.quests.map((q) => (q.id === id ? { ...q, archivedAt: today } : q)) : s.quests.filter((q) => q.id !== id),
        }
      })
    },
    [today],
  )

  // podniesienie poprzeczki (up z harderVersion) albo odmowa (up = null); w obu przypadkach
  // barAt wycisza kolejne propozycje dla tego nawyku na 14 dni
  const raiseBar = useCallback(
    (id, up) => {
      setState((s) => ({
        ...s,
        quests: s.quests.map((q) => {
          if (q.id !== id) return q
          const next = { ...q, barAt: today }
          if (up?.perWeek) next.perWeek = up.perWeek
          if (up?.name) Object.assign(next, { name: up.name, ...autoProps(up.name) })
          return next
        }),
      }))
    },
    [today],
  )

  // nowa kolejność zadań bez godziny (po przeciągnięciu)
  const reorderQuests = useCallback((ids) => {
    const rank = Object.fromEntries(ids.map((id, i) => [id, i]))
    setState((s) => ({ ...s, quests: s.quests.map((q) => (q.id in rank ? { ...q, order: rank[q.id] } : q)) }))
  }, [])

  const finishOnboarding = useCallback((name) => {
    setState((s) => ({ ...s, onboarded: true, profile: name ? { ...s.profile, name } : s.profile }))
  }, [])

  const renameHero = useCallback((name) => {
    setState((s) => ({ ...s, profile: { ...s.profile, name } }))
  }, [])

  // aura tła (lib/rewards.js) — w profilu, więc synchronizuje się między urządzeniami
  const setAura = useCallback((aura) => {
    setState((s) => ({ ...s, profile: { ...s.profile, aura } }))
  }, [])

  // tryb urlopu: od dziś do odwołania; wyłączenie kończy przerwę wczoraj (dzisiejszy dzień znów się liczy)
  const setVacation = useCallback(
    (on) => {
      setState((s) => {
        const pauses = s.pauses ?? []
        if (on) return isPaused(s, today) ? s : { ...s, pauses: [...pauses, { from: today, to: null }] }
        return {
          ...s,
          pauses: pauses.flatMap((p) => {
            if (p.to && p.to < today) return [p]
            if (p.from >= today) return []
            return [{ ...p, to: shiftKey(today, -1) }]
          }),
        }
      })
    },
    [today],
  )

  // tarcze passy: wskazane dni przestają się liczyć (patrz lib/shields.js)
  const spendShields = useCallback((days) => {
    setState((s) => ({ ...s, pauses: [...(s.pauses ?? []), ...shieldPauses(days)] }))
  }, [])

  const announced = useRef(new Set(Object.keys(state.achievements)))
  const reset = useCallback(() => {
    announced.current = new Set()
    setState(createInitialState())
  }, [])

  // wczytanie kopii zapasowej (zastępuje obecne dane)
  const importState = useCallback((next) => {
    announced.current = new Set(Object.keys(next.achievements))
    setState(migrateState(next))
  }, [])

  // --- level up --------------------------------------------------------------

  // { level, from } — from: poprzedni najwyższy poziom, żeby okno pokazało nagrody ze wszystkich
  // przeskoczonych poziomów (np. po synchronizacji)
  const [levelUpShown, setLevelUpShown] = useState(null)
  useEffect(() => {
    if (level <= state.maxLevel) return
    const from = state.maxLevel
    setState((s) => ({ ...s, maxLevel: level }))
    setTimeout(() => {
      setLevelUpShown({ level, from })
      sfx.levelUp()
    }, 800)
  }, [level, state.maxLevel])
  const closeLevelUp = useCallback(() => {
    sfx.whoosh()
    setLevelUpShown(null)
  }, [])

  // --- osiągnięcia -----------------------------------------------------------

  const life = useMemo(() => lifetimeStats(state, today), [state, today])

  const achievementCtx = useMemo(() => ({ life, level, bestWeek: life.bestWeek }), [life, level])

  const [toasts, setToasts] = useState([])

  // zdobyte już na innym urządzeniu (przyszły z synchronizacją) nie są ogłaszane ponownie
  useEffect(() => {
    Object.keys(state.achievements).forEach((id) => announced.current.add(id))
  }, [state.achievements])

  useEffect(() => {
    const fresh = ACHIEVEMENTS.filter((a) => {
      const [value, goal] = a.progress(achievementCtx)
      return value >= goal && !announced.current.has(a.id)
    })
    if (!fresh.length) return
    fresh.forEach((a) => announced.current.add(a.id))
    setState((s) => ({
      ...s,
      achievements: { ...s.achievements, ...Object.fromEntries(fresh.map((a) => [a.id, today])) },
    }))
    setToasts((t) => [...t, ...fresh])
  }, [achievementCtx, today])

  const dismissToast = useCallback(() => setToasts((t) => t.slice(1)), [])

  return {
    state,
    today,
    level,
    current,
    needed,
    totalExp,
    maxLevel,
    life,
    achievementCtx,
    levelUpShown,
    closeLevelUp,
    toast: toasts[0] ?? null,
    dismissToast,
    sync,
    actions: {
      toggleQuest,
      toggleStep,
      addCount,
      saveQuest,
      removeQuest,
      reorderQuests,
      raiseBar,
      renameHero,
      setAura,
      finishOnboarding,
      setVacation,
      spendShields,
      reset,
      importState,
    },
  }
}

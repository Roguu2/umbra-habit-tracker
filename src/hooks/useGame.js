import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { autoProps, createInitialState, dayKey, levelFromExp, migrateState, parseKey, weekStart } from '../lib/game'
import { lifetimeStats, weekPerfectDays } from '../lib/stats'
import { ACHIEVEMENTS } from '../lib/achievements'
import { sfx } from '../lib/sfx'

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

// ustawia wykonanie zadania w danym dniu i koryguje EXP
function setDone(s, quest, key, done) {
  const list = s.history[key] ?? []
  const was = list.includes(quest.id)
  if (was === done) return s
  return {
    ...s,
    totalExp: Math.max(0, s.totalExp + (done ? quest.exp : -quest.exp)),
    history: { ...s.history, [key]: done ? [...list, quest.id] : list.filter((x) => x !== quest.id) },
  }
}

function setSteps(s, questId, key, indices) {
  return { ...s, steps: { ...s.steps, [key]: { ...s.steps[key], [questId]: indices } } }
}

export function useGame() {
  const [state, setState] = useState(load)
  const today = useToday()

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // brak dostępu do storage — aplikacja działa w pamięci
    }
  }, [state])

  const { level, current, needed } = levelFromExp(state.totalExp)

  // --- akcje ---------------------------------------------------------------

  // kliknięcie pieczęci: przy zadaniu z krokami zaznacza/odznacza też wszystkie kroki
  const toggleQuest = useCallback(
    (id, key = today) => {
      setState((s) => {
        const quest = s.quests.find((q) => q.id === id)
        if (!quest) return s
        const done = !(s.history[key] ?? []).includes(id)
        const next = setDone(s, quest, key, done)
        return quest.steps.length ? setSteps(next, id, key, done ? quest.steps.map((_, i) => i) : []) : next
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
  const saveQuest = useCallback(
    ({ id, name, time, days, date, steps }) => {
      setState((s) => {
        const fields = { name, time: time || null, days: date ? [] : days, date: date || null, steps, ...autoProps(name) }
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

  const announced = useRef(new Set(Object.keys(state.achievements)))
  const reset = useCallback(() => {
    announced.current = new Set()
    setState(createInitialState())
  }, [])

  // --- level up --------------------------------------------------------------

  const [levelUpShown, setLevelUpShown] = useState(null)
  useEffect(() => {
    if (level <= state.maxLevel) return
    setState((s) => ({ ...s, maxLevel: level }))
    setTimeout(() => {
      setLevelUpShown(level)
      sfx.levelUp()
    }, 800)
  }, [level, state.maxLevel])
  const closeLevelUp = useCallback(() => {
    sfx.whoosh()
    setLevelUpShown(null)
  }, [])

  // --- osiągnięcia -----------------------------------------------------------

  const life = useMemo(() => lifetimeStats(state, today), [state, today])

  const achievementCtx = useMemo(() => {
    let bestWeek = 0
    for (let w = weekStart(parseKey(state.profile.startedAt)); dayKey(w) <= today; w.setDate(w.getDate() + 7)) {
      bestWeek = Math.max(bestWeek, weekPerfectDays(state, dayKey(w)))
    }
    return { life, level, bestWeek }
  }, [state, life, level, today])

  const [toasts, setToasts] = useState([])

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
    life,
    achievementCtx,
    levelUpShown,
    closeLevelUp,
    toast: toasts[0] ?? null,
    dismissToast,
    actions: { toggleQuest, toggleStep, saveQuest, removeQuest, reorderQuests, renameHero, finishOnboarding, reset },
  }
}

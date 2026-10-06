// Osiągnięcia: progress(ctx) zwraca [aktualnie, cel]. Odblokowane, gdy aktualnie >= cel.
export const ACHIEVEMENTS = [
  { id: 'first-seal', name: 'Pierwsza krew', desc: 'Wykonaj pierwsze zadanie.', rune: 0, progress: (c) => [c.life.seals, 1] },
  { id: 'seals-50', name: 'Krąg pięćdziesięciu', desc: 'Wykonaj 50 zadań.', rune: 3, progress: (c) => [c.life.seals, 50] },
  { id: 'seals-200', name: 'Ściana run', desc: 'Wykonaj 200 zadań.', rune: 8, progress: (c) => [c.life.seals, 200] },
  { id: 'perfect-1', name: 'Dzień bez skazy', desc: 'Wykonaj cały plan dnia.', rune: 1, progress: (c) => [c.life.perfectDays, 1] },
  { id: 'perfect-10', name: 'Dziesięć nieskalanych', desc: 'Zalicz 10 pełnych dni.', rune: 7, progress: (c) => [c.life.perfectDays, 10] },
  { id: 'streak-7', name: 'Siedem nocy', desc: 'Seria 7 w jednym nawyku.', rune: 6, progress: (c) => [c.life.bestStreak, 7] },
  { id: 'streak-30', name: 'Księżycowy cykl', desc: 'Seria 30 w jednym nawyku.', rune: 2, progress: (c) => [c.life.bestStreak, 30] },
  { id: 'level-5', name: 'Krwawy Księżyc', desc: 'Osiągnij 5. poziom.', rune: 4, progress: (c) => [c.level, 5] },
  { id: 'level-10', name: 'Głos Otchłani', desc: 'Osiągnij 10. poziom.', rune: 5, progress: (c) => [c.level, 10] },
  { id: 'forge-1', name: 'Kowal przysiąg', desc: 'Dodaj własne zadanie do planu.', rune: 5, progress: (c) => [c.life.created, 1] },
  { id: 'planner', name: 'Strateg', desc: 'Zaplanuj coś na przyszły dzień.', rune: 7, progress: (c) => [c.life.plannedAhead ? 1 : 0, 1] },
  { id: 'week-goal', name: 'Tydzień chwały', desc: '5 pełnych dni w jednym tygodniu.', rune: 1, progress: (c) => [c.bestWeek, 5] },
]

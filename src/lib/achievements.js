import { t } from './i18n.js'

// Osiągnięcia: progress(ctx) zwraca [aktualnie, cel]. Odblokowane, gdy aktualnie >= cel.
export const ACHIEVEMENTS = [
  { id: 'first-seal', name: t('Pierwsza krew', 'First Blood'), desc: t('Wykonaj pierwsze zadanie.', 'Complete your first quest.'), rune: 0, progress: (c) => [c.life.seals, 1] },
  { id: 'seals-50', name: t('Krąg pięćdziesięciu', 'Circle of Fifty'), desc: t('Wykonaj 50 zadań.', 'Complete 50 quests.'), rune: 3, progress: (c) => [c.life.seals, 50] },
  { id: 'seals-200', name: t('Ściana run', 'Wall of Runes'), desc: t('Wykonaj 200 zadań.', 'Complete 200 quests.'), rune: 8, progress: (c) => [c.life.seals, 200] },
  { id: 'perfect-1', name: t('Dzień bez skazy', 'Flawless Day'), desc: t('Wykonaj cały plan dnia.', "Complete a whole day's plan."), rune: 1, progress: (c) => [c.life.perfectDays, 1] },
  { id: 'perfect-10', name: t('Dziesięć nieskalanych', 'Ten Unblemished'), desc: t('Zalicz 10 pełnych dni.', 'Complete 10 full days.'), rune: 7, progress: (c) => [c.life.perfectDays, 10] },
  { id: 'streak-7', name: t('Siedem nocy', 'Seven Nights'), desc: t('Seria 7 w jednym nawyku.', 'A 7-streak in one habit.'), rune: 6, progress: (c) => [c.life.bestStreak, 7] },
  { id: 'streak-30', name: t('Księżycowy cykl', 'Lunar Cycle'), desc: t('Seria 30 w jednym nawyku.', 'A 30-streak in one habit.'), rune: 2, progress: (c) => [c.life.bestStreak, 30] },
  { id: 'level-5', name: t('Krwawy Księżyc', 'Blood Moon'), desc: t('Osiągnij 5. poziom.', 'Reach level 5.'), rune: 4, progress: (c) => [c.level, 5] },
  { id: 'level-10', name: t('Głos Otchłani', 'Voice of the Abyss'), desc: t('Osiągnij 10. poziom.', 'Reach level 10.'), rune: 5, progress: (c) => [c.level, 10] },
  { id: 'forge-1', name: t('Kowal przysiąg', 'Oathsmith'), desc: t('Dodaj własne zadanie do planu.', 'Add your own quest to the plan.'), rune: 5, progress: (c) => [c.life.created, 1] },
  { id: 'planner', name: t('Strateg', 'Strategist'), desc: t('Zaplanuj coś na przyszły dzień.', 'Plan something for a future day.'), rune: 7, progress: (c) => [c.life.plannedAhead ? 1 : 0, 1] },
  { id: 'week-goal', name: t('Tydzień chwały', 'Week of Glory'), desc: t('5 pełnych dni w jednym tygodniu.', '5 full days in a single week.'), rune: 1, progress: (c) => [c.bestWeek, 5] },
]

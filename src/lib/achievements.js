import { t } from './i18n.js'

// Osiągnięcia: progress(ctx) zwraca [aktualnie, cel]. Odblokowane, gdy aktualnie >= cel.
// hidden — do zdobycia widoczne jako „???”.
// ctx (useGame): life (lifetimeStats), level, bestWeek, comebacks, bosses, bossKinds, relicKinds,
// legendaryRelic, shieldsUsed, events — zdarzenia z bieżącej sesji (pora odhaczenia), których nie da się
// wyliczyć z historii; po zdobyciu takie osiągnięcie zostaje w state.achievements jak każde inne.
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

  // pory dnia (zdarzenia z sesji)
  { id: 'dawn', name: t('Świt wędrowca', "Wanderer's Dawn"), desc: t('Wykonaj zadanie między 4:00 a 6:00.', 'Complete a quest between 4:00 and 6:00.'), rune: 3, progress: (c) => [c.events.has('dawn') ? 1 : 0, 1] },
  { id: 'midnight', hidden: true, name: t('Dziecię nocy', 'Child of the Night'), desc: t('Wykonaj zadanie między północą a 4:00.', 'Complete a quest between midnight and 4:00.'), rune: 2, progress: (c) => [c.events.has('midnight') ? 1 : 0, 1] },

  // rekordy
  { id: 'all-attrs', name: t('Pięć run', 'Five Runes'), desc: t('Jednego dnia wykonaj zadania ze wszystkich pięciu kategorii.', 'Complete quests from all five categories in one day.'), rune: 8, progress: (c) => [c.life.allAttrsDay ? 1 : 0, 1] },
  { id: 'seals-500', name: t('Pół tysiąca pieczęci', 'Five Hundred Seals'), desc: t('Wykonaj 500 zadań.', 'Complete 500 quests.'), rune: 4, progress: (c) => [c.life.seals, 500] },
  { id: 'seals-1000', name: t('Tysiąc pieczęci', 'A Thousand Seals'), desc: t('Wykonaj 1000 zadań.', 'Complete 1000 quests.'), rune: 8, progress: (c) => [c.life.seals, 1000] },
  { id: 'perfect-30', name: t('Miesiąc bez skazy', 'A Flawless Month'), desc: t('Zalicz 30 pełnych dni.', 'Complete 30 full days.'), rune: 1, progress: (c) => [c.life.perfectDays, 30] },
  { id: 'passa-14', name: t('Dwa tygodnie ognia', 'Fortnight of Fire'), desc: t('Utrzymaj passę 14 pełnych dni z rzędu.', 'Keep a streak of 14 full days in a row.'), rune: 6, progress: (c) => [c.life.bestPerfectRun, 14] },
  { id: 'streak-60', name: t('Dwa księżyce', 'Two Moons'), desc: t('Seria 60 w jednym nawyku.', 'A 60-streak in one habit.'), rune: 2, progress: (c) => [c.life.bestStreak, 60] },
  { id: 'level-20', name: t('Wieczny płomień', 'Eternal Flame'), desc: t('Osiągnij 20. poziom.', 'Reach level 20.'), rune: 5, progress: (c) => [c.level, 20] },

  // powroty i tarcze
  { id: 'comeback-1', hidden: true, name: t('Feniks', 'Phoenix'), desc: t('Wróć z cienia po utracie passy.', 'Return from the shadows after losing a streak.'), rune: 1, progress: (c) => [c.comebacks, 1] },
  { id: 'comeback-3', hidden: true, name: t('Niezłomny', 'Unbroken'), desc: t('Wróć z cienia trzy razy.', 'Return from the shadows three times.'), rune: 0, progress: (c) => [c.comebacks, 3] },
  { id: 'shield-1', hidden: true, name: t('Tarcza w potrzebie', 'Shield in Need'), desc: t('Ocal passę tarczą.', 'Save a streak with a shield.'), rune: 6, progress: (c) => [c.shieldsUsed, 1] },

  // strażnicy tygodnia
  { id: 'boss-1', name: t('Pogromca strażnika', 'Wardenslayer'), desc: t('Pokonaj strażnika tygodnia.', 'Defeat a weekly warden.'), rune: 0, progress: (c) => [c.bosses, 1] },
  { id: 'boss-5', name: t('Łowca strażników', 'Warden Hunter'), desc: t('Pokonaj 5 strażników tygodnia.', 'Defeat 5 weekly wardens.'), rune: 4, progress: (c) => [c.bosses, 5] },
  { id: 'boss-all', hidden: true, name: t('Pan bestiariusza', 'Master of the Bestiary'), desc: t('Pokonaj każdego z 10 strażników.', 'Defeat each of the 10 wardens.'), rune: 7, progress: (c) => [c.bossKinds, 10] },

  // znaleziska, minimum dnia i zlecenia
  { id: 'relic-1', name: t('Pierwsze znalezisko', 'First Find'), desc: t('Znajdź relikt.', 'Find a relic.'), rune: 3, progress: (c) => [c.relicKinds, 1] },
  { id: 'relic-10', name: t('Kolekcjoner', 'Collector'), desc: t('Zbierz 10 różnych reliktów.', 'Collect 10 different relics.'), rune: 8, progress: (c) => [c.relicKinds, 10] },
  { id: 'relic-legend', hidden: true, name: t('Dotyk legendy', 'Touch of Legend'), desc: t('Znajdź legendarny relikt.', 'Find a legendary relic.'), rune: 5, progress: (c) => [c.legendaryRelic ? 1 : 0, 1] },
  { id: 'minimum-5', name: t('Mały krok', 'Small Step'), desc: t('Zalicz minimum dnia 5 razy.', 'Complete the minimum version 5 times.'), rune: 7, progress: (c) => [c.life.minimumsUsed, 5] },
  { id: 'commission-1', name: t('Najemnik', 'Sellsword'), desc: t('Wykonaj zlecenie dnia.', 'Complete a daily commission.'), rune: 6, progress: (c) => [c.life.commissionsDone, 1] },
]

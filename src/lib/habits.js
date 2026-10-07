// --- Katalog gotowych nawyków do podpowiedzi i ankiety doboru ------------------
// Kategoria, kolor i EXP nadal wynikają z nazwy (autoProps), więc nazwy są dobrane tak,
// żeby detectCategory trafiało we właściwy atrybut w obu językach.
//
// goals:  cele z ankiety, którym nawyk służy (pierwszy = główny)
//         str | end | vit | mind | calm | life
// when:   morning | midday | evening | any (o dowolnej porze) | allday (przez cały dzień, bez godziny)
// min:    ile minut zajmuje jedno wykonanie (0 = nie zajmuje osobnego czasu)
// lvl:    1 = dobry na start, 2 = dla osób z doświadczeniem
// fits:   styl dnia, przy którym nawyk szczególnie pomaga; unfit: przy którym nie ma sensu
// group:  z jednej grupy proponujemy najwyżej jeden nawyk (np. dwa warianty czytania)
// repeat: 'daily' (domyślnie) | 'workdays' | liczba = X razy w tygodniu

import { t } from './i18n.js'

const h = (id, pl, en, props) => ({ id, name: t(pl, en), when: 'any', min: 10, lvl: 1, fits: [], unfit: [], repeat: 'daily', ...props })
const steps = (...list) => list.map(([pl, en]) => t(pl, en))

export const HABITS = [
  // --- Siła ---
  h('pushups', 'Pompki 3 serie', 'Push-ups, 3 sets', { goals: ['str'], min: 10, repeat: 3, fits: ['desk', 'home', 'study'] }),
  h('squats', 'Przysiady 3×15', 'Squats 3×15', { goals: ['str'], min: 10, repeat: 3, fits: ['desk', 'home', 'study'] }),
  h('calisthenics', 'Kalistenika w domu', 'Home calisthenics', {
    goals: ['str', 'end'],
    min: 25,
    repeat: 3,
    fits: ['home', 'desk'],
    steps: steps(['Rozgrzewka', 'Warm-up'], ['Pompki', 'Push-ups'], ['Przysiady', 'Squats'], ['Deska', 'Plank'], ['Rozciąganie', 'Stretching']),
  }),
  h('strength', 'Trening siłowy FBW', 'Full-body strength workout', {
    goals: ['str'],
    min: 50,
    lvl: 2,
    repeat: 3,
    group: 'gym',
    steps: steps(['Rozgrzewka', 'Warm-up'], ['Przysiad', 'Squat'], ['Wyciskanie', 'Bench press'], ['Wiosłowanie', 'Rows'], ['Rozciąganie', 'Stretching']),
  }),
  h('pullups', 'Podciąganie na drążku', 'Pull-ups', { goals: ['str'], min: 10, lvl: 2, repeat: 3 }),
  h('plank', 'Deska 1 min', 'Plank 1 min', { goals: ['end', 'str'], min: 3, fits: ['desk', 'study'] }),

  // --- Kondycja ---
  h('walk', 'Spacer 20 min', 'Walk 20 min', { goals: ['end', 'calm'], min: 20, fits: ['desk', 'study', 'home'], unfit: ['physical'], group: 'walk' }),
  h('steps', '8000 kroków', '8,000 steps', { goals: ['end'], when: 'allday', min: 0, fits: ['desk', 'home'], unfit: ['physical'], group: 'walk' }),
  h('break-walk', 'Krótki spacer w przerwie', 'Short walk on a break', { goals: ['end', 'calm'], when: 'midday', min: 5, fits: ['desk', 'study'], unfit: ['physical', 'home'] }),
  h('walk-run', 'Marszobieg 15 min', 'Walk-run 15 min', { goals: ['end'], min: 15, repeat: 3, unfit: ['physical'], group: 'run' }),
  h('run', 'Bieganie 25 min', 'Run 25 min', { goals: ['end'], min: 25, lvl: 2, repeat: 3, group: 'run' }),
  h('bike', 'Rower 30 min', 'Bike ride 30 min', { goals: ['end'], min: 30, repeat: 2 }),
  h('stretch', 'Rozciąganie 10 min', 'Stretching 10 min', { goals: ['end', 'calm'], when: 'evening', min: 10, fits: ['physical', 'desk'] }),
  h('mobility', 'Mobilność bioder i pleców', 'Hip and back mobility', { goals: ['end'], when: 'morning', min: 10, fits: ['desk', 'physical', 'study'] }),

  // --- Zdrowie i sen ---
  h('water', 'Woda', 'Water', { goals: ['vit'], when: 'allday', min: 0, universal: true, kind: 'count', target: 8, unit: t('szklanek', 'glasses'), fits: ['physical'] }),
  h('sleep', 'Sen przed 23:00', 'Sleep by 11 pm', { goals: ['vit', 'calm'], when: 'evening', time: '22:45', min: 0, universal: true, unfit: ['shift'], group: 'sleep' }),
  h('sleep-shift', 'Sen 7–8 godzin', 'Sleep 7–8 hours', { goals: ['vit', 'calm'], when: 'allday', min: 0, universal: true, fits: ['shift'], group: 'sleep' }),
  h('veggies', 'Warzywa do każdego posiłku', 'Vegetables with every meal', { goals: ['vit'], when: 'allday', min: 0 }),
  h('protein-breakfast', 'Śniadanie z białkiem', 'Protein breakfast', { goals: ['vit', 'str'], when: 'morning', min: 10, unfit: ['shift'] }),
  h('no-sweets', 'Zdrowa dieta: bez słodyczy', 'Healthy diet: no sweets', { goals: ['vit'], when: 'allday', min: 0, kind: 'avoid', lvl: 2 }),
  h('vitamin-d', 'Witamina D', 'Vitamin D', { goals: ['vit'], when: 'morning', min: 0, fits: ['desk', 'shift'] }),
  h('cook', 'Gotowanie w domu', 'Cook at home', { goals: ['vit', 'life'], when: 'evening', min: 30, repeat: 3, fits: ['home', 'desk'] }),
  h('fruit', 'Owoc dziennie', 'A piece of fruit', { goals: ['vit'], when: 'allday', min: 0 }),

  // --- Umysł i nauka ---
  h('read', 'Czytanie 10 stron', 'Read 10 pages', { goals: ['mind', 'calm'], when: 'evening', min: 15, group: 'read' }),
  h('read-long', 'Czytanie 30 minut', 'Read for 30 minutes', { goals: ['mind'], when: 'evening', min: 30, lvl: 2, group: 'read' }),
  h('words', 'Nauka: 5 nowych słówek', 'Learn 5 new words', { goals: ['mind'], min: 3, fits: ['study', 'desk', 'shift'], group: 'language' }),
  h('language', 'Nauka języka 15 min', 'Language practice 15 min', { goals: ['mind'], min: 15, fits: ['study', 'desk'], group: 'language' }),
  h('focus', 'Nauka bez telefonu 45 min', 'Focused study 45 min', { goals: ['mind'], min: 45, lvl: 2, repeat: 'workdays', fits: ['study'] }),
  h('podcast', 'Podcast edukacyjny', 'Educational podcast', { goals: ['mind'], min: 20, fits: ['physical', 'shift', 'home'] }),
  h('course', 'Kurs online 20 min', 'Online course 20 min', { goals: ['mind'], min: 20, lvl: 2, repeat: 4, fits: ['desk', 'home'] }),
  h('journal', 'Dziennik: 3 zdania', 'Journal: 3 sentences', { goals: ['mind', 'calm'], when: 'evening', min: 5, group: 'journal' }),

  // --- Spokój ---
  h('meditation', 'Medytacja 5 min', 'Meditate 5 min', { goals: ['calm', 'mind'], when: 'morning', min: 5 }),
  h('breathing', 'Ćwiczenie oddechowe', 'Breathing exercise', { goals: ['calm'], min: 3, fits: ['physical', 'shift', 'study'] }),
  h('gratitude', 'Dziennik wdzięczności', 'Gratitude journal', { goals: ['calm', 'mind'], when: 'evening', min: 5, group: 'journal' }),
  h('phone-morning', 'Pierwsza godzina bez telefonu', 'No phone for the first hour', { goals: ['calm', 'life'], when: 'allday', min: 0, kind: 'avoid', lvl: 2, unfit: ['shift'] }),
  h('screens-night', 'Bez ekranów przed snem', 'No screens before bed', { goals: ['calm', 'vit', 'life'], when: 'allday', min: 0, kind: 'avoid' }),
  h('quiet-walk', 'Spacer bez telefonu', 'Walk without your phone', { goals: ['calm', 'end'], when: 'evening', min: 20, unfit: ['physical'], group: 'walk' }),

  // --- Porządek dnia ---
  h('plan-tomorrow', 'Zaplanuj jutro', 'Plan tomorrow', { goals: ['life'], when: 'evening', min: 5 }),
  h('tidy', 'Sprzątanie 10 min', 'Tidy up 10 min', { goals: ['life'], when: 'evening', min: 10, fits: ['home'] }),
  h('bed', 'Pościel łóżko', 'Make your bed', { goals: ['life'], when: 'morning', min: 2 }),
  h('inbox', 'Porządek w mailach', 'Clear your inbox', { goals: ['life'], when: 'midday', min: 10, lvl: 2, repeat: 'workdays', fits: ['desk'], unfit: ['physical', 'shift'] }),
  h('spending', 'Zapisz wydatki', 'Track your spending', { goals: ['life'], when: 'evening', min: 5 }),
  h('prep', 'Przygotuj rzeczy na jutro', 'Prep things for tomorrow', { goals: ['life'], when: 'evening', min: 10, fits: ['physical', 'study', 'shift'] }),
  h('wake', 'Pobudka o stałej porze', 'Wake up at the same time', { goals: ['life', 'vit'], when: 'morning', time: '07:00', min: 0, lvl: 2, unfit: ['shift'] }),
]

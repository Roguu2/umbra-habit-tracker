# Umbra — dokumentacja aplikacji

> Plik generowany automatycznie przy każdym commicie (`npm run docs`). Nie edytuj go ręcznie —
> opisy są w `scripts/docs/template.md`, a tabele i liczby generator `scripts/build-docs.mjs` czyta wprost z kodu.
> Wersja aplikacji: 1.0.0.

## 1. Czym jest Umbra

Umbra („Księga Nawyków”) to tracker nawyków w klimacie dark fantasy RPG. Użytkownik planuje dzień, odhacza zadania
(„wypala pieczęcie”), zdobywa EXP i poziomy, rozwija atrybuty postaci i odblokowuje nagrody.

- **Za darmo, bez konta.** Dane domyślnie leżą tylko w przeglądarce; synchronizacja i przypomnienia są opcjonalne.
- **Dwa języki:** polski i angielski (wykrywany z przeglądarki, zmiana w Ustawieniach).
- **PWA:** działa offline i można ją zainstalować na telefonie; przypomnienia przez Web Push.
- **Adres:** https://umbra-habits.netlify.app · repozytorium: https://github.com/Roguu2/umbra-habit-tracker

## 2. Architektura

- **Frontend:** React 19, Vite 7, Tailwind CSS 4, framer-motion. Czcionki (Cinzel, Cormorant Garamond, Inter) z własnego serwera.
- **Backend:** funkcje Netlify + Netlify Blobs: `/api/sync` (synchronizacja), `/api/push` (subskrypcje przypomnień)
  i zaplanowana funkcja `reminders` (co 5 minut). Lokalnie te same endpointy obsługuje serwer Vite (`vite.config.js`).
- **Wdrożenie:** Netlify buduje i publikuje każdy push na gałąź `main`.
- **Stan gry** to jeden obiekt w `localStorage` (`umbra-habit-tracker:v1`, wersja formatu 3): zadania, historia odhaczeń,
  kroki, liczniki, przerwy (urlop i tarcze), osiągnięcia, profil (imię, data startu, wybrana aura), najwyższy poziom.
  EXP **nie jest zapisywany** — zawsze liczy się z historii (suma EXP odhaczonych zadań z bonusami dnia plus bonusy za powroty z cienia).
- **Struktura kodu:** `src/lib` — czysta logika (gra, statystyki, harmonogram, atrybuty, nagrody, tarcze, katalog nawyków,
  dobór, poprzeczka, synchronizacja); `src/hooks` — stan Reacta (`useGame`, `useSync`, `usePush`); `src/components`
  i `src/views` — interfejs (zakładki Dziś, Plan, Postępy); `netlify/` — serwer.

## 3. Zadania (nawyki)

### Rodzaje
- **Do odhaczenia** — zwykłe zadanie.
- **Licznik** — cel liczbowy (2–99, np. 8 szklanek wody) z opcjonalną jednostką; zalicza się samo po osiągnięciu celu.
- **Czego unikam** — np. „Bez słodyczy”; odhacza się wieczorem, jeśli się wytrwało.
- **Kroki** (opcjonalne, nie dla licznika) — lista podzadań, np. ćwiczeń; zadanie zalicza się po odhaczeniu wszystkich kroków,
  a odhaczenie całego zadania zaznacza wszystkie kroki.

### Minimum dnia
Zwykłe zadanie (nie licznik i nie „czego unikam”) może mieć opcjonalną **wersję minimalną** — krótki opis na gorszy dzień,
np. „2 min” (pole „Wersja minimalna” w edytorze, do 32 znaków). Na karcie zadania jest wtedy osobny przycisk
„◐ Minimum”. Zaliczenie minimum to częściowe wykonanie:
- liczy się do pełnego dnia, passy, serii nawyku i wypalonych pieczęci (zadanie trafia do historii jak wykonane),
- daje 50% EXP zadania, zaokrąglone w górę (np. 25 → 13 EXP, 30 → 15 EXP, 15 → 8 EXP) — także w atrybutach i statystykach dnia,
- tego samego dnia można dokończyć pełną wersję (pieczęcią albo ostatnim krokiem) — EXP rośnie do 100%, bez dublowania;
  minimum można też cofnąć.

Technicznie: opis w `quest.minimum`, a zaliczenia minimum w `state.minimums[dzień] = [id zadań]` (scalane przy synchronizacji
jak historia, zachowane w kopii zapasowej).

### Powtarzanie
- **Jednorazowo** (konkretna data), **codziennie**, **pn–pt**, **wybrane dni tygodnia**.
- **X razy w tygodniu** (1–6×) — w dowolne dni. Taki nawyk nie jest wymagany w żadnym konkretnym dniu, więc nie psuje pełnego dnia;
  jego seria liczy się w tygodniach z osiągniętym celem.
- Godzina jest opcjonalna. Zadania bez godziny lądują na końcu dnia w kolejności ułożonej przez użytkownika (przeciąganie lub strzałki).

### Kategoria, kolor i EXP — z nazwy
Użytkownik niczego nie wybiera: kategoria (atrybut), kolor runy i EXP wynikają ze słów w nazwie. Pierwsza pasująca kategoria wygrywa
(kolejność jak w tabeli); słowa polskie i angielskie działają w obu językach. Zmiana nazwy zmienia kategorię i EXP — także wstecz,
bo EXP liczy się z historii według obecnej wartości zadania.

| Kategoria (atrybut) | Klucz | Kolor | EXP za wykonanie | Słowa w nazwie, które ją wybierają |
| --- | --- | --- | --- | --- |
| Zdrowie | `vit` | złoty | 25 | `posił`, `jedz`, `białk`, `bialk`, `skyr`, `śniad`, `sniad`, `obiad`, `kolac`, `dieta`, `kalor`, `warzyw`, `owoc`, `wod`, `pić`, `pic`, `nawodn`, `sen`, `snu`, `spać`, `spac`, `spanie`, `drzemk`, `suplement`, `kreatyn`, `witamin`, `gotow`, `air fryer`, `meal`, `protein`, `zdrow`, `eat`, `breakfast`, `brunch`, `lunch`, `dinner`, `supper`, `bread`, `water`, `drink`, `hydrat`, `sleep`, `nap`, `vitamin`, `supplement`, `creatine`, `cook`, `diet`, `calorie`, `fruit`, `veggie`, `vegetable`, `salad`, `health` |
| Umysł | `mind` | złoty | 25 | `czyt`, `książ`, `ksiaz`, `nauk`, `ucz`, `medyt`, `dziennik`, `journal`, `kurs`, `język`, `jezyk`, `angiel`, `niemiec`, `programow`, `kod`, `pisa`, `oddech`, `modlit`, `podcast`, `read`, `book`, `study`, `learn`, `meditat`, `course`, `language`, `english`, `spanish`, `german`, `french`, `code`, `coding`, `program`, `write`, `writing`, `breath`, `pray`, `lesson`, `homework` |
| Kondycja | `end` | krwawy | 30 | `core`, `brzuch`, `plank`, `deska`, `bieg`, `biega`, `cardio`, `kardio`, `rower`, `spacer`, `krok`, `pływ`, `plyw`, `rozciąg`, `rozciag`, `stretch`, `joga`, `yoga`, `mobiln`, `skakank`, `marsz`, `hiit`, `kondycj`, `run`, `jog`, `bike`, `cycling`, `walk`, `steps`, `swim`, `mobility`, `jump rope`, `hike`, `hiking`, `abs`, `rowing` |
| Siła | `str` | krwawy | 40 | `trening`, `siłow`, `silow`, `upper`, `lower`, `push`, `pull`, `nogi`, `klat`, `plecy`, `barki`, `ramion`, `ciężar`, `ciezar`, `przysiad`, `martwy`, `wyciska`, `pompk`, `podciąg`, `podciag`, `kalisten`, `gym`, `fbw`, `split`, `hantl`, `sztang`, `workout`, `training`, `lift`, `strength`, `squat`, `deadlift`, `bench`, `calisthen`, `weights`, `dumbbell`, `barbell`, `leg day`, `chest`, `arms`, `shoulder` |
| Codzienność | `life` | złoty | 15 | — (wszystko, co nie pasuje wyżej) |

### Usuwanie
Zadanie z historią trafia do archiwum (statystyki zostają), nieużywane znika całkowicie.

## 4. Dzień i plan

- **Dziś:** zadania pogrupowane na pory dnia (rano do 12:00, popołudnie do 17:00, wieczór, „w ciągu dnia” — bez godziny).
  Wyróżnione „Następne” to pierwsze niewykonane zadanie z godziną, która nie minęła (z godzinnym zapasem).
  Nawyki „X razy w tygodniu” są widoczne, dopóki cel tygodnia nie jest osiągnięty (albo gdy zrobiono je dziś).
- **Licznik dnia (HUD):** zaplanowane na dziś + wszystko, co dziś zrobiono ponad plan (nawyki tygodniowe, zadania spoza planu);
  te drugie wchodzą do licznika dopiero po wykonaniu.
- **Pełny dzień („Dzień zdobyty”):** wykonane wszystkie zadania zaplanowane na ten dzień (co najmniej jedno), dzień nie jest przerwą.
  Same zadania ponad plan w dzień bez planu dają licznik np. 1/1, ale nie „Dzień zdobyty”.
- **Plan:** tydzień w kafelkach (z nawigacją), panel wybranego dnia z szybkim dodawaniem, lista stałych nawyków.
  Nawyki tygodniowe są w każdym kafelku z postępem tygodnia (np. 1/2); po osiągnięciu celu przygasają w dniach bez wykonania.
- **Jutro:** podgląd zaplanowanych zadań i skrót do planowania.
- Aplikacja sama przechodzi na nowy dzień po północy (sprawdza datę co 30 s).

### Efekt odhaczenia i combo
- Odhaczenie pieczęci daje uderzenie w kowadło, iskry, falę i (na telefonie) krótką wibrację. Siła rośnie z EXP zadania:
  zwykłe zadania (ok. 15–25 EXP) mają subtelny efekt, trudne (40 EXP i więcej) — więcej iskier, mocniejszy dźwięk.
- **Combo:** kolejne odhaczenia tego samego dnia w odstępach do 90 s wzmacniają efekt — wyższy ton,
  dodatkowe dźwięczenie, więcej iskier, kolor przechodzący w złoto i napis „Combo ×N” (do ×5). Combo żyje tylko
  w pamięci — nic nie jest zapisywane i nie wpływa na EXP.
- **Finał dnia:** zdobycie pełnego dnia w trakcie sesji kończy się krótkim rozbłyskiem pierścienia w HUD i fanfarą
  (krótszą niż przy awansie). Po przeładowaniu strony z już pełnym dniem finał się nie powtarza.
- Wszystko szanuje ustawienia: wyciszony dźwięk wyłącza też wibracje, a przy `prefers-reduced-motion` zostaje tylko
  krótki błysk (bez iskier, fal i wibracji).

## 5. EXP i poziomy

- EXP za zadanie zależy od kategorii (tabela wyżej); zaliczenie samego minimum dnia daje połowę (w górę),
  kategoria z przepowiedni dnia daje +20%, a zlecenie dnia wykonane w dniu przyjęcia +25%
  (sekcja 11; bonusy się sumują). Wynik jest zaokrąglany do pełnego EXP.
  EXP potrzebny na poziom: 100 + 40 × (poziom − 1).
- **Najwyższy osiągnięty poziom** (`maxLevel`) nigdy nie spada i to on odblokowuje nagrody.
- Awans pokazuje okno z nowym tytułem, cytatem, wszystkimi nagrodami z przeskoczonych poziomów i zapowiedzią następnej.
  Pod paskiem EXP w HUD stale widać najbliższą nagrodę i brakujące EXP.

| Poziom | EXP na ten poziom | EXP łącznie od zera | Tytuł | Nagrody |
| --- | --- | --- | --- | --- |
| 1 | 100 | 0 | Nowicjusz Popiołu | Krwawa Aura |
| 2 | 140 | 100 | Nowicjusz Popiołu | Popielna Aura |
| 3 | 180 | 240 | Strażnik Zmierzchu | Pieczęć Strażnika |
| 4 | 220 | 420 | Strażnik Zmierzchu | Aura Zmierzchu |
| 5 | 260 | 640 | Rycerz Krwawego Księżyca | Pieczęć Krwawego Księżyca, Tarcza passy |
| 6 | 300 | 900 | Rycerz Krwawego Księżyca | — |
| 7 | 340 | 1200 | Rycerz Krwawego Księżyca | Widmowa Aura |
| 8 | 380 | 1540 | Pogromca Cieni | Pieczęć Pogromcy |
| 9 | 420 | 1920 | Pogromca Cieni | — |
| 10 | 460 | 2340 | Pogromca Cieni | Aura Otchłani, Tarcza passy |
| 11 | 500 | 2800 | Pogromca Cieni | — |
| 12 | 540 | 3300 | Władca Otchłani | Pieczęć Otchłani |
| 13 | 580 | 3840 | Władca Otchłani | — |
| 14 | 620 | 4420 | Władca Otchłani | — |
| 15 | 660 | 5040 | Władca Otchłani | Piekielna Aura, Tarcza passy |
| 16 | 700 | 5700 | Władca Otchłani | — |
| 17 | 740 | 6400 | Władca Otchłani | — |
| 18 | 780 | 7140 | Władca Otchłani | — |
| 19 | 820 | 7920 | Władca Otchłani | — |
| 20 | 860 | 8740 | Wieczny Płomień | Pieczęć Wiecznego Płomienia, Tarcza passy |

## 6. Nagrody za poziomy

Nagrody są kosmetyczne (aury, pieczęcie) albo użytkowe (tarcze passy) — żadna funkcja aplikacji nie jest blokowana poziomem.
Wszystkie są na **ścieżce nagród** w zakładce Postępy (zdobyte, najbliższa z brakującym EXP, dalsze zakryte jako „???”).

- **Aury** zmieniają kolory tła (poświaty i unoszące się drobiny). Zdobytą aurę zakłada się na ścieżce nagród albo przyciskiem
  „Przywdziej” w oknie awansu; wybór zapisuje się w profilu i synchronizuje.
- **Krwawa Aura** (poziom 1) — domyślna
- **Popielna Aura** (poziom 2)
- **Aura Zmierzchu** (poziom 4)
- **Widmowa Aura** (poziom 7)
- **Aura Otchłani** (poziom 10)
- **Piekielna Aura** (poziom 15)
- **Pieczęcie** — emblemat poziomu w HUD; zmienia się sam razem z rangą (tytułem): więcej kręgów, kresek i inna poświata.
- **Tarcze passy** — co 5 poziomów (opis w sekcji 7).

## 7. Passa, serie, urlop i tarcze

- **Passa** — pełne dni z rzędu. Dni bez planu oraz dni przerwy są **neutralne**: nie przerywają passy i jej nie wydłużają.
  Dzień bez żadnego zaplanowanego zadania jest neutralny także wtedy, gdy zrobiono w nim coś dodatkowo (zadania spoza planu,
  nawyki „X razy w tygodniu”) — EXP za te zadania liczy się normalnie, ale dzień nie jest „pełny” (nie wchodzi do pełnych dni,
  osiągnięć za pełne dni ani skuteczności). W kalendarzu taki dzień ma własny, neutralny kolor z opisem aktywności ponad plan.
  Dzisiejszy dzień dolicza się, gdy jest pełny; dopóki trwa, nie przerywa passy.
- **Wypalone pieczęcie (łącznie)** — liczba wszystkich wykonań zadań w historii, widoczna w panelu Passy i w Postępach.
  Liczona z historii (jak EXP), nigdy nie spada i nie zeruje się po utracie passy; dni przerwy i tarcze jej nie zwiększają.
  Z niej liczą się też osiągnięcia za liczbę wykonanych zadań.
- **Seria nawyku** — kolejne zaplanowane dni z wykonaniem (dni wolne od nawyku i przerwy nie przerywają; dodatkowe wykonanie
  w dzień wolny też się liczy). Dla nawyków „X razy w tygodniu” — kolejne tygodnie z osiągniętym celem (bieżący tydzień i tygodnie
  z przerwą nie przerywają serii).
- **Tryb urlopu** (Ustawienia) — od dziś do odwołania; dni urlopu nie liczą się do passy, serii ani skuteczności i nie przychodzą
  przypomnienia. Wyłączenie kończy przerwę wczoraj, więc dzisiejszy dzień znów się liczy.
- **Tarcze passy** — jedna co 5 osiągniętych poziomów (licznik w panelu Passy). Gdy passa licząca co najmniej
  3 dni właśnie przepadła przez 1–3 niepełnych dni (od wczoraj wstecz) i tarcz wystarczy,
  panel Passy proponuje „Użyj tarczy”. Użyta tarcza to jednodniowa przerwa (jak urlop) oznaczona jako tarcza — passa i serie wracają.
  Dłuższej przerwy tarcze nie łatają. W kalendarzu taki dzień jest opisany jako „tarcza passy”.
- **Powrót z cienia** — gdy przepadnie passa licząca co najmniej 3 dni (i nie uratuje jej tarcza), pierwszy dzień
  z wykonanym zadaniem po jej utracie daje jednorazowy komunikat „Wracasz z cienia” i +20 EXP; tego dnia panel Passy
  zamiast zachęty po utracie pokazuje powrót. Zadania wykonane w samym dniu utraty się nie liczą (passa przepada z jego końcem).
  Bonus wynika z historii, jak cały EXP: gdy później użyjesz tarczy na dzień utraty, passa wraca, a powrót i bonus znikają.
  Komunikat pokazuje się raz na powrót — także po przeładowaniu i na innych urządzeniach (pole `comebackSeen` w stanie gry).

## 8. Atrybuty i klasa postaci

- Każda kategoria to atrybut z własnym poziomem, liczonym z EXP zadań tej kategorii:
  EXP na poziom atrybutu = 50 + 25 × (poziom − 1). Karta postaci (zakładka Postępy) pokazuje radar i paski.
- **Klasa** wynika z proporcji atrybutów: poniżej 100 EXP łącznie — brak klasy; jeden atrybut ≥ 1,6× drugiego — klasa solo;
  dwa atrybuty ≥ 1,4× trzeciego — klasa pary (para z Codziennością liczy się jak solo drugiego atrybutu); inaczej — równowaga.

| Dominujący atrybut | Klasa | Opis |
| --- | --- | --- |
| Siła | Berserker | Siła płynie w twoich żyłach. Ciężary uginają się przed twoją wolą. |
| Kondycja | Łowca Cieni | Niezmordowany. Pokonujesz kolejne mile, gdy inni już dawno padli. |
| Zdrowie | Druid Krwi | Dbasz o ciało jak o świątynię — posiłki, sen i woda to twoje rytuały. |
| Umysł | Mnich Popiołu | Umysł ostry jak klinga. Księgi i cisza to twój oręż. |
| Codzienność | Strażnik Ogniska | Utrzymujesz porządek codzienności. Małe czyny budują wielkie rzeczy. |

| Para atrybutów | Klasa | Opis |
| --- | --- | --- |
| Kondycja + Siła | Wojownik Burzy | Siła i wytrzymałość w jednym ciele. Pole bitwy należy do ciebie. |
| Umysł + Siła | Rycerz Run | Miecz w dłoni, wiedza w głowie. Rzadkie i groźne połączenie. |
| Siła + Zdrowie | Gladiator | Trenujesz ciężko i karmisz ciało jak należy. Arena czeka. |
| Kondycja + Umysł | Wędrowny Asceta | Długie drogi i długie myśli. Spokój w ruchu. |
| Kondycja + Zdrowie | Zwiadowca | Zawsze w drodze, zawsze w formie. Ciało gotowe na każdy szlak. |
| Umysł + Zdrowie | Alchemik | Wiedza i zdrowie splecione w jedno. Warzysz eliksir lepszego życia. |

Równowaga: **Paladyn Równowagi** — Żaden atrybut nie dominuje — rozwijasz się na wszystkich frontach.

Za mało EXP: **Bezimienny** — Twoja ścieżka dopiero się kształtuje. Wypalaj pieczęcie, a klasa sama się objawi.

### Słaby punkt i podpowiedzi
Spośród Siły, Kondycji, Zdrowia i Umysłu aplikacja wskazuje atrybut, który **kuleje** (w ostatnich 14 zakończonych dniach
zaplanowano co najmniej 3 zadania, a wykonano mniej niż połowę — najgorszy pierwszy) albo jest **nieodkryty** (brak zadań i EXP).
Podpowiedź (Karta postaci i panel „Podpowiedź” na ekranie Dziś) proponuje gotowy nawyk z katalogu z tego atrybutu, którego nie ma
w planie — od najłatwiejszych. Przyciski: „Dodaj do planu”, „↻ Inny”, „Nie teraz” (ukrywa do końca dnia na tym urządzeniu).
Nawyk z podpowiedzi startuje łagodniej: nawyki „X razy w tygodniu” powyżej 2× dostają o jeden raz mniej.

## 9. Osiągnięcia

| Osiągnięcie | Warunek | Id |
| --- | --- | --- |
| Pierwsza krew | Wykonaj pierwsze zadanie. | `first-seal` |
| Krąg pięćdziesięciu | Wykonaj 50 zadań. | `seals-50` |
| Ściana run | Wykonaj 200 zadań. | `seals-200` |
| Dzień bez skazy | Wykonaj cały plan dnia. | `perfect-1` |
| Dziesięć nieskalanych | Zalicz 10 pełnych dni. | `perfect-10` |
| Siedem nocy | Seria 7 w jednym nawyku. | `streak-7` |
| Księżycowy cykl | Seria 30 w jednym nawyku. | `streak-30` |
| Krwawy Księżyc | Osiągnij 5. poziom. | `level-5` |
| Głos Otchłani | Osiągnij 10. poziom. | `level-10` |
| Kowal przysiąg | Dodaj własne zadanie do planu. | `forge-1` |
| Strateg | Zaplanuj coś na przyszły dzień. | `planner` |
| Tydzień chwały | 5 pełnych dni w jednym tygodniu. | `week-goal` |

Osiągnięcie zdobyte na innym urządzeniu (przez synchronizację) nie jest ogłaszane ponownie.

## 10. Strażnik tygodnia (boss)

Lekki cel tygodnia (pn–nd) na ekranie Dziś: pasek wytrzymałości bossa, który topnieje od prawdziwych wykonań zadań.
Nie ma tur, HP gracza ani losowości — i nie ma porażki.

- **Boss tygodnia** wybierany jest deterministycznie z numeru tygodnia (liczonego z daty poniedziałku w UTC), więc
  w danym tygodniu wszyscy i na każdym urządzeniu mają tego samego bossa. Słabości rotują co tydzień.
- **Obrażenia** = EXP każdego wykonania z bieżącego tygodnia (minimum dnia liczy się tak jak w EXP, a zadania spoza planu
  i nawyki „X razy w tygodniu” też ranią). Zadania z atrybutu będącego słabością bossa ranią ×1,5.
- **Wytrzymałość** = 75% średniego tygodniowego EXP z ostatnich 4 pełnych tygodni bez urlopu,
  zaokrąglone do 10, w granicach 100–1200. Gracz z mniej niż 2 takimi tygodniami
  (np. nowy) dostaje stałe 150. Liczona z poprzednich tygodni, więc nie zmienia się w trakcie bieżącego.
- **Brak bossa** w tygodniu z urlopem (choćby jeden dzień; tarcza passy się nie liczy) i w tygodniu bez planu
  (żadne zadanie nie jest zaplanowane na ten tydzień i nie ma nawyku „X razy w tygodniu”).
- **Brak porażki:** niepokonany boss znika z końcem tygodnia. Boss nie wpływa na passę, serie ani EXP.
- **Nagroda** jest wyłącznie kosmetyczna: relikt w bestiariuszu „Pokonani strażnicy” (zakładka Postępy) — zdobyte relikty
  z datą i liczbą pokonań, niepokonani zakryci jako „???”.
- Pokonanie bossa w trakcie sesji pokazuje krótką animację (ok. 1,2 s; bez ruchu przy `prefers-reduced-motion`).
- Wszystko (postęp, pokonanie, bestiariusz) wynika z historii — bez osobnego licznika obrażeń i bez nowych pól w stanie gry.

| # | Strażnik | Słabość | Relikt | Opis |
| --- | --- | --- | --- | --- |
| 1 | Bezduszny Rycerz | Siła | Pęknięty hełm | Pusta zbroja, która wciąż pamięta rozkazy. Tylko siła rozbija tę stal. |
| 2 | Popielny Golem | Kondycja | Rdzeń z żużlu | Ociężały kolos z popiołu i żużlu. Rozsypuje się pod ciosami tych, którzy nie ustają w ruchu. |
| 3 | Widmo Bezsenności | Zdrowie | Zgaszona latarnia | Szepcze nocą i kradnie sen. Słabnie, gdy dbasz o ciało. |
| 4 | Wiedźma z Mokradeł | Umysł | Splątany różaniec | Plącze myśli jak sieci. Jasny umysł przecina jej uroki. |
| 5 | Hydra Bałaganu | Codzienność | Ząb hydry | Za każdą odciętą głową rosną dwie zaległe sprawy. Porządek ją dusi. |
| 6 | Żelazny Ogr | Siła | Żelazna obręcz | Wali pięściami jak taranem. Uszanuje tylko większą siłę. |
| 7 | Łowca we Mgle | Kondycja | Szary płaszcz | Krąży, aż zmęczysz się pierwszy. Wytrwali dochodzą go do końca. |
| 8 | Szczurzy Król | Zdrowie | Korona z kości | Gnieździ się tam, gdzie ciało zaniedbane. Zdrowe nawyki wypłaszają go na światło. |
| 9 | Szepcząca Księga | Umysł | Zapieczętowana karta | Księga, która czyta ciebie. Pokona ją ten, kto sam czyta i uczy się więcej. |
| 10 | Chochlik Chaosu | Codzienność | Klucz chochlika | Przestawia rzeczy, gubi klucze, psuje plany. Rutyna to jego klatka. |

## 11. Przepowiednia, znaleziska i zlecenie dnia

Elementy „szczęścia” są deterministyczne: wynik wylicza się z daty (i id zadania) stałym skrótem (hash), więc ten sam dzień daje
ten sam wynik na każdym urządzeniu, w każdej strefie czasowej i po przeładowaniu — bez zapisywania losowań w stanie gry.
Nie ma nagród za samo otwarcie aplikacji ani niczego płatnego.

### Przepowiednia dnia
- Karta na ekranie Dziś z krótkim tekstem i kategorią dnia: zadania z tej kategorii dają tego dnia **+20% EXP**.
- Bonus wlicza się w EXP wykonania (jedno źródło EXP), więc spójnie w poziomie, atrybutach, statystykach dnia i obrażeniach
  strażnika tygodnia. Karta zadania pokazuje EXP z bonusem i znaczek „✦ +20%”.
- Przepowiednie działają od 2026-10-08 — wcześniejsze dni nie dostają bonusu, żeby nie zmieniać EXP wstecz.

### Znaleziska (relikty)
- Każde wykonanie zadania ma ok. 8% szansy na relikt (osobno dla każdego zadania w każdym dniu). Rzadkość:
  pospolity 70%, rzadki 25%, legendarny 5%. Relikty są wyłącznie kosmetyczne — nie dają EXP.
- Przy znalezisku w trakcie sesji pokazuje się krótki komunikat u góry ekranu (nie blokuje). Kolekcja „Znaleziska” w Postępach
  jest wyliczana z całej historii (także sprzed dodania reliktów): zdobyte z datą pierwszego znalezienia i liczbą, reszta
  jako „???”. Relikty znalezisk to co innego niż relikty za pokonanych strażników (te są w bestiariuszu).

| Relikt | Rzadkość | Opis |
| --- | --- | --- |
| Zardzewiały gwóźdź | pospolity | Wyrwany z drzwi starej kuźni. |
| Odłamek żaru | pospolity | Wciąż ciepły, choć ogień dawno zgasł. |
| Kościana kostka | pospolity | Zawsze wypada szóstka. Prawie zawsze. |
| Pióro z popiołu | pospolity | Rozsypuje się, gdy przestajesz w nie wierzyć. |
| Żelazny pierścień | pospolity | Zostawia na palcu ślad przysięgi. |
| Skrzydło ćmy | pospolity | Pachnie świecą, przy której ktoś czytał do świtu. |
| Kamień z rzeki | pospolity | Gładki od lat cierpliwego płynięcia. |
| Woskowa pieczęć | pospolity | Odcisk herbu, którego nikt już nie pamięta. |
| Ogarek świecy | pospolity | Wystarczy na jeszcze jedną noc. |
| Krucze pióro | pospolity | Pisze tylko prawdę. Atrament nie jest potrzebny. |
| Sakiewka soli | pospolity | Na progu chroni przed tym, co czai się w mroku. |
| Wyszczerbiona runa | pospolity | Jej znaczenie zatarł czas, moc została. |
| Fiolka krwi | rzadki | Szkło pulsuje w rytm twojego serca. |
| Srebrny klucz | rzadki | Otwiera drzwi, których jeszcze nie znalazłeś. |
| Wilczy kieł | rzadki | Należał do przewodnika stada, który nigdy nie zawrócił. |
| Mapa gwiazd | rzadki | Gwiazdy na niej przesuwają się nocą. |
| Moneta przysięgi | rzadki | Wybita dla tych, którzy dotrzymują słowa wobec siebie. |
| Mroźna latarnia | rzadki | Świeci zimnym światłem, które nie gaśnie na wietrze. |
| Popiół feniksa | legendarny | Garść popiołu, z której zawsze coś się odradza. |
| Korona Zmierzchu | legendarny | Nosił ją ktoś, kto nigdy nie odpuścił. Teraz czeka na ciebie. |

### Zlecenie dnia
- Raz dziennie karta na ekranie Dziś proponuje jeden łatwy nawyk z katalogu (sekcja 12), którego nie ma w planie; kolejność
  kandydatów wynika z daty. Przyciski: „Dodaj do planu”, „↻ Inne” (jedna zmiana dziennie) i „Nie teraz” (ukrywa do końca
  dnia na tym urządzeniu — tak jak podpowiedź słabego punktu). W trybie urlopu karta się nie pokazuje.
- Przyjęte zlecenie to zwykłe zadanie w planie z zapamiętanym dniem przyjęcia (`quest.commission`). Jego wykonanie w tym dniu
  daje **+25% EXP** — liczone z historii jak każdy EXP; bonus sumuje się z przepowiednią dnia.
  Po przyjęciu karta pokazuje postęp zlecenia zamiast nowej propozycji.

## 12. Dobór nawyków (ankieta)

Ankieta otwiera się automatycznie po pierwszym samouczku, jeśli plan jest pusty; można ją też uruchomić z pustego planu
(„Nie wiesz od czego zacząć?”) i z Ustawień („Dobierz nawyki”). Wszystko działa lokalnie — odpowiedzi nigdzie nie wychodzą.

**Pytania:**
1. Co chcesz wzmocnić? — 1–2 z: Siła, Kondycja, Zdrowie i sen, Umysł i nauka, Spokój, Porządek dnia.
2. Jak wygląda twój zwykły dzień? — praca przy biurku, praca fizyczna, nauka lub studia, praca zmianowa, głównie w domu.
3. Kiedy masz chwilę dla siebie? — rano, w ciągu dnia, wieczorem (pomijane przy pracy zmianowej).
4. Ile czasu dziennie? — około 5 minut, około 15 minut, 30 minut i więcej.
5. Skąd startujesz? — dopiero zaczynam / mam już jakieś nawyki.

**Zasady doboru:**
- „około 5 minut” → razem do 8 min dziennie, 3 nawyki (początkujący: 3 nawyki)
- „około 15 minut” → razem do 20 min dziennie, 4 nawyki (początkujący: 3 nawyki)
- „30 minut i więcej” → razem do 60 min dziennie, 5 nawyków (początkujący: 3 nawyki)
- Każdy wybrany cel dostaje co najmniej jeden nawyk; najwyżej 2 nawyki z tym samym głównym celem i 1 z tej samej grupy
  (np. dwa warianty czytania); nawyki „nie dla” danego stylu dnia są pomijane; nie proponuje nawyków, które już są w planie.
- Punktacja: trafienie w cel, główny cel nawyku, nawyki uniwersalne (woda, sen), dopasowanie do stylu dnia, poziom trudności
  (początkujący dostają łatwe), zgodność pory dnia.
- Godziny: rano 07:30, w ciągu dnia 12:30, wieczorem 19:30; kolejne nawyki z tej samej pory idą
  jeden po drugim. Przy pracy zmianowej — bez godzin. Początkujący dostają nawyki tygodniowe o jeden raz rzadziej (powyżej 2×).
- Na ekranie wyniku można odznaczyć nawyk albo wymienić go na inną propozycję (↻).

### Katalog nawyków (44)

| Nawyk | Kategoria | Cele w ankiecie | Pora | Min. | Poziom | Powtarzanie | Rodzaj | Pasuje do | Nie dla |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Pompki 3 serie | Siła | Siła | dowolnie | 10 | start | 3× w tyg. | odhaczenie | biurko, dom, nauka | — |
| Przysiady 3×15 | Siła | Siła | dowolnie | 10 | start | 3× w tyg. | odhaczenie | biurko, dom, nauka | — |
| Kalistenika w domu | Siła | Siła, Kondycja | dowolnie | 25 | start | 3× w tyg. | odhaczenie | dom, biurko | — |
| Trening siłowy FBW | Siła | Siła | dowolnie | 50 | zaawans. | 3× w tyg. | odhaczenie | — | — |
| Podciąganie na drążku | Siła | Siła | dowolnie | 10 | zaawans. | 3× w tyg. | odhaczenie | — | — |
| Deska 1 min | Kondycja | Kondycja, Siła | dowolnie | 3 | start | codziennie | odhaczenie | biurko, nauka | — |
| Spacer 20 min | Kondycja | Kondycja, Spokój | dowolnie | 20 | start | codziennie | odhaczenie | biurko, nauka, dom | praca fizyczna |
| 8000 kroków | Kondycja | Kondycja | cały dzień | 0 | start | codziennie | odhaczenie | biurko, dom | praca fizyczna |
| Krótki spacer w przerwie | Kondycja | Kondycja, Spokój | w ciągu dnia | 5 | start | codziennie | odhaczenie | biurko, nauka | praca fizyczna, dom |
| Marszobieg 15 min | Kondycja | Kondycja | dowolnie | 15 | start | 3× w tyg. | odhaczenie | — | praca fizyczna |
| Bieganie 25 min | Kondycja | Kondycja | dowolnie | 25 | zaawans. | 3× w tyg. | odhaczenie | — | — |
| Rower 30 min | Kondycja | Kondycja | dowolnie | 30 | start | 2× w tyg. | odhaczenie | — | — |
| Rozciąganie 10 min | Kondycja | Kondycja, Spokój | wieczorem | 10 | start | codziennie | odhaczenie | praca fizyczna, biurko | — |
| Mobilność bioder i pleców | Kondycja | Kondycja | rano | 10 | start | codziennie | odhaczenie | biurko, praca fizyczna, nauka | — |
| Woda | Zdrowie | Zdrowie i sen | cały dzień | 0 | start | codziennie | licznik (8 szklanek) | praca fizyczna | — |
| Sen przed 23:00 | Zdrowie | Zdrowie i sen, Spokój | wieczorem (22:45) | 0 | start | codziennie | odhaczenie | — | zmiany |
| Sen 7–8 godzin | Zdrowie | Zdrowie i sen, Spokój | cały dzień | 0 | start | codziennie | odhaczenie | zmiany | — |
| Warzywa do każdego posiłku | Zdrowie | Zdrowie i sen | cały dzień | 0 | start | codziennie | odhaczenie | — | — |
| Śniadanie z białkiem | Zdrowie | Zdrowie i sen, Siła | rano | 10 | start | codziennie | odhaczenie | — | zmiany |
| Zdrowa dieta: bez słodyczy | Zdrowie | Zdrowie i sen | cały dzień | 0 | zaawans. | codziennie | unikam | — | — |
| Witamina D | Zdrowie | Zdrowie i sen | rano | 0 | start | codziennie | odhaczenie | biurko, zmiany | — |
| Gotowanie w domu | Zdrowie | Zdrowie i sen, Porządek dnia | wieczorem | 30 | start | 3× w tyg. | odhaczenie | dom, biurko | — |
| Owoc dziennie | Zdrowie | Zdrowie i sen | cały dzień | 0 | start | codziennie | odhaczenie | — | — |
| Czytanie 10 stron | Umysł | Umysł i nauka, Spokój | wieczorem | 15 | start | codziennie | odhaczenie | — | — |
| Czytanie 30 minut | Umysł | Umysł i nauka | wieczorem | 30 | zaawans. | codziennie | odhaczenie | — | — |
| Nauka: 5 nowych słówek | Umysł | Umysł i nauka | dowolnie | 3 | start | codziennie | odhaczenie | nauka, biurko, zmiany | — |
| Nauka języka 15 min | Umysł | Umysł i nauka | dowolnie | 15 | start | codziennie | odhaczenie | nauka, biurko | — |
| Nauka bez telefonu 45 min | Umysł | Umysł i nauka | dowolnie | 45 | zaawans. | pn–pt | odhaczenie | nauka | — |
| Podcast edukacyjny | Umysł | Umysł i nauka | dowolnie | 20 | start | codziennie | odhaczenie | praca fizyczna, zmiany, dom | — |
| Kurs online 20 min | Umysł | Umysł i nauka | dowolnie | 20 | zaawans. | 4× w tyg. | odhaczenie | biurko, dom | — |
| Dziennik: 3 zdania | Umysł | Umysł i nauka, Spokój | wieczorem | 5 | start | codziennie | odhaczenie | — | — |
| Medytacja 5 min | Umysł | Spokój, Umysł i nauka | rano | 5 | start | codziennie | odhaczenie | — | — |
| Ćwiczenie oddechowe | Umysł | Spokój | dowolnie | 3 | start | codziennie | odhaczenie | praca fizyczna, zmiany, nauka | — |
| Dziennik wdzięczności | Umysł | Spokój, Umysł i nauka | wieczorem | 5 | start | codziennie | odhaczenie | — | — |
| Pierwsza godzina bez telefonu | Codzienność | Spokój, Porządek dnia | cały dzień | 0 | zaawans. | codziennie | unikam | — | zmiany |
| Bez ekranów przed snem | Codzienność | Spokój, Zdrowie i sen, Porządek dnia | cały dzień | 0 | start | codziennie | unikam | — | — |
| Spacer bez telefonu | Kondycja | Spokój, Kondycja | wieczorem | 20 | start | codziennie | odhaczenie | — | praca fizyczna |
| Zaplanuj jutro | Codzienność | Porządek dnia | wieczorem | 5 | start | codziennie | odhaczenie | — | — |
| Sprzątanie 10 min | Codzienność | Porządek dnia | wieczorem | 10 | start | codziennie | odhaczenie | dom | — |
| Pościel łóżko | Codzienność | Porządek dnia | rano | 2 | start | codziennie | odhaczenie | — | — |
| Porządek w mailach | Codzienność | Porządek dnia | w ciągu dnia | 10 | zaawans. | pn–pt | odhaczenie | biurko | praca fizyczna, zmiany |
| Zapisz wydatki | Codzienność | Porządek dnia | wieczorem | 5 | start | codziennie | odhaczenie | — | — |
| Przygotuj rzeczy na jutro | Codzienność | Porządek dnia | wieczorem | 10 | start | codziennie | odhaczenie | praca fizyczna, nauka, zmiany | — |
| Pobudka o stałej porze | Codzienność | Porządek dnia, Zdrowie i sen | rano (07:00) | 0 | zaawans. | codziennie | odhaczenie | — | zmiany |

## 13. Podnoszenie poprzeczki

Gdy nawyk trzyma się od ~2 tygodni, panel „Podnieś poprzeczkę” (ekran Dziś) proponuje trudniejszą wersję tego samego nawyku
(to samo zadanie — seria i historia zostają).

- **Kiedy:** seria ≥ 14 przy nawyku codziennym, ≥ 6 przy nawyku na 3 dni w tygodniu
  (ogólnie 2 tygodnie wykonań, min. 6), ≥ 3 tygodnie przy „X razy w tygodniu”; nawyk istnieje co najmniej
  14 dni. Pokazywany jest jeden kandydat — z najdłuższą serią.
- **Co:** nawyki tygodniowe poniżej 3× — częściej o 1; potem liczba w nazwie rośnie według jednostki (minuty, strony, kroki,
  serie, powtórzenia, kilometry, słówka); bez liczby w nazwie — częściej, najwyżej do 4× w tygodniu.
  Zmiana nazwy nie może przenieść nawyku do innej kategorii.
- **Bez propozycji:** „czego unikam”, liczniki, zadania jednorazowe i nawyki bez sensownej trudniejszej wersji.
- Po „Podnieś poprzeczkę” albo „Jeszcze nie” nawyk milknie na 14 dni (zapis w zadaniu, synchronizuje się).

| Start (z katalogu) | Kolejne propozycje |
| --- | --- |
| Pompki 3 serie, 3× w tyg. | Pompki 4 serie → Pompki 5 serii → Pompki 5 serii, 4× w tyg. |
| Przysiady 3×15, 3× w tyg. | Przysiady 3×20 → Przysiady 3×25 → Przysiady 3×30 |
| Kalistenika w domu, 3× w tyg. | Kalistenika w domu, 4× w tyg. |
| Trening siłowy FBW, 3× w tyg. | Trening siłowy FBW, 4× w tyg. |
| Podciąganie na drążku, 3× w tyg. | Podciąganie na drążku, 4× w tyg. |
| Deska 1 min | Deska 2 min → Deska 3 min → Deska 4 min |
| Spacer 20 min | Spacer 30 min → Spacer 45 min → Spacer 60 min |
| 8000 kroków | 10 000 kroków → 12 000 kroków → 14 000 kroków |
| Marszobieg 15 min, 3× w tyg. | Marszobieg 25 min → Marszobieg 35 min → Marszobieg 50 min |
| Bieganie 25 min, 3× w tyg. | Bieganie 35 min → Bieganie 50 min → Bieganie 65 min |
| Rower 30 min, 2× w tyg. | Rower 30 min, 3× w tyg. → Rower 45 min → Rower 60 min |
| Rozciąganie 10 min | Rozciąganie 20 min → Rozciąganie 30 min → Rozciąganie 45 min |
| Gotowanie w domu, 3× w tyg. | Gotowanie w domu, 4× w tyg. |
| Czytanie 10 stron | Czytanie 20 stron → Czytanie 30 stron → Czytanie 40 stron |
| Czytanie 30 minut | Czytanie 45 minut → Czytanie 60 minut → Czytanie 75 minut |
| Nauka: 5 nowych słówek | Nauka: 10 nowych słówek → Nauka: 15 nowych słówek → Nauka: 20 nowych słówek |
| Nauka języka 15 min | Nauka języka 25 min → Nauka języka 35 min → Nauka języka 50 min |
| Nauka bez telefonu 45 min | Nauka bez telefonu 60 min → Nauka bez telefonu 75 min → Nauka bez telefonu 90 min |
| Kurs online 20 min, 4× w tyg. | Kurs online 30 min → Kurs online 45 min → Kurs online 60 min |
| Medytacja 5 min | Medytacja 10 min → Medytacja 20 min → Medytacja 30 min |
| Sprzątanie 10 min | Sprzątanie 20 min → Sprzątanie 30 min → Sprzątanie 45 min |

## 14. Synchronizacja między urządzeniami

- Pierwsze urządzenie tworzy **kod** (12 znaków, bez mylących 0/O i 1/I, np. `ABCD-EFGH-JKLM`); kolejne dołączają kodem,
  linkiem `?sync=KOD` albo kodem QR. Dołączenie zastępuje lokalne dane danymi z kodu. Kod działa jak hasło.
- Po każdej zmianie zapis idzie na serwer (z krótkim opóźnieniem); zmiany z innych urządzeń pobierane są co 20 s,
  po powrocie do karty i po odzyskaniu sieci.
- **Scalanie** równoległych zmian (wspólny przodek + oba urządzenia): każde zadanie i każdy dzień historii scalane osobno,
  wygrywa strona, która coś zmieniła (gdy obie — to urządzenie); osiągnięcia z najwcześniejszą datą; EXP wynika ze scalonej historii.
- Odłączenie zostawia dane lokalnie; „Usuń wszystkie dane” usuwa je także z serwera.

## 15. Przypomnienia (Web Push)

- Wymagają kodu synchronizacji (serwer zna wtedy aktualny plan i odhaczenia). Na iPhonie działają po zainstalowaniu aplikacji
  na ekranie początkowym.
- **Przed zadaniem z godziną:** o czasie, 5 min przed, 15 min przed, 30 min przed. Nawyki „X razy w tygodniu” z godziną — dopóki cel tygodnia nie jest osiągnięty.
- **Wieczorne podsumowanie** (opcjonalne, 19:00, 20:00, 21:00, 22:00): ile zadań zostało na dziś i które — „nie przerywaj passy”.
- Serwer sprawdza co 5 minut; okno wysyłki 20 min, po godzinie startu najwyżej 10 min; każde przypomnienie
  wysyłane raz. W trybie urlopu — cisza. Powiadomienie testowe w panelu przypomnień.

## 16. Ustawienia, dane i prywatność

- **Ustawienia:** imię postaci, język, dźwięk, tryb urlopu, synchronizacja, aplikacja i przypomnienia, kopia zapasowa,
  dobór nawyków, poradnik, zgłoszenie problemu lub pomysłu, prywatność i regulamin, usunięcie wszystkich danych.
- **Kopia zapasowa:** eksport do pliku `umbra-RRRR-MM-DD.json` (cały plan i historia); import (do 5 MB) zastępuje obecne dane,
  także na połączonych urządzeniach.
- **Usuń wszystkie dane:** czyści urządzenie, usuwa dane z serwera, odłącza synchronizację i wyłącza przypomnienia.
- **Zgłoszenia** idą formularzem Netlify Forms (rodzaj: problem / pomysł / inne, treść, opcjonalny kontakt, język, przeglądarka i ekran).
- **Prywatność:** bez konta, cookies, reklam i narzędzi śledzących. Na serwerze są tylko: dane synchronizacji pod losowym kodem,
  subskrypcje przypomnień (adres push, strefa czasowa, język, godziny) i zgłoszenia (do 12 miesięcy). Hosting: Netlify.
  Serwis nie jest dla osób poniżej 16 lat i nie udziela porad medycznych, dietetycznych ani treningowych.

## 17. Pierwsze uruchomienie

1. **Strona powitalna** (tylko przy pierwszej wizycie bez danych): „Rozpocznij wędrówkę” albo „Mam już kod” (synchronizacja).
2. **Poradnik** (5 kroków z animowanymi podglądami): EXP i poziomy, dodawanie zadań, odhaczanie run, planowanie tygodnia, imię postaci.
   Można go pominąć i otworzyć później (stopka → Poradnik).
3. **Ankieta doboru nawyków**, jeśli plan jest pusty.

## 18. Rozwój

- `npm run dev` — serwer deweloperski z lokalnym API (dane w `.netlify/dev-*.json`; `/api/dev-reminders` ręcznie uruchamia przypomnienia).
- `npm run build` — wersja produkcyjna; `npm run check:habits` — test katalogu nawyków, doboru z ankiety i łańcuchów poprzeczki
  (wszystkie kombinacje odpowiedzi, oba języki); `npm run check:bosses` — test strażnika tygodnia (granice wytrzymałości,
  słabość, urlop i brak planu, ten sam boss w różnych strefach czasowych); `npm run check:luck` — test elementów losowych
  (szansa i rzadkość reliktów, przepowiednia bez zmian EXP wstecz, zlecenie dnia, obrażenia bossa = EXP, te same wyniki w różnych strefach
  czasowych); `npm run docs` — przebudowa tej dokumentacji.
- Hook `pre-commit` (`.githooks/`, włączany automatycznie przez `npm install`) przebudowuje dokumentację i dołącza ją do commita.
- Teksty pisze się w miejscu użycia jako `t('po polsku', 'in English')`; zmiana języka przeładowuje stronę.
- Commity po polsku; push na `main` = wdrożenie na produkcję.

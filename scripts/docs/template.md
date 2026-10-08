# Umbra — dokumentacja aplikacji

> Plik generowany automatycznie przy każdym commicie (`npm run docs`). Nie edytuj go ręcznie —
> opisy są w `scripts/docs/template.md`, a tabele i liczby generator `scripts/build-docs.mjs` czyta wprost z kodu.
> Wersja aplikacji: {{version}}.

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
np. „2 min” (pole „Wersja minimalna” w edytorze, do {{minimumMaxLength}} znaków). Na karcie zadania jest wtedy osobny przycisk
„◐ Minimum”. Zaliczenie minimum to częściowe wykonanie:
- liczy się do pełnego dnia, passy, serii nawyku i wypalonych pieczęci (zadanie trafia do historii jak wykonane),
- daje 50% EXP zadania, zaokrąglone w górę (np. {{minimumExample}}) — także w atrybutach i statystykach dnia,
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

{{categories}}

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
- **Combo:** kolejne odhaczenia tego samego dnia w odstępach do {{comboWindowSeconds}} s wzmacniają efekt — wyższy ton,
  dodatkowe dźwięczenie, więcej iskier, kolor przechodzący w złoto i napis „Combo ×N” (do ×{{comboMax}}). Combo żyje tylko
  w pamięci — nic nie jest zapisywane i nie wpływa na EXP.
- **Finał dnia:** zdobycie pełnego dnia w trakcie sesji kończy się krótkim rozbłyskiem pierścienia w HUD i fanfarą
  (krótszą niż przy awansie). Po przeładowaniu strony z już pełnym dniem finał się nie powtarza.
- Wszystko szanuje ustawienia: wyciszony dźwięk wyłącza też wibracje, a przy `prefers-reduced-motion` zostaje tylko
  krótki błysk (bez iskier, fal i wibracji).

## 5. EXP i poziomy

- EXP za zadanie zależy od kategorii (tabela wyżej); zaliczenie samego minimum dnia daje połowę (w górę),
  a kategoria z przepowiedni dnia daje +{{prophecyBonus}}% (sekcja 11). Wynik jest zaokrąglany do pełnego EXP.
  EXP potrzebny na poziom: {{levelBase}} + {{levelStep}} × (poziom − 1).
- **Najwyższy osiągnięty poziom** (`maxLevel`) nigdy nie spada i to on odblokowuje nagrody.
- Awans pokazuje okno z nowym tytułem, cytatem, wszystkimi nagrodami z przeskoczonych poziomów i zapowiedzią następnej.
  Pod paskiem EXP w HUD stale widać najbliższą nagrodę i brakujące EXP.

{{levels}}

## 6. Nagrody za poziomy

Nagrody są kosmetyczne (aury, pieczęcie) albo użytkowe (tarcze passy) — żadna funkcja aplikacji nie jest blokowana poziomem.
Wszystkie są na **ścieżce nagród** w zakładce Postępy (zdobyte, najbliższa z brakującym EXP, dalsze zakryte jako „???”).

- **Aury** zmieniają kolory tła (poświaty i unoszące się drobiny). Zdobytą aurę zakłada się na ścieżce nagród albo przyciskiem
  „Przywdziej” w oknie awansu; wybór zapisuje się w profilu i synchronizuje.
{{auras}}
- **Pieczęcie** — emblemat poziomu w HUD; zmienia się sam razem z rangą (tytułem): więcej kręgów, kresek i inna poświata.
- **Tarcze passy** — co {{shieldEvery}} poziomów (opis w sekcji 7).

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
- **Tarcze passy** — jedna co {{shieldEvery}} osiągniętych poziomów (licznik w panelu Passy). Gdy passa licząca co najmniej
  {{shieldMinStreak}} dni właśnie przepadła przez 1–{{shieldMaxDays}} niepełnych dni (od wczoraj wstecz) i tarcz wystarczy,
  panel Passy proponuje „Użyj tarczy”. Użyta tarcza to jednodniowa przerwa (jak urlop) oznaczona jako tarcza — passa i serie wracają.
  Dłuższej przerwy tarcze nie łatają. W kalendarzu taki dzień jest opisany jako „tarcza passy”.
- **Powrót z cienia** — gdy przepadnie passa licząca co najmniej {{minLostStreak}} dni (i nie uratuje jej tarcza), pierwszy dzień
  z wykonanym zadaniem po jej utracie daje jednorazowy komunikat „Wracasz z cienia” i +{{returnBonus}} EXP; tego dnia panel Passy
  zamiast zachęty po utracie pokazuje powrót. Zadania wykonane w samym dniu utraty się nie liczą (passa przepada z jego końcem).
  Bonus wynika z historii, jak cały EXP: gdy później użyjesz tarczy na dzień utraty, passa wraca, a powrót i bonus znikają.
  Komunikat pokazuje się raz na powrót — także po przeładowaniu i na innych urządzeniach (pole `comebackSeen` w stanie gry).

## 8. Atrybuty i klasa postaci

- Każda kategoria to atrybut z własnym poziomem, liczonym z EXP zadań tej kategorii:
  EXP na poziom atrybutu = {{attrLevelBase}} + {{attrLevelStep}} × (poziom − 1). Karta postaci (zakładka Postępy) pokazuje radar i paski.
- **Klasa** wynika z proporcji atrybutów: poniżej 100 EXP łącznie — brak klasy; jeden atrybut ≥ 1,6× drugiego — klasa solo;
  dwa atrybuty ≥ 1,4× trzeciego — klasa pary (para z Codziennością liczy się jak solo drugiego atrybutu); inaczej — równowaga.

{{classes}}

### Słaby punkt i podpowiedzi
Spośród Siły, Kondycji, Zdrowia i Umysłu aplikacja wskazuje atrybut, który **kuleje** (w ostatnich {{attrRecentDays}} zakończonych dniach
zaplanowano co najmniej 3 zadania, a wykonano mniej niż połowę — najgorszy pierwszy) albo jest **nieodkryty** (brak zadań i EXP).
Podpowiedź (Karta postaci i panel „Podpowiedź” na ekranie Dziś) proponuje gotowy nawyk z katalogu z tego atrybutu, którego nie ma
w planie — od najłatwiejszych. Przyciski: „Dodaj do planu”, „↻ Inny”, „Nie teraz” (ukrywa do końca dnia na tym urządzeniu).
Nawyk z podpowiedzi startuje łagodniej: nawyki „X razy w tygodniu” powyżej 2× dostają o jeden raz mniej.

## 9. Osiągnięcia

{{achievements}}

Osiągnięcie zdobyte na innym urządzeniu (przez synchronizację) nie jest ogłaszane ponownie.

## 10. Strażnik tygodnia (boss)

Lekki cel tygodnia (pn–nd) na ekranie Dziś: pasek wytrzymałości bossa, który topnieje od prawdziwych wykonań zadań.
Nie ma tur, HP gracza ani losowości — i nie ma porażki.

- **Boss tygodnia** wybierany jest deterministycznie z numeru tygodnia (liczonego z daty poniedziałku w UTC), więc
  w danym tygodniu wszyscy i na każdym urządzeniu mają tego samego bossa. Słabości rotują co tydzień.
- **Obrażenia** = EXP każdego wykonania z bieżącego tygodnia (minimum dnia liczy się tak jak w EXP, a zadania spoza planu
  i nawyki „X razy w tygodniu” też ranią). Zadania z atrybutu będącego słabością bossa ranią ×{{bossWeaknessBonus}}.
- **Wytrzymałość** = {{bossHpShare}}% średniego tygodniowego EXP z ostatnich {{bossHistoryWeeks}} pełnych tygodni bez urlopu,
  zaokrąglone do 10, w granicach {{bossMinHp}}–{{bossMaxHp}}. Gracz z mniej niż {{bossMinHistoryWeeks}} takimi tygodniami
  (np. nowy) dostaje stałe {{bossNewPlayerHp}}. Liczona z poprzednich tygodni, więc nie zmienia się w trakcie bieżącego.
- **Brak bossa** w tygodniu z urlopem (choćby jeden dzień; tarcza passy się nie liczy) i w tygodniu bez planu
  (żadne zadanie nie jest zaplanowane na ten tydzień i nie ma nawyku „X razy w tygodniu”).
- **Brak porażki:** niepokonany boss znika z końcem tygodnia. Boss nie wpływa na passę, serie ani EXP.
- **Nagroda** jest wyłącznie kosmetyczna: relikt w bestiariuszu „Pokonani strażnicy” (zakładka Postępy) — zdobyte relikty
  z datą i liczbą pokonań, niepokonani zakryci jako „???”.
- Pokonanie bossa w trakcie sesji pokazuje krótką animację (ok. 1,2 s; bez ruchu przy `prefers-reduced-motion`).
- Wszystko (postęp, pokonanie, bestiariusz) wynika z historii — bez osobnego licznika obrażeń i bez nowych pól w stanie gry.

{{bosses}}

## 11. Przepowiednia, znaleziska i zlecenie dnia

Elementy „szczęścia” są deterministyczne: wynik wylicza się z daty (i id zadania) stałym skrótem (hash), więc ten sam dzień daje
ten sam wynik na każdym urządzeniu, w każdej strefie czasowej i po przeładowaniu — bez zapisywania losowań w stanie gry.
Nie ma nagród za samo otwarcie aplikacji ani niczego płatnego.

### Przepowiednia dnia
- Karta na ekranie Dziś z krótkim tekstem i kategorią dnia: zadania z tej kategorii dają tego dnia **+{{prophecyBonus}}% EXP**.
- Bonus wlicza się w EXP wykonania (jedno źródło EXP), więc spójnie w poziomie, atrybutach, statystykach dnia i obrażeniach
  strażnika tygodnia. Karta zadania pokazuje EXP z bonusem i znaczek „✦ +{{prophecyBonus}}%”.
- Przepowiednie działają od {{prophecySince}} — wcześniejsze dni nie dostają bonusu, żeby nie zmieniać EXP wstecz.

### Znaleziska (relikty)
- Każde wykonanie zadania ma ok. {{relicChance}}% szansy na relikt (osobno dla każdego zadania w każdym dniu). Rzadkość:
  {{relicRarities}}. Relikty są wyłącznie kosmetyczne — nie dają EXP.
- Przy znalezisku w trakcie sesji pokazuje się krótki komunikat u góry ekranu (nie blokuje). Kolekcja „Znaleziska” w Postępach
  jest wyliczana z całej historii (także sprzed dodania reliktów): zdobyte z datą pierwszego znalezienia i liczbą, reszta
  jako „???”. Relikty znalezisk to co innego niż relikty za pokonanych strażników (te są w bestiariuszu).

{{relics}}

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
{{quizBudget}}
- Każdy wybrany cel dostaje co najmniej jeden nawyk; najwyżej 2 nawyki z tym samym głównym celem i 1 z tej samej grupy
  (np. dwa warianty czytania); nawyki „nie dla” danego stylu dnia są pomijane; nie proponuje nawyków, które już są w planie.
- Punktacja: trafienie w cel, główny cel nawyku, nawyki uniwersalne (woda, sen), dopasowanie do stylu dnia, poziom trudności
  (początkujący dostają łatwe), zgodność pory dnia.
- Godziny: rano {{slotMorning}}, w ciągu dnia {{slotMidday}}, wieczorem {{slotEvening}}; kolejne nawyki z tej samej pory idą
  jeden po drugim. Przy pracy zmianowej — bez godzin. Początkujący dostają nawyki tygodniowe o jeden raz rzadziej (powyżej 2×).
- Na ekranie wyniku można odznaczyć nawyk albo wymienić go na inną propozycję (↻).

### Katalog nawyków ({{habitCount}})

{{catalog}}

## 13. Podnoszenie poprzeczki

Gdy nawyk trzyma się od ~2 tygodni, panel „Podnieś poprzeczkę” (ekran Dziś) proponuje trudniejszą wersję tego samego nawyku
(to samo zadanie — seria i historia zostają).

- **Kiedy:** seria ≥ {{streakGoalDaily}} przy nawyku codziennym, ≥ {{streakGoalThreeDays}} przy nawyku na 3 dni w tygodniu
  (ogólnie 2 tygodnie wykonań, min. 6), ≥ {{streakGoalWeekly}} tygodnie przy „X razy w tygodniu”; nawyk istnieje co najmniej
  {{quietDays}} dni. Pokazywany jest jeden kandydat — z najdłuższą serią.
- **Co:** nawyki tygodniowe poniżej 3× — częściej o 1; potem liczba w nazwie rośnie według jednostki (minuty, strony, kroki,
  serie, powtórzenia, kilometry, słówka); bez liczby w nazwie — częściej, najwyżej do 4× w tygodniu.
  Zmiana nazwy nie może przenieść nawyku do innej kategorii.
- **Bez propozycji:** „czego unikam”, liczniki, zadania jednorazowe i nawyki bez sensownej trudniejszej wersji.
- Po „Podnieś poprzeczkę” albo „Jeszcze nie” nawyk milknie na {{quietDays}} dni (zapis w zadaniu, synchronizuje się).

{{raiseBar}}

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
- **Przed zadaniem z godziną:** {{reminderLeads}}. Nawyki „X razy w tygodniu” z godziną — dopóki cel tygodnia nie jest osiągnięty.
- **Wieczorne podsumowanie** (opcjonalne, {{reminderEvenings}}): ile zadań zostało na dziś i które — „nie przerywaj passy”.
- Serwer sprawdza co 5 minut; okno wysyłki {{reminderWindow}} min, po godzinie startu najwyżej 10 min; każde przypomnienie
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
  (szansa i rzadkość reliktów, przepowiednia bez zmian EXP wstecz, obrażenia bossa = EXP, te same wyniki w różnych strefach
  czasowych); `npm run docs` — przebudowa tej dokumentacji.
- Hook `pre-commit` (`.githooks/`, włączany automatycznie przez `npm install`) przebudowuje dokumentację i dołącza ją do commita.
- Teksty pisze się w miejscu użycia jako `t('po polsku', 'in English')`; zmiana języka przeładowuje stronę.
- Commity po polsku; push na `main` = wdrożenie na produkcję.

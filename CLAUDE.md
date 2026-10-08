# Umbra — wskazówki dla pracy nad kodem

Pełny opis aplikacji i wszystkich jej zasad: `DOKUMENTACJA.md` (generowana, nie edytuj ręcznie).

## Dokumentacja
- Hook `pre-commit` przebudowuje `DOKUMENTACJA.md` przy każdym commicie: tabele i liczby czyta z kodu,
  opisy bierze z `scripts/docs/template.md`.
- Nowa funkcja albo zmiana zasad → dopisz lub popraw opis w `scripts/docs/template.md` w tym samym commicie.
  Liczby i listy, które są w kodzie, wstawiaj znacznikami `{{…}}` z `scripts/build-docs.mjs` (dodaj tam nowy, jeśli trzeba),
  zamiast przepisywać je ręcznie.

## Polecenia
- `npm run dev` — serwer deweloperski z lokalnym API (`/api/sync`, `/api/push`).
- `npm run build` — wersja produkcyjna; uruchom przed commitem.
- `npm run check:habits` — test katalogu nawyków, doboru z ankiety i łańcuchów poprzeczki; uruchom po zmianach
  w `src/lib/habits.js`, `recommend.js`, `progression.js` albo słowach kategorii w `game.js`.
- `npm run docs` — przebudowa dokumentacji bez commita.

## Zasady
- Teksty w interfejsie zawsze w obu językach: `t('po polsku', 'in English')`.
- EXP nie jest przechowywany — liczy go `totalExpOf` z historii. Nie dodawaj osobnych liczników, które mogą się rozjechać.
- Nowe pola stanu gry muszą przetrwać migrację (`migrateState`) i scalanie synchronizacji (`mergeStates` w `src/lib/sync.js`).
- `src/lib/schedule.js` i `netlify/` działają też na serwerze — bez zależności od przeglądarki i Reacta.
- Commity po polsku. Push na `main` od razu wdraża na produkcję (Netlify) — tylko na wyraźną prośbę.

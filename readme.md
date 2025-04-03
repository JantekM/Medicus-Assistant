# Medicus Assistant

Poboczny projekt robiony w wolnym czasie mający na celu stworzenie rozszerzenia do Firefoxa (i preferencyjnie też do Chrome i pochodnych), które ułatwiałoby najbardziej upierdliwe i powtarzalne czynności w obsłudze oprogramowania Medicus w codziennej pracy lekarza. Oprogramowanie jest stworzone konkretnie pod wersję używaną w Szpitalu Płońskim, ale powinno też działać w innych instalacjach Medicusa.

## Features

### Zaimplementowane

- **Przycisk ***Rano***** - ułatwienie planowania badań kontrolnych. Robiąc nowe zlecenie na badania laboratoryjne obok przycisków ***Czyść*** i ***Teraz*** jest dodany przycisk ***Rano***, który automatycznie wstawia godzinę 7:45 następnego dnia. W przypadku, gdy akurat jest godzina między 24 a 9 rano (np. siedzisz na dyżurze w nocy), to zamiast następnego dnia wstawia się 7:45 aktualnego dnia. Prosta rzecz, ale mniej klikania, by zlecić badania

### W planach

- **Zleć posiewy z krwi** - zamiast pisania i drukowania 4 oddzielnych zleceń wystarczy, że napiszesz zlecenie tylko raz, a program automatycznie sam zamieni je w 4 zlecenia, 2 na posiewy tlenowe, 2 na beztlenowe, zleci je w systemie i przygotuje do drukowania.
- **Powtórz badanie** - przy dowolnym badaniu laboratoryjnym wśród już wykonanych (w zakładce ***Zlecenia***) pojawia się przycisk ***Powtórz badanie**, który automatycznie otwiera nowe zlecenie na badanie, gdzie będą zaznaczone wszystkie badania z kopiowanego zlecenia, a także powtórzony opis, tryb badania (cito vs nie cito) i rozpoznanie. Zlecenie nie będzie automatycznie wysłane, więc możesz dokonać dowolnych modyfikacji przed akceptacją np. zaznaczyć więcej lub mniej badań.
- **Własne zestawy badań** - Często zlecasz niektóre badania? Regularnie zestaw sód-potas-kreatynina-glukoza-ogólne moczu? Zdefiniuj własne zestawy badań, dzięki którym wystarczy jedno kliknięcie, by badania się same zaznaczyły.
- **Konfiguracja rozszerzenia** - ustaw opcje preferencje jak ma działać Medicus Assistant, może chcesz wyłączyć niektóre funkcje albo zmienić jak działają? No problemo
- **Powiadom jak przyjdą wyniki** - lubisz czekać i co chwilę odświeżać stronę zleceń / wyników badań aż w końcu przyjdzie wynik potasu lub kreatyniny, by wiedzieć co wpisać w zleceniach? Ja też nie. Zamiast tego miło by było dostać powiadomienie, że właśnie pojawił się wynik. A ty nie musisz co chwilę sprawdzać i możesz się zająć czymś pożytecznym, a nie klikaniem bez sensu.

## Instalacja

### Sposób 1 - z pliku

Pobierz najnowszą wersję, a następnie zainstaluj jako rozszerzenie z pliku. Więcej instrukcji w krótce.

### Sposób 2 - z oficjalnej strony rozszerzeń

Nad tym ciągle jeszcze pracuję, stay tuned


## Licencja

This project is licensed under the [MIT License](LICENSE).

## Contact

For questions or feedback, please contact [jantoni.mikulski@gmail.com].
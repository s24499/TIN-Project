### Mój Garaż ###

Aplikacja „Mój Garaż” służy do prowadzenia prywatnej listy samochodów oraz historii zdarzeń związanych z każdym autem (np. serwis, modyfikacje, tankowania). 
Dane są zapisywane w bazie MySQL, a dostęp do edycji jest kontrolowany przez logowanie i role użytkowników.

Zawartość projektu
W projekcie znajdują się:
- Backend w Node.js (plik `app.js`) – udostępnia API, obsługuje sesję logowania oraz kontrolę dostępu.
- Frontend w HTML (m.in. `index.html`, `login.html`, `garage.html`) – proste strony, które komunikują się z API.
- Skrypty bazy danych:
  - `schema.sql` – tworzy bazę i tabele.
  - `seed.sql` – wstawia przykładowe dane (użytkowników, auta, wpisy serwisowe).

Krótka dokumentacja (jak działa aplikacja)
Aplikacja opiera się na trzech powiązanych elementach danych:

1) Użytkownicy (`users`)
To konta w systemie. Każde konto ma login, hasło, imię, nazwisko oraz rolę (OWNER/GUEST/ADMIN).

2) Samochody (`cars`)
Każdy samochód jest przypisany do konkretnego użytkownika (właściciela). Dzięki temu zalogowany OWNER widzi i edytuje tylko swoje auta.

3) Wpisy serwisowe (`services`)
Wpis serwisowy jest przypisany do konkretnego samochodu i użytkownika. Dzięki temu historia serwisów jest osobna dla każdego auta i właściciela.

Role i uprawnienia
W systemie występują role:
- OWNER – zarządza własnymi samochodami i własnymi wpisami serwisowymi (dodawanie, edycja, usuwanie).
- GUEST – ma dostęp tylko do podglądu danych publicznych (bez modyfikacji), czyli wszystkich aut w tym współdzielonym garażu.
- ADMIN – ma dodatkowe możliwości zarządzania użytkownikami.

Dodatkowe zachowanie biznesowe:
- Usunięcie ostatniego samochodu właściciela jest zablokowane (system wymaga posiadania co najmniej jednego auta). Czymś po poranne bułki trzeba jeździć.

Endpointy (najważniejsze adresy API)
Autoryzacja:
- POST `/auth/register` – rejestracja konta.
- POST `/auth/login` – logowanie (tworzy sesję).
- POST `/auth/logout` – wylogowanie (usuwa sesję).
- GET `/auth/me` – informacja o aktualnie zalogowanym użytkowniku.

Samochody (OWNER):
- GET `/cars?page=1&limit=5` – lista aut zalogowanego użytkownika (paginacja).
- GET `/cars/:id` – szczegóły jednego auta (tylko jeśli należy do użytkownika).
- POST `/cars` – dodanie auta.
- PUT `/cars/:id` – edycja auta.
- DELETE `/cars/:id` – usunięcie auta (z blokadą usunięcia ostatniego).

Serwisy (OWNER):
- GET `/cars/:carId/services` – lista wpisów serwisowych dla auta.
- POST `/cars/:carId/services` – dodanie wpisu.
- GET `/services/:id` – szczegóły jednego wpisu.
- PUT `/services/:id` – edycja wpisu.
- DELETE `/services/:id` – usunięcie wpisu.

Publiczne:
- GET `/public/cars` – lista przykładowych samochodów (dostępna bez logowania).




### Instrukcja uruchomienia (Windows 10/11) – od A do Z ###

WAŻNE: Archiwum ZIP NIE zawiera folderu `node_modules` (~200MB). NALEŻY uruchomić `npm install`!

Krok 1. Instalacja wymaganych programów (jednorazowo)
1) Node.js (wersja LTS)  
   Pobierz instalator z https://nodejs.org (LTS)  
   LUB PowerShell jako Administrator:  
   winget install OpenJS.NodeJS.LTS  
   Sprawdź: node -v (v20+), npm -v (10+)

2) XAMPP  
   Pobierz z https://www.apachefriends.org/pl/download.html i zainstaluj.

Krok 2. Uruchomienie serwera bazy danych (XAMPP)
1) Uruchom XAMPP Control Panel.
2) Kliknij "Start" przy MySQL (port 3306).

Krok 3. Utworzenie bazy danych i tabel + dane przykładowe (schema.sql + seed.sql)
1) Otwórz PowerShell jako Administrator.
2) Przejdź do katalogu z klientem mysql z XAMPP:  
   np. cd C:\xampp\mysql\bin
3) Uruchom klienta mysql (root bez hasła):  
   .\mysql -u root  
4) W konsoli MariaDB wgraj pliki SQL (ukośniki /):  
   SOURCE C:/SCIEZKA_DO_PROJEKTU/project-garage/db/schema.sql;  
   SOURCE C:/SCIEZKA_DO_PROJEKTU/project-garage/db/seed.sql;  

Po tym kroku dostępne są konta testowe:
- OWNER: login owner, hasło owner
- ADMIN: login admin, hasło admin  
- GUEST: login guest, hasło guest

Krok 4. Backend (Node.js)
1) Otwórz nowe okno PowerShell.
2) Przejdź do folderu backend:  
   cd "C:\SCIEZKA_DO_PROJEKTU\project-garage\backend"
3) (Pierwsze uruchomienie na danym komputerze) zainstaluj zależności:  
   npm install
4) Sprawdź plik .env (w folderze backend):  
		DB_HOST=localhost
		DB_USER=root
		DB_PASSWORD=
		DB_NAME=garage
		DB_PORT=3306

		SESSION_SECRET=supersekret
		PORT=3000
	- Jeśli plik .env nie istnieje stwórz nowy plik o nazwie '.env' i wklej powyższe wartości.
	- Jeśli plik istnieje, ale dane się różnią, edytuj/podmień na powyższe wartości.
5) Uruchom backend:  
   npm start
Backend działa pod: http://localhost:3000

Krok 5. Uruchomienie aplikacji
1) Otwórz przeglądarkę (było testowane na najnowszych wersjach Firefox, Chrome oraz MS Edge).
2) Wpisz adres: http://127.0.0.1:3001/frontend/index.html


Struktura projektu:
project-garage/
	ReadMe.txt
	backend/
		server.js
		package.json
		package-lock.json
		.env
		node_modules/	<- Utworzy się po wykonaniu kroku 4.
	frontend/
		index.html
		login.html
		garage.html
		services.html
		users.html
		style.css
	db/
		schema.sql
		seed.sql

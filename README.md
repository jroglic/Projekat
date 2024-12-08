# RecipeVault

**RecipeVault** je web aplikacija koja omogućava korisnicima da kreiraju, uređuju i upravljaju receptima. Osim osnovnih funkcionalnosti, aplikacija podržava kreiranje lista recepata, komentarisanje recepata drugih korisnika i administraciju sadržaja.

## 🚀 Tehnologije i Alati

### Frontend
- **Vue.js 3.5.4** - za korisnički interfejs i upravljanje stanjem aplikacije
- **Axios** - za slanje HTTP zahteva
- **HTML/CSS** - za strukturu i stilizaciju aplikacije

### Backend
- **Node.js** - za izvršavanje JavaScript-a na serveru
- **Express** - za kreiranje REST API-ja
- **MySQL** - za čuvanje podataka o korisnicima, receptima, komentarima i listama
- **MySQL2** - za povezivanje aplikacije sa bazom podataka

### Autentifikacija
- **Local Storage** - za čuvanje podataka o trenutnom korisniku na frontend-u

## 🛠️ Funkcionalnosti

- **Prijava korisnika** putem email-a i lozinke
- **Dodavanje recepata**, uključujući sastojke i opis pripreme
- **Izmena i brisanje recepata** (dostupno vlasnicima recepata)
- **Dodavanje recepata u liste**
- **Komentarisanje recepata**, sa mogućnošću brisanja komentara od strane vlasnika recepta ili administratora
- **Kreiranje i upravljanje listama recepata**
- **Administracija**: pristup podacima svih korisnika i mogućnost brisanja komentara

## 📂 Struktura Projekta

### Frontend
- Vue komponente za prikaz recepata, dodavanje recepata, liste i komentare
- Navigacija između stranica pomoću **Vue Router-a**

### Backend
- API endpoint-i za operacije nad receptima, listama i komentarima
- Organizacija ruta i middleware za autentifikaciju

### Baza Podataka
- Struktura za korisnike, recepte, komentare i liste

## ⚙️ Pokretanje Projekta

1. Pokrenite backend server:
    ```bash
    node server.js
    ```
2. Pokrenite frontend aplikaciju:
    ```bash
    npm run serve
    ```

## 📡 API Endpoint-i

### Autentifikacija
- **POST** `/login` - Prijava korisnika

### Recepti
- **GET** `/recepti` - Dohvatanje svih recepata
- **GET** `/recepti/user/:userId` - Dohvatanje recepata određenog korisnika
- **POST** `/recepti` - Dodavanje novog recepta
- **PUT** `/recepti/:id` - Izmena recepta
- **DELETE** `/recepti/:id` - Brisanje recepta
- **GET** `/recepti/:id` - Detalji određenog recepta

### Komentari
- **POST** `/komentari` - Dodavanje novog komentara
- **GET** `/komentari/:rec_id` - Dohvatanje komentara za određeni recept
- **DELETE** `/komentari/:kom_id/:user_id` - Brisanje komentara

### Liste
- **POST** `/lista` - Kreiranje nove liste
- **GET** `/liste/:user_id` - Dohvatanje svih lista korisnika
- **POST** `/lista/:lis_id/recept` - Dodavanje recepta u listu
- **DELETE** `/lista/:lis_id/recept/rec_id` - Uklanjanje recepta iz liste

## 📋 Testiranje

- Backend API testiran manuelno pomoću Postmana
- Testovi izvršeni korišćenjem terminala, browser konzole i mrežnih alata

## 🌟 Planovi za budućnost

- Implementacija sistema za ocenjivanje recepata
- Napredno pretraživanje recepata po ključnim rečima ili sastojcima
- Sistem za registrovanje i prijavu korisnika putem OAuth-a

## 🖼️ Screenshotovi
(Dodajte slike aplikacije ovde)

## 📄 Licenca

Ovaj projekat je licenciran pod [MIT licencom](./LICENSE).

---

**RecipeVault** je projektovan sa ciljem da unapredi upravljanje receptima i podstakne zajednicu ljubitelja kuvanja. Uživajte u korišćenju aplikacije!


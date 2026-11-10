# Net pizzéria – Web-programozás II beadandó

Szerver oldali webalkalmazás Node.js-ben (Express, EJS, Mongoose), MongoDB Atlas adatbázissal, Render.com-on futtatva.
Az adatbázis a „1-17-Pizza” (kategoria, pizza, rendeles táblák).

Kiindulópont: a gyakorlat *07b-Autentikáció* megoldása.

Reszponzív téma: [Feane](https://themewagon.com/themes/feane/) (ThemeWagon / Free Html Templates, Bootstrap 4).

## Készítők

- Lőrik Levente (AICYHB)
- Fődi Kinga (EW67RO)

## Futtatás helyben

```bash
npm install
cp .env.example .env   # majd töltsd ki a MongoDB adatokat
npm run dev
```

Az alkalmazás a http://localhost:3000 címen érhető el.

## Szerepkörök

| Szerepkör | Elérhető menük |
|-----------|----------------|
| Látogató | Főoldal, Adatbázis, Kapcsolat, Bejelentkezés, Regisztráció |
| Regisztrált látogató (`user`) | + Üzenetek, Diagram, Kijelentkezés |
| Admin (`admin`) | + CRUD |

Admin felhasználó létrehozása: töltsd ki az `ADMIN_USERNAME` / `ADMIN_PASSWORD` értékét a `.env`-ben, majd futtasd: `npm run seed` (lásd lent).

## Adatbázis betöltése

A `data/` mappa a „1-17-Pizza” adatbázis tabulátorral tagolt fájljait tartalmazza. Betöltés MongoDB-be (a három collection tartalmát lecseréli, és ha az `ADMIN_PASSWORD` meg van adva, létrehozza / frissíti az admin felhasználót is):

```bash
npm run seed
```

| Collection | Modell | Mezők | Kapcsolat |
|------------|--------|-------|-----------|
| `kategoriak` | `Kategoria` | nev, ar | – |
| `pizzak` | `Pizza` | nev, kategorianev, vegetarianus | `kategorianev` → `Kategoria.nev` |
| `rendelesek` | `Rendeles` | az, pizzanev, darab, felvetel, kiszallitas | `pizzanev` → `Pizza.nev` |

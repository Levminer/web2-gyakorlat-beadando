# Net pizzéria – Web-programozás II beadandó

Szerver oldali webalkalmazás Node.js-ben (Express, EJS, Mongoose), MongoDB Atlas adatbázissal, Render.com-on futtatva.
Az adatbázis a „1-17-Pizza” (kategoria, pizza, rendeles táblák).

Kiindulópont: a gyakorlat _07b-Autentikáció_ megoldása.

- **Élő alkalmazás:** https://web2-gyakorlat-beadando-opac.onrender.com/
- **GitHub:** https://github.com/Levminer/web2-gyakorlat-beadando

> A Render ingyenes csomagjában a szolgáltatás 15 perc tétlenség után leáll, az első kérés ezért kb. 30–60 másodpercig is eltarthat.

### Belépési adatok (teszteléshez)

| Szerepkör            | Felhasználónév | Jelszó    |
| -------------------- | -------------- | --------- |
| Admin                | admin          | admin1234 |
| Regisztrált látogató | test           | test1234  |

Reszponzív téma: [Feane](https://themewagon.com/themes/feane/) (ThemeWagon / Free Html Templates, Bootstrap 4).
Fotók: [Unsplash](https://unsplash.com) (szabadon felhasználható, Unsplash License).

## Készítők

- Lőrik Levente (AICYHB)
- Fődi Kinga (EW67RO)

## Futtatás

```bash
npm install
cp .env.example .env
npm run dev
```

Az alkalmazás a http://localhost:3000 címen érhető el.

## Szerepkörök

| Szerepkör                     | Elérhető menük                                             |
| ----------------------------- | ---------------------------------------------------------- |
| Látogató                      | Főoldal, Adatbázis, Kapcsolat, Bejelentkezés, Regisztráció |
| Regisztrált látogató (`user`) | + Üzenetek, Diagram, Kijelentkezés                         |
| Admin (`admin`)               | + CRUD                                                     |

A CRUD menüben az admin pizzákat hozhat létre, módosíthat és törölhet (kategória legördülő listából). Mivel a rendelések a pizza nevével hivatkoznak a pizzára, átnevezéskor a rendelések is az új nevet kapják, törléskor pedig a pizza rendelései is törlődnek. Az eredeti adatok az `npm run seed` paranccsal állíthatók vissza.

## Adatbázis betöltése

A `data/` mappa a „1-17-Pizza” adatbázis tabulátorral tagolt fájljait tartalmazza. Betöltés MongoDB-be (a három collection tartalmát lecseréli, és ha az `ADMIN_PASSWORD` meg van adva, létrehozza / frissíti az admin felhasználót is):

```bash
npm run seed
```

| Collection   | Modell      | Mezők                                      | Kapcsolat                        |
| ------------ | ----------- | ------------------------------------------ | -------------------------------- |
| `kategoriak` | `Kategoria` | nev, ar                                    | –                                |
| `pizzak`     | `Pizza`     | nev, kategorianev, vegetarianus            | `kategorianev` → `Kategoria.nev` |
| `rendelesek` | `Rendeles`  | az, pizzanev, darab, felvetel, kiszallitas | `pizzanev` → `Pizza.nev`         |

Az alkalmazás saját collectionjei:

| Collection | Modell   | Mezők                                             | Megjegyzés                                                                                                                   |
| ---------- | -------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `users`    | `User`   | username, password (bcrypt hash), role            | `user` / `admin`                                                                                                             |
| `uzenetek` | `Uzenet` | nev, email, targy, szoveg, felhasznalo, createdAt | a Kapcsolat űrlapon küldött üzenetek; az Üzenetek oldal (csak bejelentkezve) a legfrissebbet mutatja elöl, a küldés idejével |

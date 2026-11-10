// Adatbázis feltöltése: npm run seed
// 1. A Pizza adatbázis betöltése a data/*.txt fájlokból
//    (a kategoriak, pizzak és rendelesek collectionök tartalmát lecseréli!)
// 2. Admin felhasználó létrehozása / frissítése, ha az ADMIN_PASSWORD meg van adva
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Kategoria = require("../models/Kategoria");
const Pizza = require("../models/Pizza");
const Rendeles = require("../models/Rendeles");
const User = require("../models/User");

// tabulátorral tagolt fájl -> objektumok tömbje (első sor: fejléc)
const readTable = (file) => {
    const lines = fs.readFileSync(path.join(__dirname, "..", "data", file), "utf8")
        .replace(/^﻿/, "")
        .split(/\r?\n/)
        .filter(line => line.trim() !== "");
    const header = lines.shift().split("\t");
    return lines.map(line => {
        const cells = line.split("\t");
        return Object.fromEntries(header.map((h, i) => [h, (cells[i] || "").trim()]));
    });
};

// "2005.11.12 5:44:00" -> Date (UTC-ben tárolva, hogy az időpont ne csússzon el)
const parseDate = (text) => {
    const m = text.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})\.?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!m) { throw new Error(`Hibás dátum: "${text}"`); }
    const [, y, mo, d, h, mi, s] = m.map(Number);
    return new Date(Date.UTC(y, mo - 1, d, h, mi, s || 0));
};

(async () => {
    await mongoose.connect(process.env.MONGO_URI);

    const kategoriak = readTable("kategoria.txt").map(r => ({ nev: r.nev, ar: Number(r.ar) }));
    const pizzak = readTable("pizza.txt").map(r => ({
        nev: r.nev,
        kategorianev: r.kategorianev,
        vegetarianus: r.vegetarianus === "1"
    }));
    const rendelesek = readTable("rendeles.txt").map((r, i) => ({
        az: i + 1,
        pizzanev: r.pizzanev,
        darab: Number(r.darab),
        felvetel: parseDate(r.felvetel),
        kiszallitas: r.kiszallitas ? parseDate(r.kiszallitas) : undefined
    }));

    // hivatkozások ellenőrzése
    const kategoriaNevek = new Set(kategoriak.map(k => k.nev));
    const pizzaNevek = new Set(pizzak.map(p => p.nev));
    const rosszPizza = pizzak.filter(p => !kategoriaNevek.has(p.kategorianev));
    const rosszRendeles = rendelesek.filter(r => !pizzaNevek.has(r.pizzanev));
    if (rosszPizza.length || rosszRendeles.length) {
        console.warn(`Figyelmeztetés: ${rosszPizza.length} pizza ismeretlen kategóriával, ${rosszRendeles.length} rendelés ismeretlen pizzával.`);
    }

    await Promise.all([Kategoria.deleteMany({}), Pizza.deleteMany({}), Rendeles.deleteMany({})]);
    await Kategoria.insertMany(kategoriak);
    await Pizza.insertMany(pizzak);
    for (let i = 0; i < rendelesek.length; i += 5000) {
        await Rendeles.insertMany(rendelesek.slice(i, i + 5000), { ordered: false });
    }
    await Promise.all([Kategoria.syncIndexes(), Pizza.syncIndexes(), Rendeles.syncIndexes()]);

    console.log(`Betöltve: ${kategoriak.length} kategória, ${pizzak.length} pizza, ${rendelesek.length} rendelés.`);

    // admin felhasználó (a többi felhasználót nem érinti)
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminPassword) {
        const hash = await bcrypt.hash(adminPassword, 10);
        await User.findOneAndUpdate(
            { username: adminUsername },
            { username: adminUsername, password: hash, role: "admin" },
            { upsert: true }
        );
        console.log(`Admin felhasználó kész: ${adminUsername}`);
    } else {
        console.log("Admin kihagyva: az ADMIN_PASSWORD nincs megadva a .env-ben.");
    }
    await mongoose.disconnect();
})().catch(err => {
    console.error(err.message);
    process.exit(1);
});

const Kategoria = require("../models/Kategoria");
const Pizza = require("../models/Pizza");
const Rendeles = require("../models/Rendeles");

const honapNev = new Intl.DateTimeFormat("hu-HU", { year: "numeric", month: "short", timeZone: "UTC" });

// Diagram oldal: a rendeléseket egyetlen lekérdezésben ($facet) pizzánként csoportosítjuk
// (havonta, óránként, összesen), majd a pizzák kategóriája (populate) alapján összesítünk.
exports.index = async (req, res) => {
    const [kategoriak, pizzak, [eredmeny]] = await Promise.all([
        Kategoria.find().sort({ ar: 1 }).lean(),
        Pizza.find().populate("kategoria"),
        Rendeles.aggregate([
            { $facet: {
                pizzak: [{ $group: { _id: "$pizzanev", darab: { $sum: "$darab" } } }],
                havi: [{ $group: { _id: { pizza: "$pizzanev", honap: { $dateToString: { format: "%Y-%m", date: "$felvetel" } } }, db: { $sum: 1 } } }],
                orak: [{ $group: { _id: { pizza: "$pizzanev", ora: { $hour: "$felvetel" } }, db: { $sum: 1 } } }],
                idoszak: [{ $group: { _id: null, elso: { $min: "$felvetel" }, utolso: { $max: "$felvetel" } } }]
            } }
        ])
    ]);

    const katNevek = kategoriak.map(k => k.nev);
    const pizzaMap = new Map(pizzak.map(p => [p.nev, p]));
    const ures = () => Object.fromEntries(katNevek.map(k => [k, 0]));

    // bevétel és vegetáriánus / egyéb eladott darab kategóriánként
    const bevetelMap = ures();
    const darabMap = ures();
    const vegaMap = ures();
    eredmeny.pizzak.forEach(r => {
        const p = pizzaMap.get(r._id);
        if (!p || !p.kategoria) { return; }
        bevetelMap[p.kategorianev] += r.darab * p.kategoria.ar;
        darabMap[p.kategorianev] += r.darab;
        if (p.vegetarianus) { vegaMap[p.kategorianev] += r.darab; }
    });
    const bevetel = kategoriak.map(k => ({ kategoria: k.nev, ar: k.ar, bevetel: bevetelMap[k.nev], darab: darabMap[k.nev] }));
    const vega = katNevek.map(k => ({ kategoria: k, vegetarianus: vegaMap[k], egyeb: darabMap[k] - vegaMap[k] }));

    // rendelések havonta és óránként, kategóriánként bontva (a szűrőhöz)
    const honapok = [...new Set(eredmeny.havi.map(r => r._id.honap))].sort();
    const sorozat = (rows, kulcsok, mezo) => {
        const index = new Map(kulcsok.map((k, i) => [k, i]));
        const ki = Object.fromEntries(katNevek.map(k => [k, kulcsok.map(() => 0)]));
        rows.forEach(r => {
            const p = pizzaMap.get(r._id.pizza);
            if (p && ki[p.kategorianev]) { ki[p.kategorianev][index.get(r._id[mezo])] += r.db; }
        });
        return ki;
    };

    // az első és az utolsó hónap csak részben szerepel az adatokban
    const idoszak = eredmeny.idoszak[0] || null;
    const resz = new Set();
    if (idoszak) {
        const elso = new Date(idoszak.elso);
        const utolso = new Date(idoszak.utolso);
        const honapVege = new Date(Date.UTC(utolso.getUTCFullYear(), utolso.getUTCMonth() + 1, 0)).getUTCDate();
        if (elso.getUTCDate() > 1) { resz.add(honapok[0]); }
        if (utolso.getUTCDate() < honapVege) { resz.add(honapok[honapok.length - 1]); }
    }

    const adatok = {
        kategoriak: katNevek,
        bevetel,
        vega,
        havi: {
            honapok: honapok.map(h => ({ kulcs: h, cimke: honapNev.format(new Date(`${h}-01T00:00:00Z`)), resz: resz.has(h) })),
            kategoriank: sorozat(eredmeny.havi, honapok, "honap")
        },
        orak: { kategoriank: sorozat(eredmeny.orak, Array.from({ length: 24 }, (_, i) => i), "ora") }
    };

    res.render("diagram", { adatok, idoszak });
};

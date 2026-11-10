const Kategoria = require("../models/Kategoria");
const Pizza = require("../models/Pizza");
const Rendeles = require("../models/Rendeles");

const ORDERS_PER_PAGE = 25;

// pizzanév -> { darab, rendelesek } a rendelesek collectionből
const orderStatsByPizza = async () => {
    const rows = await Rendeles.aggregate([
        { $group: { _id: "$pizzanev", darab: { $sum: "$darab" }, rendelesek: { $sum: 1 } } }
    ]);
    return new Map(rows.map(r => [r._id, r]));
};

// pizzák a kategóriájukkal (populate) és a rendelési adataikkal együtt
const pizzasWithStats = async (filter = {}) => {
    const [pizzak, stats] = await Promise.all([
        Pizza.find(filter).populate("kategoria"),
        orderStatsByPizza()
    ]);
    return pizzak.map(p => {
        const s = stats.get(p.nev) || { darab: 0, rendelesek: 0 };
        const ar = p.kategoria ? p.kategoria.ar : 0;
        return {
            nev: p.nev,
            kategorianev: p.kategorianev,
            vegetarianus: p.vegetarianus,
            ar,
            rendeltDarab: s.darab,
            rendelesekSzama: s.rendelesek,
            bevetel: s.darab * ar
        };
    });
};

exports.home = async (req, res) => {
    const [kategoriak, pizzak, rendelesekSzama, idoStat] = await Promise.all([        Kategoria.find().sort({ ar: 1 }),
        pizzasWithStats(),
        Rendeles.countDocuments(),
        Rendeles.aggregate([
            { $group: { _id: null, atlag: { $avg: { $subtract: ["$kiszallitas", "$felvetel"] } } } }
        ])
    ]);

    const kategoriaKartyak = kategoriak.map(k => ({
        nev: k.nev,
        ar: k.ar,
        pizzak: pizzak.filter(p => p.kategorianev === k.nev).length
    }));
    const kedvencek = [...pizzak].sort((a, b) => b.rendeltDarab - a.rendeltDarab).slice(0, 6);

    res.render("home", {
        kategoriak: kategoriaKartyak,
        kedvencek,
        stat: {
            pizzak: pizzak.length,
            vegetarianus: pizzak.filter(p => p.vegetarianus).length,
            rendelesek: rendelesekSzama,
            eladottPizza: pizzak.reduce((sum, p) => sum + p.rendeltDarab, 0),
            atlagSzallitas: idoStat.length ? Math.round(idoStat[0].atlag / 60000) : 0
        }
    });
};

exports.database = async (req, res) => {
    const [kategoriak, pizzaszam] = await Promise.all([
        Kategoria.find().sort({ ar: 1 }),
        Pizza.aggregate([{ $group: { _id: "$kategorianev", db: { $sum: 1 } } }])
    ]);
    const pizzaszamMap = new Map(pizzaszam.map(r => [r._id, r.db]));

    // pizzák szűrése és rendezése
    const kategoria = kategoriak.some(k => k.nev === req.query.kategoria) ? req.query.kategoria : "";
    const csakVega = req.query.vega === "1";
    const rendezes = ["nev", "ar", "rendelt"].includes(req.query.rendezes) ? req.query.rendezes : "nev";

    const filter = {};
    if (kategoria) { filter.kategorianev = kategoria; }
    if (csakVega) { filter.vegetarianus = true; }
    const pizzak = await pizzasWithStats(filter);
    if (rendezes === "ar") { pizzak.sort((a, b) => a.ar - b.ar || a.nev.localeCompare(b.nev, "hu")); }
    if (rendezes === "rendelt") { pizzak.sort((a, b) => b.rendeltDarab - a.rendeltDarab); }
    if (rendezes === "nev") { pizzak.sort((a, b) => a.nev.localeCompare(b.nev, "hu")); }

    // rendelések lapozva, a pizzával és annak kategóriájával (populate)
    const pizzaNevek = (await Pizza.find({}, "nev")).map(p => p.nev).sort((a, b) => a.localeCompare(b, "hu"));
    const rendelesPizza = pizzaNevek.includes(req.query.pizza) ? req.query.pizza : "";
    const rendelesFilter = rendelesPizza ? { pizzanev: rendelesPizza } : {};
    const osszesRendeles = await Rendeles.countDocuments(rendelesFilter);
    const oldalakSzama = Math.max(1, Math.ceil(osszesRendeles / ORDERS_PER_PAGE));
    const oldal = Math.min(Math.max(parseInt(req.query.oldal, 10) || 1, 1), oldalakSzama);
    const rendelesek = await Rendeles.find(rendelesFilter)
        .sort({ felvetel: -1, az: -1 })
        .skip((oldal - 1) * ORDERS_PER_PAGE)
        .limit(ORDERS_PER_PAGE)
        .populate({ path: "pizza", populate: { path: "kategoria" } });

    res.render("adatbazis", {
        title: "Adatbázis",
        kategoriak: kategoriak.map(k => ({ nev: k.nev, ar: k.ar, pizzak: pizzaszamMap.get(k.nev) || 0 })),
        pizzak,
        szuro: { kategoria, csakVega, rendezes },
        pizzaNevek,
        rendelesek,
        rendelesPizza,
        lapozas: { oldal, oldalakSzama, osszes: osszesRendeles }
    });
};

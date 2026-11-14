const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const Kategoria = require("../models/Kategoria");
const Pizza = require("../models/Pizza");
const Rendeles = require("../models/Rendeles");

const flash = (req, type, text) => {
    req.session.messageType = type;
    req.session.message = text;
};

// Pizza űrlap: szerver oldali ellenőrzés
exports.pizzaRules = [
    body("nev")
        .isString().withMessage("Adja meg a pizza nevét!").bail()
        .trim()
        .notEmpty().withMessage("Adja meg a pizza nevét!").bail()
        .isLength({ min: 2, max: 40 }).withMessage("A név 2–40 karakter lehet.").bail()
        .matches(/^[\p{L}0-9 '.-]+$/u).withMessage("A név csak betűt, számot, szóközt és - ' . jelet tartalmazhat."),
    body("kategorianev")
        .isString().withMessage("Válasszon kategóriát!").bail()
        .custom(async (nev) => {
            if (!(await Kategoria.exists({ nev }))) { throw new Error("Válasszon kategóriát!"); }
        })
];

const formValues = (source) => ({
    nev: typeof source.nev === "string" ? source.nev : "",
    kategorianev: typeof source.kategorianev === "string" ? source.kategorianev : "",
    vegetarianus: source.vegetarianus === true || source.vegetarianus === "1"
});

// azonos nevű pizza keresése kis- és nagybetűtől függetlenül (a sajátját kivéve)
const nameTaken = (nev, exceptId) => {
    const filter = exceptId ? { nev, _id: { $ne: exceptId } } : { nev };
    return Pizza.findOne(filter).collation({ locale: "hu", strength: 2 });
};

const renderForm = async (res, status, data) => {
    const kategoriak = await Kategoria.find().sort({ ar: 1 });
    res.status(status).render("crud_form", { kategoriak, hibak: {}, ...data });
};

// a hibás vagy nem létező azonosítót a listára irányítjuk vissza
const findPizza = async (req, res) => {
    const pizza = mongoose.isValidObjectId(req.params.id) ? await Pizza.findById(req.params.id) : null;
    if (!pizza) {
        flash(req, "warning", "A keresett pizza nem található.");
        res.redirect("/crud");
    }
    return pizza;
};

const validationErrors = (req) => {
    const hibak = {};
    Object.entries(validationResult(req).mapped()).forEach(([mezo, hiba]) => { hibak[mezo] = hiba.msg; });
    return hibak;
};

exports.index = async (req, res) => {
    const kereses = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const [kategoriak, rendelesek] = await Promise.all([
        Kategoria.find().sort({ ar: 1 }),
        Rendeles.aggregate([{ $group: { _id: "$pizzanev", db: { $sum: 1 } } }])
    ]);
    const kategoria = kategoriak.some(k => k.nev === req.query.kategoria) ? req.query.kategoria : "";

    const filter = {};
    if (kereses) { filter.nev = { $regex: kereses.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" }; }
    if (kategoria) { filter.kategorianev = kategoria; }
    const pizzak = await Pizza.find(filter).populate("kategoria");
    pizzak.sort((a, b) => a.nev.localeCompare(b.nev, "hu"));

    res.render("crud", {
        pizzak,
        kategoriak,
        rendelesSzam: new Map(rendelesek.map(r => [r._id, r.db])),
        szuro: { kereses, kategoria },
        osszes: await Pizza.countDocuments()
    });
};

exports.newGet = (req, res) => renderForm(res, 200, { pizza: null, ertekek: formValues({}) });

exports.create = async (req, res) => {
    const ertekek = formValues(req.body);
    const hibak = validationErrors(req);
    if (!hibak.nev && await nameTaken(ertekek.nev)) { hibak.nev = "Ilyen nevű pizza már létezik!"; }
    if (Object.keys(hibak).length) {
        return renderForm(res, 422, { pizza: null, ertekek, hibak });
    }
    await Pizza.create(ertekek);
    flash(req, "success", `A(z) „${ertekek.nev}” pizza létrehozva.`);
    res.redirect("/crud");
};

exports.editGet = async (req, res) => {
    const pizza = await findPizza(req, res);
    if (!pizza) { return; }
    renderForm(res, 200, { pizza, ertekek: formValues(pizza) });
};

exports.update = async (req, res) => {
    const pizza = await findPizza(req, res);
    if (!pizza) { return; }
    const ertekek = formValues(req.body);
    const hibak = validationErrors(req);
    if (!hibak.nev && await nameTaken(ertekek.nev, pizza._id)) { hibak.nev = "Ilyen nevű pizza már létezik!"; }
    if (Object.keys(hibak).length) {
        return renderForm(res, 422, { pizza, ertekek, hibak });
    }

    const regiNev = pizza.nev;
    Object.assign(pizza, ertekek);
    await pizza.save();
    // a rendelések névvel hivatkoznak a pizzára, ezért átnevezéskor azokat is frissítjük
    let atnevezve = 0;
    if (regiNev !== ertekek.nev) {
        atnevezve = (await Rendeles.updateMany({ pizzanev: regiNev }, { pizzanev: ertekek.nev })).modifiedCount;
    }
    flash(req, "success", `A(z) „${ertekek.nev}” pizza módosítva.` + (atnevezve ? ` ${atnevezve} rendelés is átnevezve.` : ""));
    res.redirect("/crud");
};

exports.deleteGet = async (req, res) => {
    const pizza = await findPizza(req, res);
    if (!pizza) { return; }
    await pizza.populate("kategoria");
    const rendelesek = await Rendeles.countDocuments({ pizzanev: pizza.nev });
    res.render("crud_delete", { pizza, rendelesek });
};

exports.delete = async (req, res) => {
    const pizza = await findPizza(req, res);
    if (!pizza) { return; }
    // a pizzára hivatkozó rendelések is törlődnek, hogy ne maradjon árva rendelés
    const torolt = (await Rendeles.deleteMany({ pizzanev: pizza.nev })).deletedCount;
    await pizza.deleteOne();
    flash(req, "success", `A(z) „${pizza.nev}” pizza törölve` + (torolt ? ` (${torolt} rendeléssel együtt).` : "."));
    res.redirect("/crud");
};

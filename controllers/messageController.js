const { body, validationResult } = require("express-validator");
const Uzenet = require("../models/Uzenet");

const MESSAGES_PER_PAGE = 10;

// Kapcsolat űrlap: szerver oldali ellenőrzés (express-validator)
exports.contactRules = [
    body("nev")
        .isString().withMessage("Adja meg a nevét!").bail()
        .trim()
        .notEmpty().withMessage("Adja meg a nevét!").bail()
        .isLength({ min: 2, max: 100 }).withMessage("A név 2–100 karakter lehet."),
    body("email")
        .isString().withMessage("Adja meg az e-mail címét!").bail()
        .trim()
        .notEmpty().withMessage("Adja meg az e-mail címét!").bail()
        .isLength({ max: 254 }).withMessage("Az e-mail cím legfeljebb 254 karakter lehet.").bail()
        .isEmail().withMessage("Érvénytelen e-mail cím!"),
    body("targy")
        .optional({ values: "falsy" })
        .isString().withMessage("Érvénytelen tárgy!").bail()
        .trim()
        .isLength({ max: 150 }).withMessage("A tárgy legfeljebb 150 karakter lehet."),
    body("szoveg")
        .isString().withMessage("Írja meg az üzenetét!").bail()
        .trim()
        .notEmpty().withMessage("Írja meg az üzenetét!").bail()
        .isLength({ min: 10, max: 2000 }).withMessage("Az üzenet 10–2000 karakter lehet.")
];

const formValues = (source) => {
    const str = (v) => (typeof v === "string" ? v : "");
    return { nev: str(source.nev), email: str(source.email), targy: str(source.targy), szoveg: str(source.szoveg) };
};

exports.contactGet = (req, res) => {
    const user = req.session.user;
    res.render("kapcsolat", {
        ertekek: formValues({ nev: user ? user.username : "" }),
        hibak: {}
    });
};

exports.contactPost = async (req, res) => {
    const ertekek = formValues(req.body);
    const result = validationResult(req);
    if (!result.isEmpty()) {
        // hibás űrlap: újra megjelenítjük a beírt értékekkel és a mezőnkénti hibákkal
        const hibak = {};
        Object.entries(result.mapped()).forEach(([mezo, hiba]) => { hibak[mezo] = hiba.msg; });
        res.locals.message = "Az üzenet nem került elküldésre, kérjük javítsa a hibákat!";
        res.locals.messageType = "danger";
        return res.status(422).render("kapcsolat", { ertekek, hibak });
    }

    await Uzenet.create({
        ...ertekek,
        felhasznalo: req.session.user ? req.session.user.username : null
    });
    req.session.messageType = "success";
    req.session.message = "Köszönjük, üzenetét elküldtük!";
    res.redirect("/kapcsolat");
};

// Üzenetek: a legfrissebb elöl, lapozva
exports.index = async (req, res) => {
    const osszes = await Uzenet.countDocuments();
    const oldalakSzama = Math.max(1, Math.ceil(osszes / MESSAGES_PER_PAGE));
    const oldal = Math.min(Math.max(parseInt(req.query.oldal, 10) || 1, 1), oldalakSzama);

    const uzenetek = await Uzenet.find()
        .sort({ createdAt: -1, _id: -1 })
        .skip((oldal - 1) * MESSAGES_PER_PAGE)
        .limit(MESSAGES_PER_PAGE)
        .lean();

    res.render("uzenetek", {
        uzenetek,
        lapozas: { oldal, oldalakSzama, osszes }
    });
};

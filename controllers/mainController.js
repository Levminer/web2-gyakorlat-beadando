const User = require("../models/User");
const bcrypt = require("bcrypt");

const flash = (req, type, text) => {
    req.session.messageType = type;
    req.session.message = text;
};

exports.chartIndex = (req, res) => { res.render("diagram"); };

exports.registerGet = (req, res) => { res.render("register"); };
exports.registerPost = async (req, res) => {
    const username = (req.body.username || "").trim();
    const password = req.body.password || "";

    if (!/^[\p{L}0-9_.-]{3,30}$/u.test(username)) {
        flash(req, "danger", "A felhasználónév 3–30 karakter lehet (betű, szám, _ . -).");
        return res.redirect("/register");
    }
    if (password.length < 6) {
        flash(req, "danger", "A jelszó legalább 6 karakter legyen!");
        return res.redirect("/register");
    }
    if (password !== req.body.password2) {
        flash(req, "danger", "A két jelszó nem egyezik!");
        return res.redirect("/register");
    }
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        flash(req, "danger", "Ez a felhasználónév már foglalt!");
        return res.redirect("/register");
    }
    const hash = await bcrypt.hash(password, 10);
    await User.create({ username, password: hash, role: "user" });
    flash(req, "success", "Sikeres regisztráció! Most már bejelentkezhet.");
    res.redirect("/login");
};

exports.loginGet = (req, res) => { res.render("login"); };
exports.loginPost = async (req, res) => {
    const user = await User.findOne({ username: (req.body.username || "").trim() });
    const ok = user && await bcrypt.compare(req.body.password || "", user.password);
    if (!ok) {
        flash(req, "danger", "Hibás felhasználónév vagy jelszó!");
        return res.redirect("/login");
    }
    req.session.user = { id: user._id, username: user.username, role: user.role };
    flash(req, "success", `Üdvözöljük, ${user.username}!`);
    res.redirect("/");
};

exports.logout = (req, res) => {
    req.session.destroy(() => { res.redirect("/"); });
};

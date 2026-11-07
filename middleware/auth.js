// Szerepkörök: látogató (nincs session), regisztrált látogató ("user"), admin ("admin")

exports.isLoggedIn = (req, res, next) => {
    if (req.session.user) { return next(); }
    req.session.message = "Az oldal megtekintéséhez jelentkezzen be!";
    req.session.messageType = "warning";
    res.redirect("/login");
};

exports.isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === "admin") { return next(); }
    req.session.message = "Ehhez az oldalhoz csak admin férhet hozzá!";
    req.session.messageType = "danger";
    res.redirect(req.session.user ? "/" : "/login");
};

exports.isGuest = (req, res, next) => {
    if (!req.session.user) { return next(); }
    res.redirect("/");
};

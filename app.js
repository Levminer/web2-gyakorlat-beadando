require("dotenv").config();
const express = require("express");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const connectDB = require("./config/db");
const app = express();
const production = process.env.NODE_ENV === "production";
if (!process.env.SESSION_SECRET) {
    console.error("Hiányzik a SESSION_SECRET környezeti változó!");
    process.exit(1);
}
connectDB();
app.set("view engine", "ejs");
// Render.com proxy mögött fut (HTTPS a proxyig), így a secure süti is működik
if (production) { app.set("trust proxy", 1); }
Object.assign(app.locals, require("./helpers/format"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", secure: production, maxAge: 1000 * 60 * 60 * 24 },
    store: MongoStore.create({mongoUrl: process.env.SESSION_MONGO_URI || process.env.MONGO_URI, collectionName: "sessions"})
}));
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    res.locals.currentPath = req.path;
    res.locals.message = req.session.message || "";
    res.locals.messageType = req.session.messageType || "info";
    req.session.message = "";
    req.session.messageType = "";
    next();
});
app.use("/", require("./routes/mainRouter"));
app.use((req, res) => {
    res.status(404).render("hiba", { statusz: 404, cim: "Az oldal nem található", szoveg: "A keresett oldal nem létezik vagy áthelyezték." });
});
app.use((err, req, res, next) => {
    console.error(err);
    if (res.headersSent) { return next(err); }
    res.locals.user = res.locals.user || (req.session && req.session.user);
    res.locals.currentPath = res.locals.currentPath || req.path;
    res.locals.message = res.locals.message || "";
    res.locals.messageType = res.locals.messageType || "info";
    res.status(500).render("hiba", { statusz: 500, cim: "Váratlan hiba történt", szoveg: "Kérjük, próbálja újra később." });
});
const port = process.env.PORT || 3000;
app.listen(port, () => {console.log(`Server: http://localhost:${port}`);});

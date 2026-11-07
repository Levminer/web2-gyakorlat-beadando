require("dotenv").config();
const express = require("express");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const connectDB = require("./config/db");
const app = express();
connectDB();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
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
const port = process.env.PORT || 3000;
app.listen(port, () => {console.log(`Server: http://localhost:${port}`);});

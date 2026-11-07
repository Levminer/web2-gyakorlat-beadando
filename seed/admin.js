// Admin felhasználó létrehozása / frissítése: npm run seed:admin
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");

(async () => {
    const username = process.env.ADMIN_USERNAME || "admin";
    const password = process.env.ADMIN_PASSWORD;
    if (!password) {
        console.error("Állítsa be az ADMIN_PASSWORD környezeti változót (.env)!");
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    const hash = await bcrypt.hash(password, 10);
    await User.findOneAndUpdate(
        { username },
        { username, password: hash, role: "admin" },
        { upsert: true }
    );
    console.log(`Admin felhasználó kész: ${username}`);
    await mongoose.disconnect();
})().catch(err => {
    console.error(err.message);
    process.exit(1);
});

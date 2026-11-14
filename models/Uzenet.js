const mongoose = require("mongoose");
const uzenetSchema = new mongoose.Schema({
    nev: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    targy: { type: String, trim: true, maxlength: 150, default: "" },
    szoveg: { type: String, required: true, trim: true, maxlength: 2000 },
    // a küldő felhasználóneve, ha bejelentkezve küldte
    felhasznalo: { type: String, trim: true, default: null }
}, { collection: "uzenetek", timestamps: { createdAt: true, updatedAt: false } });

uzenetSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Uzenet", uzenetSchema);

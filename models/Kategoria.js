const mongoose = require("mongoose");
const kategoriaSchema = new mongoose.Schema({
    nev: { type: String, required: true, unique: true, trim: true },
    ar: { type: Number, required: true, min: 0 }
}, { collection: "kategoriak" });
module.exports = mongoose.model("Kategoria", kategoriaSchema);

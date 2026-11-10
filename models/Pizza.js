const mongoose = require("mongoose");
const pizzaSchema = new mongoose.Schema({
    nev: { type: String, required: true, unique: true, trim: true },
    kategorianev: { type: String, required: true, trim: true },
    vegetarianus: { type: Boolean, default: false }
}, { collection: "pizzak", toJSON: { virtuals: true }, toObject: { virtuals: true } });

// pizza.kategorianev -> kategoria.nev
pizzaSchema.virtual("kategoria", {
    ref: "Kategoria",
    localField: "kategorianev",
    foreignField: "nev",
    justOne: true
});

module.exports = mongoose.model("Pizza", pizzaSchema);

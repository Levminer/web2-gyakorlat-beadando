const mongoose = require("mongoose");
const rendelesSchema = new mongoose.Schema({
    az: { type: Number, required: true, unique: true },
    pizzanev: { type: String, required: true, index: true },
    darab: { type: Number, required: true, min: 1 },
    felvetel: { type: Date, required: true },
    kiszallitas: { type: Date }
}, { collection: "rendelesek", toJSON: { virtuals: true }, toObject: { virtuals: true } });

// rendeles.pizzanev -> pizza.nev
rendelesSchema.virtual("pizza", {
    ref: "Pizza",
    localField: "pizzanev",
    foreignField: "nev",
    justOne: true
});

module.exports = mongoose.model("Rendeles", rendelesSchema);

const Uzenet = require("../models/Uzenet");

const MESSAGES_PER_PAGE = 10;

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

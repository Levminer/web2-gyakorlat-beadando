// Megjelenítési segédfüggvények (app.locals-ként elérhetők a nézetekben)

// A rendelési időpontok UTC-ben vannak tárolva, ezért UTC-ben is jelenítjük meg
const dateFormatter = new Intl.DateTimeFormat("hu-HU", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", timeZone: "UTC"
});

// Az üzenetek valós küldési ideje magyar idő szerint jelenik meg
const dateTimeFormatter = new Intl.DateTimeFormat("hu-HU", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Budapest"
});

exports.formatDate = (date) => (date ? dateFormatter.format(new Date(date)) : "–");
exports.formatDateTime = (date) => (date ? dateTimeFormatter.format(new Date(date)) : "–");
exports.formatNumber = (n) => new Intl.NumberFormat("hu-HU").format(n || 0);
exports.formatFt = (n) => `${exports.formatNumber(n)} Ft`;
exports.minutesBetween = (from, to) => (from && to ? Math.round((new Date(to) - new Date(from)) / 60000) : null);

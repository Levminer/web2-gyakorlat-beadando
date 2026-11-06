// aktuális év a láblécben
document.querySelectorAll("#displayYear").forEach(el => {
    el.textContent = new Date().getFullYear();
});

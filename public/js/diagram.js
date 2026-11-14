// Diagram oldal (Chart.js) – az adatokat a szerver a #diagramAdatok JSON blokkban adja át
(function () {
    const forras = document.getElementById("diagramAdatok");
    if (!forras || typeof Chart === "undefined") { return; }
    const adatok = JSON.parse(forras.textContent);

    // színek (a dataviz palettaellenőrzőn átengedve, fehér háttéren)
    const SZIN = {
        sorozat: "#e69c00",               // a sablon sötétebb sárgája
        sorozatHalvany: "rgba(230, 156, 0, 0.10)",
        vega: "#2e8b3a",
        hatter: "#ffffff",
        szoveg: "#212529",
        halvanySzoveg: "#6c757d",
        racs: "#e9ecef",
        tengely: "#ced4da"
    };

    const szam = new Intl.NumberFormat("hu-HU");
    const tomor = new Intl.NumberFormat("hu-HU", { notation: "compact", maximumFractionDigits: 1 });
    const osszeg = (sorok) => sorok[0].map((_, i) => sorok.reduce((s, sor) => s + sor[i], 0));

    Chart.defaults.font.family = "'Open Sans', sans-serif";
    Chart.defaults.font.size = 13;
    Chart.defaults.color = SZIN.halvanySzoveg;
    Chart.defaults.maintainAspectRatio = false;
    Chart.defaults.animation.duration = 300;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        Chart.defaults.animation = false;
    }
    Object.assign(Chart.defaults.plugins.tooltip, {
        backgroundColor: "#222831",
        padding: 10,
        cornerRadius: 6,
        titleColor: "#ced4da",
        titleFont: { weight: "normal" },
        bodyColor: "#ffffff",
        bodyFont: { weight: "bold" },
        boxWidth: 12,
        boxHeight: 3,
        boxPadding: 6
    });

    const tengely = (extra) => Object.assign({
        grid: { color: SZIN.racs, drawTicks: false },
        border: { color: SZIN.tengely },
        ticks: { padding: 8 }
    }, extra);
    const xTengely = (extra) => Object.assign({ grid: { display: false }, border: { color: SZIN.tengely }, ticks: { padding: 6 } }, extra);

    // oszlopok tetejére írt érték (csak ahol kevés oszlop van)
    const ertekCimke = {
        id: "ertekCimke",
        afterDatasetsDraw(chart, _args, opts) {
            const { ctx } = chart;
            const meta = chart.getDatasetMeta(0);
            ctx.save();
            ctx.font = `600 12px ${Chart.defaults.font.family}`;
            ctx.fillStyle = SZIN.szoveg;
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            meta.data.forEach((bar, i) => {
                ctx.fillText(opts.format(chart.data.datasets[0].data[i]), bar.x, bar.y - 6);
            });
            ctx.restore();
        }
    };

    // függőleges segédvonal a vonaldiagramon a kijelölt hónapnál
    const segedvonal = {
        id: "segedvonal",
        afterDatasetsDraw(chart) {
            const aktiv = chart.tooltip && chart.tooltip.getActiveElements();
            if (!aktiv || !aktiv.length) { return; }
            const { ctx, chartArea } = chart;
            ctx.save();
            ctx.strokeStyle = SZIN.tengely;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(Math.round(aktiv[0].element.x) + 0.5, chartArea.top);
            ctx.lineTo(Math.round(aktiv[0].element.x) + 0.5, chartArea.bottom);
            ctx.stroke();
            ctx.restore();
        }
    };

    // 1. Bevétel kategóriánként
    new Chart(document.getElementById("bevetelChart"), {
        type: "bar",
        data: {
            labels: adatok.bevetel.map(r => r.kategoria),
            datasets: [{
                label: "Bevétel",
                data: adatok.bevetel.map(r => r.bevetel),
                backgroundColor: SZIN.sorozat,
                hoverBackgroundColor: "#c98500",
                borderRadius: 4,
                borderSkipped: "start",
                maxBarThickness: 24
            }]
        },
        options: {
            layout: { padding: { top: 24 } },
            interaction: { mode: "index", intersect: false },
            plugins: {
                legend: { display: false },
                ertekCimke: { format: v => `${tomor.format(v)} Ft` },
                tooltip: {
                    callbacks: {
                        label: c => ` ${szam.format(c.raw)} Ft`,
                        afterLabel: c => `${szam.format(adatok.bevetel[c.dataIndex].darab)} db × ${szam.format(adatok.bevetel[c.dataIndex].ar)} Ft`
                    }
                }
            },
            scales: {
                x: xTengely(),
                y: tengely({ beginAtZero: true, ticks: { padding: 8, callback: v => tomor.format(v) } })
            }
        },
        plugins: [ertekCimke]
    });

    // 2. Vegetáriánus és egyéb pizzák (halmozott sáv)
    new Chart(document.getElementById("vegaChart"), {
        type: "bar",
        data: {
            labels: adatok.vega.map(r => r.kategoria),
            datasets: [
                {
                    label: "Vegetáriánus",
                    data: adatok.vega.map(r => r.vegetarianus),
                    backgroundColor: SZIN.vega,
                    borderColor: SZIN.hatter,
                    borderWidth: { right: 2 },
                    borderSkipped: false,
                    maxBarThickness: 24
                },
                {
                    label: "Egyéb",
                    data: adatok.vega.map(r => r.egyeb),
                    backgroundColor: SZIN.sorozat,
                    borderRadius: { topRight: 4, bottomRight: 4 },
                    borderSkipped: false,
                    maxBarThickness: 24
                }
            ]
        },
        options: {
            indexAxis: "y",
            interaction: { mode: "index", intersect: false },
            plugins: {
                legend: { position: "top", align: "start", labels: { boxWidth: 12, boxHeight: 12, color: SZIN.szoveg } },
                tooltip: {
                    callbacks: {
                        label: c => ` ${szam.format(c.raw)} db – ${c.dataset.label.toLowerCase()}`,
                        footer: items => {
                            const r = adatok.vega[items[0].dataIndex];
                            const ossz = r.vegetarianus + r.egyeb;
                            return ossz ? `Vegetáriánus arány: ${Math.round(r.vegetarianus / ossz * 100)}%` : "";
                        }
                    }
                }
            },
            scales: {
                x: tengely({ stacked: true, beginAtZero: true, ticks: { padding: 8, callback: v => tomor.format(v) } }),
                y: xTengely({ stacked: true })
            }
        }
    });

    // 3–4. Rendelések havonta és óránként – a kategóriaszűrő mindkettőt frissíti
    const katNevek = adatok.kategoriak;
    const sorozatok = (forrasAdat, kat) => (kat ? forrasAdat[kat] : osszeg(katNevek.map(k => forrasAdat[k])));
    const honapok = adatok.havi.honapok;
    const reszleges = (i) => honapok[i] && honapok[i].resz;

    const haviChart = new Chart(document.getElementById("haviChart"), {
        type: "line",
        data: {
            labels: honapok.map(h => h.cimke),
            datasets: [{
                label: "Rendelések",
                data: sorozatok(adatok.havi.kategoriank, ""),
                borderColor: SZIN.sorozat,
                backgroundColor: SZIN.sorozatHalvany,
                fill: "origin",
                borderWidth: 2,
                borderCapStyle: "round",
                borderJoinStyle: "round",
                tension: 0,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBorderWidth: 2,
                // a részleges hónapok pontjai üresek (sorozatszínű gyűrűvel)
                pointBorderColor: honapok.map(h => (h.resz ? SZIN.sorozat : SZIN.hatter)),
                pointBackgroundColor: honapok.map(h => (h.resz ? SZIN.hatter : SZIN.sorozat)),
                pointHoverBorderColor: SZIN.hatter,
                segment: { borderDash: c => (reszleges(c.p0DataIndex) || reszleges(c.p1DataIndex) ? [6, 4] : undefined) }
            }]
        },
        options: {
            interaction: { mode: "index", intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: c => ` ${szam.format(c.raw)} rendelés`,
                        afterLabel: c => (reszleges(c.dataIndex) ? "csak részleges hónap" : "")
                    }
                }
            },
            scales: {
                x: xTengely({ ticks: { padding: 6, maxRotation: 0, autoSkipPadding: 12 } }),
                y: tengely({ beginAtZero: true, ticks: { padding: 8, callback: v => szam.format(v) } })
            }
        },
        plugins: [segedvonal]
    });
    const oraChart = new Chart(document.getElementById("oraChart"), {
        type: "bar",
        data: {
            labels: Array.from({ length: 24 }, (_, i) => String(i)),
            datasets: [{
                label: "Rendelések",
                data: sorozatok(adatok.orak.kategoriank, ""),
                backgroundColor: SZIN.sorozat,
                hoverBackgroundColor: "#c98500",
                borderRadius: 4,
                borderSkipped: "start",
                maxBarThickness: 24,
                categoryPercentage: 0.8,
                barPercentage: 0.9
            }]
        },
        options: {
            interaction: { mode: "index", intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: items => `${items[0].label}:00–${items[0].label}:59`,
                        label: c => ` ${szam.format(c.raw)} rendelés`
                    }
                }
            },
            scales: {
                x: xTengely({ ticks: { padding: 6, maxRotation: 0 }, title: { display: true, text: "óra", color: SZIN.halvanySzoveg } }),
                y: tengely({ beginAtZero: true, ticks: { padding: 8, callback: v => szam.format(v) } })
            }
        }
    });

    document.getElementById("kategoriaSzuro").addEventListener("change", (e) => {
        const kat = katNevek.includes(e.target.value) ? e.target.value : "";
        haviChart.data.datasets[0].data = sorozatok(adatok.havi.kategoriank, kat);
        oraChart.data.datasets[0].data = sorozatok(adatok.orak.kategoriank, kat);
        haviChart.update();
        oraChart.update();
    });
})();

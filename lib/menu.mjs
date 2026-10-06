// Menukaart Snackbar De Schalm (prijzen in centen, inclusief handgeschreven correcties).
// Dit is de enige plek waar prijzen staan: de server rekent hiermee, de website toont ze.

export const SAUZEN = [
  ["Mayo", 50], ["Curry", 50], ["Ketchup", 50], ["Mosterd", 50],
  ["Knoflooksaus", 80], ["Jamballasaus", 80], ["Chilisaus", 80], ["Joppiesaus", 80],
  ["Speciaalsaus", 80], ["Wimpiesaus", 80], ["Satésaus", 90], ["Oorlog", 110], ["Uien", 35],
].map(([naam, prijs]) => ({ naam, prijs }));

export const FRISDRANKEN = [
  "Coca-Cola", "Coca-Cola Zero", "Fanta Orange", "Fanta Cassis", "Sprite", "Lipton Ice Tea", "Sinas",
];

// [naam, prijs of [klein, groot], keuzes?]
const RUW = [
  { cat: "Patat", saus: true, items: [
    ["Patat", [250, 320]], ["Patat mayo", [300, 370]], ["Patat curry", [300, 370]], ["Patat ketchup", [300, 370]],
    ["Patat joppie", [330, 400]], ["Patat saté", [340, 410]], ["Patat speciaal", [330, 400]],
    ["Patat oorlog zonder ui", [360, 430]], ["Patat oorlog met ui", [395, 465]], ["Patat GT", [400, 470]],
    ["Patat stoofvlees", [null, 600]],
  ] },
  { cat: "Zak patat", saus: true, items: [
    ["Zak patat klein (3 pers.)", 500], ["Zak patat middel (5 pers.)", 700], ["Zak patat groot (7 pers.)", 900],
  ] },
  { cat: "Snacks", saus: true, items: [
    ["Frikandel", 240], ["Frikandel speciaal", 310], ["Kroket", 240], ["Goulashkroket", 270], ["Satékroket", 270],
    ["Kwekkeboomkroket", 270], ["Gehaktbal", 350], ["Portie kipsaté", 400], ["Viandel", 280], ["Ribster", 270],
    ["Pikanto", 300], ["Turkeystick", 330], ["XXL Frikandel", 430], ["XXL Frikandel speciaal", 500],
    ["Mexicano", 300], ["Braadworst", 280], ["Bamischijf", 260], ["Nasischijf", 260], ["Loempia", 410],
    ["Shoarmarol", 310], ["Boerenbrok", 285], ["Kipschnitzel", 350], ["Satérol", 300], ["Kipcorn", 230],
    ["Hamburger", 250], ["Berehap", 290], ["Ragouzi", 300], ["Lihanboutje", 300], ["Smulrol", 325],
    ["Eierbal", 325], ["Bocado", 325],
  ] },
  { cat: "Vegetarisch", saus: true, items: [["Kaassoufflé", 250], ["Bonita", 270], ["Mini loempia's", 425]] },
  { cat: "Minisnacks", saus: true, items: [
    ["Bittergarnituur (8 st.)", 375], ["Bitterballen (7 st.)", 370], ["Kipnuggets (7 st.)", 370],
    ["Vlammetjes (7 st.)", 425], ["Mini loempia's (7 st.)", 425],
  ] },
  { cat: "Broodjes", saus: true, items: [
    ["Br. kroket", 310], ["Br. frikandel", 310], ["Br. hamburger", 310], ["Br. hamburger speciaal", 360],
    ["Br. boerenbrok", 365], ["Br. kwekkeboomkroket", 350], ["Br. satékroket", 350], ["Br. goulashkroket", 350],
    ["Br. mexicano", 380], ["Br. bamischijf", 340], ["Br. nasischijf", 340], ["Br. braadworst", 380],
    ["Br. kaassoufflé", 330], ["Br. kipcorn", 360], ["Br. gehaktbal", 430], ["Br. kipschnitzel", 430],
    ["Bickyburger", 425], ["Los broodje", 80], ["Br. ham of kaas", 200], ["Br. gebakken ei met ham & kaas", 250],
    ["Tosti ham/kaas", 275], ["Vlamtosti", 325],
  ] },
  { cat: "Beker saus", saus: false, items: [
    ["Beker saus", [150, 225], ["Mayo", "Curry", "Ketchup", "Mosterd"]],
    ["Beker saus", [175, 275], ["Knoflooksaus", "Jamballasaus", "Chilisaus", "Joppiesaus", "Wimpiesaus"]],
    ["Beker saus", [175, 275], ["Satésaus", "Speciaalsaus", "Oorlog"]],
    ["Beker uien", [100, 150]],
  ] },
  { cat: "Frisdrank", saus: false, items: [["Blikje frisdrank", 250, FRISDRANKEN]] },
];

const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const MENU = RUW.map((c) => ({
  cat: c.cat,
  saus: c.saus,
  items: c.items.map(([naam, prijs, keuzes]) => {
    const maten = Array.isArray(prijs)
      ? [{ maat: "Klein", prijs: prijs[0] }, { maat: "Groot", prijs: prijs[1] }]
      : [{ maat: null, prijs }];
    return {
      id: slug(naam + (keuzes ? "-" + keuzes[0] : "")),
      naam,
      maten,
      keuzes: keuzes || null,
    };
  }),
}));

const INDEX = new Map();
for (const c of MENU) for (const it of c.items) {
  if (INDEX.has(it.id)) throw new Error("Dubbel menu-id: " + it.id);
  INDEX.set(it.id, { ...it, saus: c.saus });
}

// Rekent één regel uit de winkelmand na. Gooit een fout bij een ongeldige regel.
// regel = { id, maat (index), saus (naam of null), keuze (naam of null) }
export function prijsRegel(regel) {
  const it = INDEX.get(String(regel?.id || ""));
  if (!it) throw new Error("Onbekend product");
  const m = it.maten[Number(regel.maat) || 0];
  if (!m || m.prijs == null) throw new Error("Onbekende maat voor " + it.naam);
  let keuze = null;
  if (it.keuzes) {
    keuze = it.keuzes.includes(regel.keuze) ? regel.keuze : null;
    if (!keuze) throw new Error("Kies een soort voor " + it.naam);
  }
  let saus = null;
  if (regel.saus) {
    if (!it.saus) throw new Error("Bij " + it.naam + " kan geen saus");
    saus = SAUZEN.find((s) => s.naam === regel.saus);
    if (!saus) throw new Error("Onbekende saus");
  }
  const naam = it.naam + (m.maat ? " " + m.maat.toLowerCase() : "");
  const omschrijving = naam + (keuze ? " " + keuze : "") + (saus ? " met " + saus.naam.toLowerCase() : "");
  return { omschrijving, prijs: m.prijs + (saus ? saus.prijs : 0) };
}

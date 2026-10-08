// Controleert of een naam een echte voor- en achternaam lijkt, en zet hem netjes in hoofdletters.
const TUSSENVOEGSELS = new Set(["van", "de", "der", "den", "het", "ten", "ter", "te", "op", "in", "'t", "la", "le", "du", "da", "di", "von", "zu", "uit", "aan", "bij", "onder", "over", "voor", "vd", "v.d."]);

// Losse woorden die nooit in een echte naam horen: invulwoorden, scheldwoorden en grapnamen.
const VERBODEN_WOORDEN = new Set([
  "test", "testje", "tester", "testing", "asdf", "qwerty", "azerty", "naam", "voornaam", "achternaam", "onbekend", "anoniem",
  "anonymous", "unknown", "iemand", "niemand", "ik", "jij", "hij", "zij", "wij", "hallo", "hoi", "doei", "xxx", "abc", "aaa",
  "bla", "blabla", "nep", "fake", "dummy", "admin", "beheer", "beheerder", "collega", "medewerker", "baas", "chef",
  "snack", "snackmart", "frikandel", "kroket", "patat", "friet", "mayo", "lunch", "honger", "vrijdag",
  "kut", "lul", "pik", "poep", "pies", "plas", "scheet", "hoer", "slet", "snol", "kanker", "tering", "tyfus", "pest",
  "klootzak", "eikel", "sukkel", "debiel", "mongool", "idioot", "neuk", "neuker", "piemel", "tiet", "tieten", "reet", "kont",
  "homo", "flikker", "mietje", "pipo", "clown", "nobody", "lolbroek", "grapjas", "mr", "mevr", "dhr", "mw", "sir",
]);

// Bekende grap- en fantasienamen (voor- en achternaam samen).
const VERBODEN_NAMEN = new Set([
  "piet piraat", "donald duck", "mickey mouse", "minnie mouse", "bob de bouwer", "harry potter", "kabouter plop",
  "jan modaal", "jan met de pet", "sinter klaas", "kerst man", "dikke mart", "vette mart",
  "john doe", "jane doe", "barack obama", "donald trump", "mark rutte",
]);

const KLINKERS = "aeiouyàáâäèéêëìíîïòóôöùúûüıœæ";
const isWoord = (w) => /^[\p{L}][\p{L}'.-]*$/u.test(w);
const letters = (w) => w.toLowerCase().replace(/[^\p{L}]/gu, "");
const kaal = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Rijen van het toetsenbord en het alfabet: 5 of meer op een rij is toetsenbordgeramd.
const REEKSEN = ["qwertyuiop", "asdfghjkl", "zxcvbnm", "azertyuiop", "qsdfghjklm", "wxcvbn", "abcdefghijklmnopqrstuvwxyz"];
function isReeks(w) {
  for (const r of REEKSEN) for (const rr of [r, [...r].reverse().join("")])
    for (let i = 0; i + 5 <= w.length; i++) if (rr.includes(w.slice(i, i + 5))) return true;
  return false;
}

// Of één woord (zonder tussenvoegsels) geen echt naamdeel kan zijn.
function nepWoord(w) {
  const l = kaal(letters(w));
  if (!l) return true;
  if (VERBODEN_WOORDEN.has(l)) return true;
  const klinkers = [...l].filter((c) => KLINKERS.includes(c)).length;
  if (!klinkers) return true;                                   // geen klinker
  if (l.length >= 4 && klinkers / l.length < 0.2) return true;  // bijna alleen medeklinkers
  if (l.length >= 6 && klinkers / l.length > 0.8) return true;  // bijna alleen klinkers
  if (/[^aeiouy]{6,}/.test(l)) return true;                     // 6+ medeklinkers op een rij
  if (/[aeiou]{4,}/.test(l)) return true;                       // 4+ klinkers op een rij
  if (/(\p{L})\1\1/u.test(l)) return true;                      // drie dezelfde letters
  if (/(\p{L}{2,3})\1\1/u.test(l)) return true;                 // lalala, hahaha
  if (isReeks(l)) return true;                                  // qwert, asdfg, abcde
  if (l.length > 20) return true;
  return false;
}

function hoofdletter(w, i, alle) {
  const klein = w.toLowerCase();
  if (i > 0 && i < alle.length - 1 && TUSSENVOEGSELS.has(klein)) return klein;
  return klein.split("-").map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join("-");
}

const GEEN_ECHTE = "Dit lijkt geen echte naam. Vul je eigen voor- en achternaam in.";

// Geeft { naam } (netjes) of { fout } terug.
export function controleerNaam(invoer, namenlijst = []) {
  const ruw = String(invoer || "").normalize("NFC").trim().replace(/\s+/g, " ");
  if (ruw.length < 5 || ruw.length > 50) return { fout: "Vul je voor- en achternaam in." };
  const woorden = ruw.split(" ");
  if (woorden.length < 2) return { fout: "Vul je voor- én achternaam in." };
  if (woorden.length > 6) return { fout: GEEN_ECHTE };
  if (!woorden.every(isWoord)) return { fout: "Een naam mag alleen letters bevatten." };
  if (/[.'-]{2,}/.test(ruw)) return { fout: GEEN_ECHTE };

  const kern = woorden.filter((w, i) => !(i > 0 && i < woorden.length - 1 && TUSSENVOEGSELS.has(w.toLowerCase())));
  const voornaam = kern[0], achternaam = kern[kern.length - 1];
  if (kern.length < 2 || letters(voornaam).length < 2 || letters(achternaam).length < 2) return { fout: "Schrijf je voor- en achternaam voluit." };
  if (kern.some(nepWoord)) return { fout: GEEN_ECHTE };
  if (kaal(letters(voornaam)) === kaal(letters(achternaam))) return { fout: GEEN_ECHTE }; // Jan Jan
  if (VERBODEN_NAMEN.has(kaal(woorden.join(" ")))) return { fout: "Vul je eigen naam in, geen grapnaam." };

  const naam = woorden.map(hoofdletter).join(" ");
  if (namenlijst.length) {
    const sleutel = (s) => kaal(s).replace(/\s+/g, " ").trim();
    const gevonden = namenlijst.find((n) => sleutel(n) === sleutel(naam));
    if (!gevonden) return { fout: "Deze naam staat niet op de lijst van medewerkers. Vul je naam in zoals hij bij de vestiging bekend is." };
    return { naam: gevonden };
  }
  return { naam };
}

// Controleert of een naam een echte voor- en achternaam lijkt, en zet hem netjes in hoofdletters.
const TUSSENVOEGSELS = new Set(["van", "de", "der", "den", "het", "ten", "ter", "te", "op", "in", "'t", "la", "le", "du", "da", "di", "von", "zu", "uit", "aan", "bij", "onder", "over", "voor", "vd", "v.d."]);
const VERBODEN = new Set(["test", "testje", "tester", "asdf", "qwerty", "naam", "voornaam", "achternaam", "onbekend", "anoniem",
  "iemand", "niemand", "ik", "jij", "hallo", "xxx", "abc", "aaa", "bla", "blabla", "nep", "fake", "dummy", "admin", "beheer", "collega"]);

const isWoord = (w) => /^[\p{L}][\p{L}'.-]*$/u.test(w);
const heeftKlinker = (w) => /[aeiouyàáâäèéêëìíîïòóôöùúûü]/i.test(w);

function hoofdletter(w, i, alle) {
  const klein = w.toLowerCase();
  if (i > 0 && i < alle.length - 1 && TUSSENVOEGSELS.has(klein)) return klein;
  return klein.split("-").map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join("-");
}

// Geeft { naam } (netjes) of { fout } terug.
export function controleerNaam(invoer, namenlijst = []) {
  const ruw = String(invoer || "").normalize("NFC").trim().replace(/\s+/g, " ");
  if (ruw.length < 5 || ruw.length > 60) return { fout: "Vul je voor- en achternaam in." };
  const woorden = ruw.split(" ");
  if (woorden.length < 2) return { fout: "Vul je voor- én achternaam in." };
  if (!woorden.every(isWoord)) return { fout: "Een naam mag alleen letters bevatten." };
  const voornaam = woorden[0], achternaam = woorden[woorden.length - 1];
  if (voornaam.replace(/[^\p{L}]/gu, "").length < 2 || achternaam.replace(/[^\p{L}]/gu, "").length < 2) return { fout: "Schrijf je voor- en achternaam voluit." };
  if (!woorden.filter((w) => !TUSSENVOEGSELS.has(w.toLowerCase())).every(heeftKlinker)) return { fout: "Dit lijkt geen echte naam. Vul je voor- en achternaam in." };
  if (/(\p{L})\1\1/iu.test(ruw)) return { fout: "Dit lijkt geen echte naam. Vul je voor- en achternaam in." };
  if (woorden.some((w) => VERBODEN.has(w.toLowerCase()))) return { fout: "Vul je echte voor- en achternaam in." };
  const naam = woorden.map(hoofdletter).join(" ");
  if (namenlijst.length) {
    const sleutel = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
    const gevonden = namenlijst.find((n) => sleutel(n) === sleutel(naam));
    if (!gevonden) return { fout: "Deze naam staat niet op de lijst van medewerkers. Vul je naam in zoals hij bij de vestiging bekend is." };
    return { naam: gevonden };
  }
  return { naam };
}

// Datum en tijd altijd in Nederlandse tijd, ook als de server in UTC draait.
const DAGEN = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

export function nuAmsterdam(datum = new Date()) {
  const delen = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23",
    }).formatToParts(datum).map((p) => [p.type, p.value]),
  );
  return { j: +delen.year, m: +delen.month, d: +delen.day, u: +delen.hour, min: +delen.minute, dag: DAGEN[delen.weekday] };
}

const iso = (dt) => dt.toISOString().slice(0, 10);

// De vrijdag waar bestellingen van nu bij horen (vandaag als het vrijdag is).
export function huidigeWeek(datum = new Date()) {
  const n = nuAmsterdam(datum);
  const dt = new Date(Date.UTC(n.j, n.m - 1, n.d));
  dt.setUTCDate(dt.getUTCDate() + ((5 - n.dag + 7) % 7));
  return iso(dt);
}

export function vandaag(datum = new Date()) {
  const n = nuAmsterdam(datum);
  return iso(new Date(Date.UTC(n.j, n.m - 1, n.d)));
}

export function weekTekst(week) {
  const [j, m, d] = week.split("-").map(Number);
  return "vrijdag " + d + " " + MAANDEN[m - 1];
}

export const isWeek = (w) => typeof w === "string" && /^\d{4}-\d{2}-\d{2}$/.test(w);

// Gesloten als handmatig dicht, of als het vrijdag is en de sluittijd voorbij is.
export function isGesloten(inst, datum = new Date()) {
  if (inst.gesloten) return true;
  if (vandaag(datum) !== huidigeWeek(datum)) return false;
  const m = /^(\d{1,2})[:.](\d{2})$/.exec(String(inst.sluittijd || "").trim());
  if (!m) return false;
  const n = nuAmsterdam(datum);
  return n.u * 60 + n.min >= +m[1] * 60 + +m[2];
}

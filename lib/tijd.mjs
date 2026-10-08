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

export function weekTekst(week) {
  const [, m, d] = week.split("-").map(Number);
  return "vrijdag " + d + " " + MAANDEN[m - 1];
}

export const isWeek = (w) => typeof w === "string" && /^\d{4}-\d{2}-\d{2}$/.test(w);
export const isTijd = (t) => /^\d{1,2}[:.]\d{2}$/.test(String(t || "").trim());

function minuten(t, standaard) {
  const m = /^(\d{1,2})[:.](\d{2})$/.exec(String(t || "").trim());
  return m ? +m[1] * 60 + +m[2] : standaard;
}

// Is de sluittijd op vrijdag voorbij?
export function naSluittijd(inst, datum = new Date()) {
  const n = nuAmsterdam(datum);
  return n.dag === 5 && n.u * 60 + n.min >= minuten(inst.sluittijd, 660);
}

// ISO-weeknummer van een datum (JJJJ-MM-DD).
export function weeknummer(isoDatum) {
  const [j, m, d] = isoDatum.split("-").map(Number);
  const dt = new Date(Date.UTC(j, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 4 - (dt.getUTCDay() || 7)); // donderdag van die week
  const jaarStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  return { jaar: dt.getUTCFullYear(), week: Math.ceil(((dt - jaarStart) / 864e5 + 1) / 7) };
}

// De vrijdag van ISO-week `week` in `jaar`, of null als die week niet bestaat.
export function vrijdagVanWeek(jaar, week) {
  const jan4 = new Date(Date.UTC(jaar, 0, 4));
  const maandag = new Date(jan4);
  maandag.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (week - 1) * 7);
  maandag.setUTCDate(maandag.getUTCDate() + 4);
  const vrijdag = iso(maandag);
  const w = weeknummer(vrijdag);
  return w.jaar === jaar && w.week === week ? vrijdag : null;
}

// De door de beheerder geblokkeerde week waar we nu in zitten, of null.
export function geslotenWeek(inst, datum = new Date()) {
  const week = huidigeWeek(datum);
  return (inst.geslotenWeken || []).find((g) => g.week === week) || null;
}

// Open van maandag (opentijd) tot vrijdag (sluittijd). Daarbuiten, of als de
// beheerder deze week heeft gesloten, kan er niet besteld worden.
export function isGesloten(inst, datum = new Date()) {
  if (inst.geslotenWeek && inst.geslotenWeek === huidigeWeek(datum)) return true;
  if (geslotenWeek(inst, datum)) return true;
  const n = nuAmsterdam(datum), nu = n.u * 60 + n.min;
  if (n.dag === 6 || n.dag === 0) return true;
  if (n.dag === 1 && nu < minuten(inst.opentijd, 420)) return true;
  return naSluittijd(inst, datum);
}

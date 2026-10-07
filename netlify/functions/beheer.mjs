import { leesInstellingen, bewaarInstellingen, lijstBestellingen, mailVerstuurd } from "../../lib/opslag.mjs";
import { huidigeWeek, weekTekst, isWeek, isTijd, isGesloten } from "../../lib/tijd.mjs";
import { gelijk } from "../../lib/beveiliging.mjs";
import { verstuurMail, mailIngesteld } from "../../lib/mail.mjs";

const fout = (status, melding) => Response.json({ fout: melding }, { status });

export default async (req) => {
  const ww = process.env.BEHEER_WACHTWOORD;
  if (!ww) return fout(500, "BEHEER_WACHTWOORD is niet ingesteld.");
  if (!gelijk(req.headers.get("x-wachtwoord"), ww)) return fout(401, "Wachtwoord klopt niet.");

  if (req.method === "POST") {
    const i = await req.json().catch(() => ({}));

    if (i.actie === "testmail") {
      try {
        const m = await verstuurMail(isWeek(i.week) ? i.week : huidigeWeek());
        return Response.json({ melding: `Mail verstuurd naar ${process.env.MAIL_AAN} (${m.aantal} bestellingen).` });
      } catch (e) {
        console.error(e);
        return fout(500, "Mail versturen lukte niet: " + e.message);
      }
    }

    const nieuw = { ...(await leesInstellingen()) };
    delete nieuw.gesloten; // oude instelling
    if (typeof i.gesloten === "boolean") nieuw.geslotenWeek = i.gesloten ? huidigeWeek() : null;
    for (const veld of ["sluittijd", "opentijd"]) {
      if (typeof i[veld] !== "string") continue;
      if (!isTijd(i[veld])) return fout(400, "Gebruik een tijd als 11:00.");
      const [u, m] = i[veld].trim().split(/[:.]/);
      nieuw[veld] = u.padStart(2, "0") + ":" + m;
    }
    await bewaarInstellingen(nieuw);
    return Response.json({ instellingen: nieuw, gesloten: isGesloten(nieuw) });
  }

  const p = new URL(req.url).searchParams.get("week");
  const week = isWeek(p) ? p : huidigeWeek();
  const [inst, bestellingen, verstuurd] = await Promise.all([leesInstellingen(), lijstBestellingen(week), mailVerstuurd(week)]);
  bestellingen.sort((a, b) => a.naam.localeCompare(b.naam, "nl"));
  return Response.json({
    week, weekTekst: weekTekst(week), huidigeWeek: huidigeWeek(),
    instellingen: inst, gesloten: isGesloten(inst),
    handmatigGesloten: inst.geslotenWeek === huidigeWeek(),
    mail: { ingesteld: mailIngesteld(), aan: process.env.MAIL_AAN || null, verstuurd },
    bestellingen: bestellingen.map(({ checkoutUrl, ...b }) => b),
  }, { headers: { "Cache-Control": "no-store" } });
};

export const config = { path: "/api/beheer" };

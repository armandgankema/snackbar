import { leesInstellingen, bewaarInstellingen, lijstBestellingen, leesBestelling, bewaarBestelling, verwijderBestelling, mailVerstuurd } from "../../lib/opslag.mjs";
import { huidigeWeek, weekTekst, isWeek, isTijd, isGesloten } from "../../lib/tijd.mjs";
import { gelijk } from "../../lib/beveiliging.mjs";
import { verstuurMail, mailIngesteld } from "../../lib/mail.mjs";
import { maakPdf } from "../../lib/pdf.mjs";

const fout = (status, melding) => Response.json({ fout: melding }, { status });

export default async (req) => {
  const ww = process.env.BEHEER_WACHTWOORD;
  if (!ww) return fout(500, "BEHEER_WACHTWOORD is niet ingesteld.");
  if (!gelijk(req.headers.get("x-wachtwoord"), ww)) return fout(401, "Wachtwoord klopt niet.");

  const url = new URL(req.url);
  const pw = url.searchParams.get("week");
  const weekParam = isWeek(pw) ? pw : huidigeWeek();

  if (req.method === "POST") {
    const i = await req.json().catch(() => ({}));
    const week = isWeek(i.week) ? i.week : huidigeWeek();

    if (i.actie === "testmail") {
      try {
        const m = await verstuurMail(week);
        return Response.json({ melding: `Mail verstuurd naar ${process.env.MAIL_AAN} (${m.aantal} bestellingen).` });
      } catch (e) {
        console.error(e);
        return fout(500, "Mail versturen lukte niet: " + e.message);
      }
    }
    if (i.actie === "verwijder") {
      await verwijderBestelling(i.id);
      return Response.json({ melding: "Bestelling verwijderd." });
    }
    if (i.actie === "ontvangen") {
      const b = await leesBestelling(i.id);
      if (!b) return fout(404, "Bestelling niet gevonden.");
      b.ontvangen = !!i.ontvangen;
      await bewaarBestelling(b);
      return Response.json({ melding: "Opgeslagen." });
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
    if (Array.isArray(i.namen)) {
      nieuw.namen = [...new Set(i.namen.map((n) => String(n).trim().replace(/\s+/g, " ")).filter(Boolean))].slice(0, 500);
    }
    await bewaarInstellingen(nieuw);
    return Response.json({ instellingen: nieuw, gesloten: isGesloten(nieuw) });
  }

  if (url.searchParams.get("pdf")) {
    const pdf = await maakPdf(weekParam, await lijstBestellingen(weekParam));
    return new Response(pdf, { headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Snackbar ${weekParam}.pdf"`,
      "Cache-Control": "no-store",
    } });
  }

  const [inst, bestellingen, verstuurd] = await Promise.all([leesInstellingen(), lijstBestellingen(weekParam), mailVerstuurd(weekParam)]);
  return Response.json({
    week: weekParam, weekTekst: weekTekst(weekParam), huidigeWeek: huidigeWeek(),
    instellingen: inst, gesloten: isGesloten(inst),
    handmatigGesloten: inst.geslotenWeek === huidigeWeek(),
    mail: { ingesteld: mailIngesteld(), aan: process.env.MAIL_AAN || null, verstuurd },
    bestellingen,
  }, { headers: { "Cache-Control": "no-store" } });
};

export const config = { path: "/api/beheer" };

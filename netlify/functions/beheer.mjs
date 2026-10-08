import { leesInstellingen, bewaarInstellingen, lijstBestellingen, leesBestelling, bewaarBestelling, verwijderBestelling } from "../../lib/opslag.mjs";
import { huidigeWeek, weekTekst, isWeek, isTijd, isGesloten, geslotenWeek, vrijdagVanWeek, weeknummer } from "../../lib/tijd.mjs";
import { gelijk } from "../../lib/beveiliging.mjs";
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
    if (Array.isArray(i.geslotenWeken)) {
      const lijst = [];
      for (const g of i.geslotenWeken) {
        const vrijdag = vrijdagVanWeek(Number(g.jaar), Number(g.week));
        if (!vrijdag) return fout(400, `Week ${g.week} van ${g.jaar} bestaat niet.`);
        if (vrijdag < huidigeWeek()) continue; // voorbije weken opruimen
        lijst.push({ week: vrijdag, reden: String(g.reden || "").trim().slice(0, 80) });
      }
      nieuw.geslotenWeken = [...new Map(lijst.map((g) => [g.week, g])).values()].sort((a, b) => a.week.localeCompare(b.week));
    }
    for (const veld of ["ophaaltijd"]) {
      if (typeof i[veld] !== "string") continue;
      if (!isTijd(i[veld])) return fout(400, "Gebruik een tijd als 12:00.");
      const [u, m] = i[veld].trim().split(/[:.]/);
      nieuw[veld] = u.padStart(2, "0") + ":" + m;
    }
    if (typeof i.ophaalplek === "string") nieuw.ophaalplek = i.ophaalplek.trim().slice(0, 60) || "de kantine";
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

  const [inst, bestellingen] = await Promise.all([leesInstellingen(), lijstBestellingen(weekParam)]);
  return Response.json({
    week: weekParam, weekTekst: weekTekst(weekParam), huidigeWeek: huidigeWeek(),
    instellingen: { ...inst, geslotenWeken: (inst.geslotenWeken || []).filter((g) => g.week >= huidigeWeek())
      .map((g) => ({ ...g, ...weeknummer(g.week), weekTekst: weekTekst(g.week) })) },
    gesloten: isGesloten(inst), geblokkeerd: !!geslotenWeek(inst),
    handmatigGesloten: inst.geslotenWeek === huidigeWeek(),
    bestellingen,
  }, { headers: { "Cache-Control": "no-store" } });
};

export const config = { path: "/api/beheer" };

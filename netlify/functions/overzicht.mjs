import { lijstBestellingen } from "../../lib/opslag.mjs";
import { huidigeWeek, weekTekst } from "../../lib/tijd.mjs";
import { gelijk } from "../../lib/beveiliging.mjs";

// Wie heeft er deze week besteld, en wat. Geen bedragen of betaalwijze.
export default async (req) => {
  if (process.env.TOEGANGSCODE && !gelijk(req.headers.get("x-code"), process.env.TOEGANGSCODE)) {
    return Response.json({ fout: "Vul de toegangscode in.", codeNodig: true }, { status: 403 });
  }
  const week = huidigeWeek();
  const lijst = await lijstBestellingen(week);
  return Response.json({
    week, weekTekst: weekTekst(week),
    bestellingen: lijst.map((b) => ({ naam: b.naam, regels: b.regels.map((r) => r.omschrijving), tijd: b.aangemaakt })),
  }, { headers: { "Cache-Control": "no-store" } });
};

export const config = { path: "/api/overzicht" };

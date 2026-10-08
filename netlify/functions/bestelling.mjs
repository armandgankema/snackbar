import { leesBestelling } from "../../lib/opslag.mjs";

// Eén bestelling, voor de bedankpagina. Het id is lang en willekeurig, dus alleen de besteller kent het.
export default async (req) => {
  const b = await leesBestelling(new URL(req.url).searchParams.get("id"));
  if (!b || b.status !== "besteld") return Response.json({ fout: "Bestelling niet gevonden" }, { status: 404 });
  return Response.json({
    naam: b.naam, week: b.week, regels: b.regels, totaal: b.totaal, betaalwijze: b.betaalwijze,
  }, { headers: { "Cache-Control": "no-store" } });
};

export const config = { path: "/api/bestelling" };

import { leesBestelling } from "../../lib/opslag.mjs";
import { werkStatusBij } from "../../lib/mollie.mjs";

export default async (req) => {
  let b = await leesBestelling(new URL(req.url).searchParams.get("id"));
  if (!b) return Response.json({ fout: "Bestelling niet gevonden" }, { status: 404 });
  try { b = await werkStatusBij(b); } catch (e) { console.error(e); }
  return Response.json({
    naam: b.naam, week: b.week, regels: b.regels, totaal: b.totaal, status: b.status,
    checkoutUrl: b.status === "open" ? b.checkoutUrl : null,
  }, { headers: { "Cache-Control": "no-store" } });
};

export const config = { path: "/api/bestelling" };

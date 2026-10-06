import { leesInstellingen, bewaarInstellingen, lijstBestellingen } from "../../lib/opslag.mjs";
import { huidigeWeek, weekTekst, isWeek, isGesloten } from "../../lib/tijd.mjs";
import { gelijk } from "../../lib/beveiliging.mjs";

export default async (req) => {
  const ww = process.env.BEHEER_WACHTWOORD;
  if (!ww) return Response.json({ fout: "BEHEER_WACHTWOORD is niet ingesteld." }, { status: 500 });
  if (!gelijk(req.headers.get("x-wachtwoord"), ww)) return Response.json({ fout: "Wachtwoord klopt niet." }, { status: 401 });

  if (req.method === "POST") {
    const i = await req.json().catch(() => ({}));
    const huidig = await leesInstellingen();
    const nieuw = { ...huidig };
    if (typeof i.gesloten === "boolean") nieuw.gesloten = i.gesloten;
    if (typeof i.sluittijd === "string") {
      if (!/^\d{1,2}[:.]\d{2}$/.test(i.sluittijd.trim())) return Response.json({ fout: "Gebruik een tijd als 11:00." }, { status: 400 });
      nieuw.sluittijd = i.sluittijd.trim().replace(".", ":");
    }
    await bewaarInstellingen(nieuw);
    return Response.json({ instellingen: nieuw, gesloten: isGesloten(nieuw) });
  }

  const p = new URL(req.url).searchParams.get("week");
  const week = isWeek(p) ? p : huidigeWeek();
  const [inst, bestellingen] = await Promise.all([leesInstellingen(), lijstBestellingen(week)]);
  bestellingen.sort((a, b) => a.naam.localeCompare(b.naam, "nl"));
  return Response.json({
    week, weekTekst: weekTekst(week), huidigeWeek: huidigeWeek(),
    instellingen: inst, gesloten: isGesloten(inst),
    bestellingen: bestellingen.map(({ checkoutUrl, ...b }) => b),
  }, { headers: { "Cache-Control": "no-store" } });
};

export const config = { path: "/api/beheer" };

import { randomUUID } from "node:crypto";
import { prijsRegel } from "../../lib/menu.mjs";
import { leesInstellingen, bewaarBestelling, BETAALWIJZEN } from "../../lib/opslag.mjs";
import { huidigeWeek, isGesloten } from "../../lib/tijd.mjs";
import { controleerNaam } from "../../lib/naam.mjs";
import { gelijk } from "../../lib/beveiliging.mjs";

const fout = (status, melding) => Response.json({ fout: melding }, { status });

export default async (req) => {
  if (req.method !== "POST") return fout(405, "Alleen POST");
  let invoer;
  try { invoer = await req.json(); } catch { return fout(400, "Ongeldige invoer"); }

  if (process.env.TOEGANGSCODE && !gelijk(invoer.code, process.env.TOEGANGSCODE)) return fout(403, "De toegangscode klopt niet.");

  const inst = await leesInstellingen();
  if (isGesloten(inst)) return fout(409, "Bestellen is gesloten. Je kunt weer bestellen vanaf maandag " + inst.opentijd + ".");

  const n = controleerNaam(invoer.naam, inst.namen);
  if (n.fout) return fout(400, n.fout);
  if (!BETAALWIJZEN[invoer.betaalwijze]) return fout(400, "Kies hoe je wilt betalen.");
  if (!Array.isArray(invoer.regels) || !invoer.regels.length) return fout(400, "Je bestelling is leeg.");
  if (invoer.regels.length > 40) return fout(400, "Te veel regels in één bestelling.");

  let regels;
  try { regels = invoer.regels.map(prijsRegel); } catch (e) { return fout(400, e.message); }

  const week = huidigeWeek();
  const bestelling = {
    id: `${week}.${randomUUID()}`,
    week,
    naam: n.naam,
    regels,
    totaal: regels.reduce((t, r) => t + r.prijs, 0),
    betaalwijze: invoer.betaalwijze,
    ontvangen: false,
    status: "besteld",
    aangemaakt: new Date().toISOString(),
  };
  await bewaarBestelling(bestelling);
  return Response.json({ id: bestelling.id, naam: bestelling.naam });
};

export const config = { path: "/api/bestel" };

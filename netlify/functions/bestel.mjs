import { randomUUID } from "node:crypto";
import { prijsRegel } from "../../lib/menu.mjs";
import { leesInstellingen, bewaarBestelling } from "../../lib/opslag.mjs";
import { huidigeWeek, isGesloten } from "../../lib/tijd.mjs";
import { maakBetaling } from "../../lib/mollie.mjs";
import { gelijk } from "../../lib/beveiliging.mjs";

const fout = (status, melding) => Response.json({ fout: melding }, { status });

export default async (req) => {
  if (req.method !== "POST") return fout(405, "Alleen POST");
  let invoer;
  try { invoer = await req.json(); } catch { return fout(400, "Ongeldige invoer"); }

  if (process.env.TOEGANGSCODE && !gelijk(invoer.code, process.env.TOEGANGSCODE)) return fout(403, "De toegangscode klopt niet.");

  const naam = String(invoer.naam || "").trim().replace(/\s+/g, " ");
  if (naam.length < 2 || naam.length > 60) return fout(400, "Vul je naam in.");
  if (!Array.isArray(invoer.regels) || !invoer.regels.length) return fout(400, "Je bestelling is leeg.");
  if (invoer.regels.length > 40) return fout(400, "Te veel regels in één bestelling.");

  const inst = await leesInstellingen();
  if (isGesloten(inst)) return fout(409, "Bestellen is gesloten voor deze vrijdag.");

  let regels;
  try { regels = invoer.regels.map(prijsRegel); } catch (e) { return fout(400, e.message); }
  const totaal = regels.reduce((t, r) => t + r.prijs, 0);

  const week = huidigeWeek();
  const bestelling = {
    id: `${week}.${randomUUID()}`,
    week, naam, regels, totaal,
    status: "open",
    aangemaakt: new Date().toISOString(),
  };
  await bewaarBestelling(bestelling);

  const basis = process.env.URL || new URL(req.url).origin;
  try {
    const [, m, d] = week.split("-");
    const p = await maakBetaling({
      bedrag: totaal,
      omschrijving: `Snackbar ${+d}-${+m} ${naam}`,
      redirectUrl: `${basis}/bedankt.html?id=${encodeURIComponent(bestelling.id)}`,
      webhookUrl: `${basis}/api/webhook`,
      bestellingId: bestelling.id,
    });
    bestelling.mollieId = p.id;
    bestelling.status = p.status;
    bestelling.checkoutUrl = p._links?.checkout?.href || null;
    await bewaarBestelling(bestelling);
    return Response.json({ id: bestelling.id, checkoutUrl: bestelling.checkoutUrl });
  } catch (e) {
    console.error(e);
    bestelling.status = "failed";
    await bewaarBestelling(bestelling);
    return fout(502, "De betaling kon niet worden gestart. Probeer het later opnieuw.");
  }
};

export const config = { path: "/api/bestel" };

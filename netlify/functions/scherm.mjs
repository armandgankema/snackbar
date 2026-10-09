import { leesInstellingen, lijstBestellingen } from "../../lib/opslag.mjs";
import { huidigeWeek, weekTekst, isGesloten, geslotenWeek, nuAmsterdam } from "../../lib/tijd.mjs";

const minuten = (t) => { const [u, m] = String(t).split(":").map(Number); return u * 60 + m; };

// Gegevens voor het narrowcasting-scherm: status, aftellen en het aantal bestellingen. Geen namen.
export default async () => {
  const inst = await leesInstellingen();
  const week = huidigeWeek();
  const n = nuAmsterdam(), nu = n.u * 60 + n.min;
  const gesloten = isGesloten(inst);
  const blok = geslotenWeek(inst);
  // Minuten tot de sluiting (vrijdag) of tot de opening (maandag), in Nederlandse tijd.
  const totSluiting = ((5 - n.dag + 7) % 7) * 1440 + minuten(inst.sluittijd) - nu;
  const totOpening = ((1 - n.dag + 7) % 7 || (nu < minuten(inst.opentijd) ? 0 : 7)) * 1440 + minuten(inst.opentijd) - nu;
  return Response.json({
    week, weekTekst: weekTekst(week),
    gesloten, geslotenReden: blok ? (blok.reden || "Deze week geen bestelronde.") : null,
    vrijdagNaSluiting: gesloten && !blok && n.dag === 5,
    sluittijd: inst.sluittijd, opentijd: inst.opentijd, ophaaltijd: inst.ophaaltijd, ophaalplek: inst.ophaalplek,
    minutenTotSluiting: gesloten ? null : totSluiting,
    minutenTotOpening: gesloten && !blok ? totOpening : null,
    aantal: (await lijstBestellingen(week)).length,
  }, { headers: { "Cache-Control": "no-store" } });
};

export const config = { path: "/api/scherm" };

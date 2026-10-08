import { MENU, SAUZEN } from "../../lib/menu.mjs";
import { leesInstellingen } from "../../lib/opslag.mjs";
import { huidigeWeek, weekTekst, isGesloten, geslotenWeek } from "../../lib/tijd.mjs";

export default async () => {
  const inst = await leesInstellingen();
  const week = huidigeWeek();
  return Response.json({
    menu: MENU,
    sauzen: SAUZEN,
    week,
    weekTekst: weekTekst(week),
    sluittijd: inst.sluittijd,
    opentijd: inst.opentijd,
    gesloten: isGesloten(inst),
    geslotenReden: geslotenWeek(inst) ? (geslotenWeek(inst).reden || "Deze week geen bestelronde.") : null,
    ophaaltijd: inst.ophaaltijd,
    ophaalplek: inst.ophaalplek,
    codeNodig: !!process.env.TOEGANGSCODE,
  }, { headers: { "Cache-Control": "no-store" } });
};

export const config = { path: "/api/menu" };

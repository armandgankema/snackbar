import { BETAALWIJZEN } from "./opslag.mjs";

export const eur = (c) => "€ " + (c / 100).toFixed(2).replace(".", ",");

// Telt gelijke producten op voor de bestellijst van de snackbar.
export function samenvatting(bestellingen) {
  const telling = {};
  for (const b of bestellingen) for (const r of b.regels) telling[r.omschrijving] = (telling[r.omschrijving] || 0) + 1;
  const regels = Object.keys(telling).sort((a, b) => a.localeCompare(b, "nl")).map((o) => ({ aantal: telling[o], omschrijving: o }));
  const totaal = bestellingen.reduce((t, b) => t + b.totaal, 0);
  const perWijze = {};
  for (const k of Object.keys(BETAALWIJZEN)) perWijze[k] = bestellingen.filter((b) => b.betaalwijze === k).reduce((t, b) => t + b.totaal, 0);
  return { regels, totaal, perWijze, stuks: regels.reduce((t, r) => t + r.aantal, 0) };
}

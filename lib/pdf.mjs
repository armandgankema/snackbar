import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { samenvatting, eur } from "./samenvatting.mjs";
import { weekTekst } from "./tijd.mjs";

// Tekens die het standaardlettertype niet kent, zonder accent of als ? tonen.
function veilig(font, tekst) {
  return [...String(tekst)].map((c) => {
    try { font.encodeText(c); return c; } catch {
      const kaal = c.normalize("NFD").replace(/[̀-ͯ]/g, "");
      try { font.encodeText(kaal); return kaal; } catch { return "?"; }
    }
  }).join("");
}

// Bestellijst voor de snackbar als A4-pdf.
export async function maakPdf(week, bestellingen) {
  const doc = await PDFDocument.create();
  const f = await doc.embedFont(StandardFonts.Helvetica);
  const fb = await doc.embedFont(StandardFonts.HelveticaBold);
  const s = samenvatting(bestellingen);
  const jaar = week.slice(0, 4);
  doc.setTitle(`Bestelling Snackbar De Schalm ${weekTekst(week)} ${jaar}`);

  const B = 595.28, H = 841.89, M = 50, grijs = rgb(0.4, 0.4, 0.4), lijn = rgb(0.8, 0.8, 0.8);
  let page, y;
  const nieuw = () => { page = doc.addPage([B, H]); y = H - M; };
  const ruimte = (h) => { if (y - h < M + 20) nieuw(); };
  const tekst = (t, x, size = 11, font = f, kleur = rgb(0, 0, 0)) => page.drawText(veilig(font, t), { x, y, size, font, color: kleur });
  const rechts = (t, xr, size = 11, font = f) => { const v = veilig(font, t); page.drawText(v, { x: xr - font.widthOfTextAtSize(v, size), y, size, font }); };
  const streep = () => page.drawLine({ start: { x: M, y: y + 4 }, end: { x: B - M, y: y + 4 }, thickness: 0.5, color: lijn });
  // Lange tekst over meerdere regels verdelen.
  const afbreken = (t, breedte, size) => {
    const woorden = veilig(f, t).split(" "), regels = []; let r = "";
    for (const w of woorden) { const p = r ? r + " " + w : w; if (f.widthOfTextAtSize(p, size) > breedte && r) { regels.push(r); r = w; } else r = p; }
    if (r) regels.push(r); return regels;
  };

  nieuw();
  tekst("Bestelling Snackbar De Schalm", M, 20, fb); y -= 24;
  tekst(`${weekTekst(week)} ${jaar}`.replace(/^v/, "V"), M, 12, f, grijs); y -= 16;
  tekst(`${bestellingen.length} bestellingen, ${s.stuks} producten`, M, 12, f, grijs); y -= 30;

  tekst("Aantal", M, 10, fb, grijs); tekst("Product", M + 60, 10, fb, grijs); y -= 8; streep(); y -= 14;
  for (const r of s.regels) {
    const regels = afbreken(r.omschrijving, B - 2 * M - 60, 12);
    ruimte(regels.length * 16 + 4);
    tekst(`${r.aantal}x`, M, 12, fb);
    for (const [i, l] of regels.entries()) { tekst(l, M + 60, 12); if (i < regels.length - 1) y -= 15; }
    y -= 8; streep(); y -= 12;
  }
  ruimte(30); y -= 4;
  tekst("Totaal", M, 12, fb); rechts(eur(s.totaal), B - M, 12, fb); y -= 36;

  ruimte(40);
  tekst("Per persoon", M, 14, fb); y -= 20;
  for (const b of bestellingen) {
    const regels = afbreken(b.regels.map((r) => r.omschrijving).join(", "), B - 2 * M - 170, 10);
    ruimte(regels.length * 13 + 10);
    tekst(b.naam, M, 10, fb);
    rechts(eur(b.totaal), B - M, 10);
    for (const [i, l] of regels.entries()) { page.drawText(l, { x: M + 150, y, size: 10, font: f }); if (i < regels.length - 1) y -= 13; }
    y -= 6; streep(); y -= 12;
  }
  if (!bestellingen.length) { tekst("Geen bestellingen.", M, 11, f, grijs); }

  const paginas = doc.getPages();
  paginas.forEach((p, i) => p.drawText(`Pagina ${i + 1} van ${paginas.length}`, { x: B - M - 70, y: 25, size: 8, font: f, color: grijs }));
  return doc.save();
}

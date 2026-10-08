import nodemailer from "nodemailer";
import { lijstBestellingen, BETAALWIJZEN } from "./opslag.mjs";
import { weekTekst } from "./tijd.mjs";
import { samenvatting, eur } from "./samenvatting.mjs";
import { maakPdf } from "./pdf.mjs";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const td = 'style="padding:3px 14px 3px 0;vertical-align:top"';

export function mailIngesteld() {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS && process.env.MAIL_AAN);
}

// Mail met alle bestellingen van de week, de bestellijst als pdf erbij.
export async function maakMail(week) {
  const lijst = await lijstBestellingen(week);
  const s = samenvatting(lijst);
  const wt = weekTekst(week);
  const wijze = (b) => BETAALWIJZEN[b.betaalwijze] || "-";

  const tekst = lijst.length
    ? [`Bestelling ${wt}`, "", ...s.regels.map((r) => `${r.aantal}x ${r.omschrijving}`), "",
       `Totaal: ${eur(s.totaal)} (${lijst.length} bestellingen)`,
       `Contant: ${eur(s.perWijze.contant)}, betaalverzoek: ${eur(s.perWijze.betaalverzoek)}`, "",
       "Te ontvangen per persoon:", ...lijst.map((b) => `- ${b.naam}: ${eur(b.totaal)} (${wijze(b)})`), "",
       "De bestellijst voor de snackbar zit als pdf in de bijlage.", "Snackbar De Schalm: 0524-512556"].join("\n")
    : `Er zijn geen bestellingen voor ${wt}.`;

  const html = lijst.length
    ? `<div style="font-family:Arial,sans-serif;font-size:14px">
<h2>Bestelling ${esc(wt)}</h2>
<table style="border-collapse:collapse">${s.regels.map((r) => `<tr><td ${td}><b>${r.aantal}x</b></td><td ${td}>${esc(r.omschrijving)}</td></tr>`).join("")}</table>
<p><b>Totaal: ${eur(s.totaal)}</b> (${lijst.length} bestellingen)<br>Contant: ${eur(s.perWijze.contant)} · Betaalverzoek: ${eur(s.perWijze.betaalverzoek)}</p>
<h3>Te ontvangen per persoon</h3>
<table style="border-collapse:collapse">${lijst.map((b) => `<tr><td ${td}>${esc(b.naam)}</td><td ${td} align="right">${eur(b.totaal)}</td><td ${td}>${esc(wijze(b))}</td></tr>`).join("")}</table>
<p>De bestellijst voor de snackbar zit als pdf in de bijlage.<br>Snackbar De Schalm: 0524-512556</p></div>`
    : `<p style="font-family:Arial,sans-serif">${esc(tekst)}</p>`;

  return {
    onderwerp: `Snackbarbestelling ${wt} (${lijst.length} bestellingen, ${eur(s.totaal)})`,
    tekst, html, aantal: lijst.length,
    pdf: lijst.length ? Buffer.from(await maakPdf(week, lijst)) : null,
  };
}

export async function verstuurMail(week) {
  if (!mailIngesteld()) throw new Error("Mail is niet ingesteld (SMTP_USER, SMTP_PASS en MAIL_AAN).");
  const m = await maakMail(week);
  const poort = Number(process.env.SMTP_PORT || 465);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: poort,
    secure: poort === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transport.sendMail({
    from: `"Snackbar vrijdagbestelling" <${process.env.SMTP_USER}>`,
    to: process.env.MAIL_AAN,
    subject: m.onderwerp,
    text: m.tekst,
    html: m.html,
    attachments: m.pdf ? [{ filename: `Bestelling snackbar ${week}.pdf`, content: m.pdf, contentType: "application/pdf" }] : [],
  });
  return m;
}

import nodemailer from "nodemailer";
import { lijstBestellingen } from "./opslag.mjs";
import { weekTekst } from "./tijd.mjs";

const eur = (c) => "€ " + (c / 100).toFixed(2).replace(".", ",");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export function mailIngesteld() {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS && process.env.MAIL_AAN);
}

// Stelt de mail op met alle betaalde bestellingen van een week.
export async function maakMail(week) {
  const betaald = (await lijstBestellingen(week)).filter((b) => b.status === "paid")
    .sort((a, b) => a.naam.localeCompare(b.naam, "nl"));
  const totaal = betaald.reduce((t, b) => t + b.totaal, 0);
  const telling = {};
  for (const b of betaald) for (const r of b.regels) telling[r.omschrijving] = (telling[r.omschrijving] || 0) + 1;
  const regels = Object.keys(telling).sort((a, b) => a.localeCompare(b, "nl")).map((k) => `${telling[k]}x ${k}`);
  const wt = weekTekst(week);

  const tekst = betaald.length
    ? [`Bestelling ${wt}`, "", ...regels, "", `Totaal: ${eur(totaal)} (${betaald.length} bestellingen)`, "",
       "Per persoon:", ...betaald.map((b) => `- ${b.naam}: ${b.regels.map((r) => r.omschrijving).join(", ")} (${eur(b.totaal)})`),
       "", "Snackbar De Schalm: 0524-512556"].join("\n")
    : `Er zijn geen betaalde bestellingen voor ${wt}.`;

  const html = betaald.length
    ? `<h2 style="font-family:Arial,sans-serif">Bestelling ${esc(wt)}</h2>
<table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">${regels.map((r) => `<tr><td style="padding:2px 0">${esc(r)}</td></tr>`).join("")}</table>
<p style="font-family:Arial,sans-serif;font-size:14px"><b>Totaal: ${eur(totaal)}</b> (${betaald.length} bestellingen)</p>
<h3 style="font-family:Arial,sans-serif">Per persoon</h3>
<table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">
${betaald.map((b) => `<tr><td style="padding:3px 12px 3px 0;vertical-align:top"><b>${esc(b.naam)}</b></td><td style="padding:3px 12px 3px 0">${esc(b.regels.map((r) => r.omschrijving).join(", "))}</td><td style="padding:3px 0;text-align:right;white-space:nowrap">${eur(b.totaal)}</td></tr>`).join("\n")}
</table>
<p style="font-family:Arial,sans-serif;font-size:14px">Snackbar De Schalm: 0524-512556</p>`
    : `<p style="font-family:Arial,sans-serif">${esc(tekst)}</p>`;

  return { onderwerp: `Snackbarbestelling ${wt} (${betaald.length} bestellingen, ${eur(totaal)})`, tekst, html, aantal: betaald.length };
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
  });
  return m;
}

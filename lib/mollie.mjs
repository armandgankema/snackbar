import { bewaarBestelling } from "./opslag.mjs";

const API = "https://api.mollie.com/v2";
const EINDSTATUS = new Set(["paid", "failed", "canceled", "expired"]);

function sleutel() {
  const k = process.env.MOLLIE_API_KEY;
  if (!k) throw new Error("MOLLIE_API_KEY is niet ingesteld");
  return k;
}

async function mollie(pad, opties = {}) {
  const res = await fetch(API + pad, {
    ...opties,
    headers: { Authorization: "Bearer " + sleutel(), "Content-Type": "application/json", ...(opties.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Mollie ${res.status}: ${data.detail || data.title || "onbekende fout"}`);
  return data;
}

export async function maakBetaling({ bedrag, omschrijving, redirectUrl, webhookUrl, bestellingId }) {
  const body = {
    amount: { currency: "EUR", value: (bedrag / 100).toFixed(2) },
    description: omschrijving.slice(0, 255),
    redirectUrl,
    metadata: { bestelling: bestellingId },
    locale: "nl_NL",
  };
  // Mollie kan een lokale computer niet bereiken; alleen een webhook meegeven op de echte website.
  if (webhookUrl && !/localhost|127\.0\.0\.1/.test(webhookUrl)) body.webhookUrl = webhookUrl;
  return mollie("/payments", { method: "POST", body: JSON.stringify(body) });
}

export const haalBetaling = (id) => mollie("/payments/" + encodeURIComponent(id));

// Haalt de actuele status bij Mollie op en werkt de bestelling bij.
export async function werkStatusBij(bestelling) {
  if (!bestelling.mollieId || EINDSTATUS.has(bestelling.status)) return bestelling;
  const p = await haalBetaling(bestelling.mollieId);
  if (p.metadata?.bestelling !== bestelling.id) throw new Error("Betaling hoort niet bij deze bestelling");
  if (p.status !== bestelling.status) {
    bestelling.status = p.status;
    if (p.paidAt) bestelling.betaaldOp = p.paidAt;
    await bewaarBestelling(bestelling);
  }
  return bestelling;
}

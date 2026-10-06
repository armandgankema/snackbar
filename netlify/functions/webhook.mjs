import { haalBetaling, werkStatusBij } from "../../lib/mollie.mjs";
import { leesBestelling } from "../../lib/opslag.mjs";

// Mollie meldt hier dat een betaling is gewijzigd. We vertrouwen alleen wat Mollie zelf teruggeeft.
export default async (req) => {
  if (req.method !== "POST") return new Response("", { status: 405 });
  const id = new URLSearchParams(await req.text()).get("id");
  if (!id) return new Response("", { status: 200 });
  try {
    const p = await haalBetaling(id);
    const b = await leesBestelling(p.metadata?.bestelling);
    if (b && b.mollieId === id) await werkStatusBij(b);
    return new Response("", { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response("", { status: 500 }); // Mollie probeert het later opnieuw
  }
};

export const config = { path: "/api/webhook" };

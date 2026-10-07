import { getStore } from "@netlify/blobs";

const store = () => getStore({ name: "snackbar", consistency: "strong" });

const STANDAARD = { sluittijd: "11:00", opentijd: "07:00", geslotenWeek: null };

export async function leesInstellingen() {
  const i = await store().get("instellingen", { type: "json" });
  return { ...STANDAARD, ...(i || {}) };
}

export async function bewaarInstellingen(i) {
  await store().setJSON("instellingen", { ...STANDAARD, ...i });
}

// Een bestelling heeft een publiek id "<week>.<uuid>", opgeslagen onder "bestelling/<week>/<uuid>".
const sleutel = (id) => {
  const m = /^(\d{4}-\d{2}-\d{2})\.([0-9a-f-]{36})$/.exec(String(id || ""));
  return m ? `bestelling/${m[1]}/${m[2]}` : null;
};

export async function leesBestelling(id) {
  const k = sleutel(id);
  return k ? store().get(k, { type: "json" }) : null;
}

export async function bewaarBestelling(b) {
  const k = sleutel(b.id);
  if (!k) throw new Error("Ongeldig bestelling-id");
  await store().setJSON(k, b);
}

export async function lijstBestellingen(week) {
  const s = store();
  const { blobs } = await s.list({ prefix: `bestelling/${week}/` });
  const lijst = await Promise.all(blobs.map((b) => s.get(b.key, { type: "json" })));
  return lijst.filter(Boolean);
}

// Onthoudt per week of de mail met bestellingen al is verstuurd.
export const mailVerstuurd = async (week) => !!(await store().get(`mail/${week}`));
export const markeerMail = (week) => store().setJSON(`mail/${week}`, { verstuurd: new Date().toISOString() });

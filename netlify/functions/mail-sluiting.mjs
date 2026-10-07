import { leesInstellingen, mailVerstuurd, markeerMail } from "../../lib/opslag.mjs";
import { huidigeWeek, naSluittijd } from "../../lib/tijd.mjs";
import { verstuurMail, mailIngesteld } from "../../lib/mail.mjs";

// Draait elke 5 minuten op vrijdag (UTC). Zodra de sluittijd (Nederlandse tijd) voorbij is,
// gaat één keer per week de mail met betaalde bestellingen de deur uit.
export default async () => {
  if (!mailIngesteld()) return;
  const inst = await leesInstellingen();
  if (!naSluittijd(inst)) return;
  const week = huidigeWeek();
  if (await mailVerstuurd(week)) return;
  const m = await verstuurMail(week);
  await markeerMail(week);
  console.log(`Mail verstuurd voor ${week}: ${m.aantal} bestellingen`);
};

export const config = { schedule: "*/5 * * * 5" };

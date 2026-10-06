import { createHash, timingSafeEqual } from "node:crypto";

// Vergelijkt twee geheimen zonder dat de tijdsduur iets verraadt.
export function gelijk(a, b) {
  const h = (s) => createHash("sha256").update(String(s ?? "")).digest();
  return timingSafeEqual(h(a), h(b)) && a != null && a !== "";
}

import type { Assignment, PlanItem, Train } from "./types";

export const ASSIGNMENT_LABEL: Record<Assignment, string> = {
  REVENUE: "Revenue",
  STANDBY: "Standby",
  IBL: "IBL / maintenance",
};

export function countBy(items: PlanItem[]): Record<Assignment, number> {
  const out: Record<Assignment, number> = { REVENUE: 0, STANDBY: 0, IBL: 0 };
  for (const i of items) out[i.assignment] += 1;
  return out;
}

export function km(n: number): string {
  return `${n.toLocaleString("en-IN")} km`;
}

/** Earliest certificate expiry, in days from the service date (negative = expired). */
export function earliestExpiry(t: Train): number | null {
  if (!t.certificates.length) return null;
  return Math.min(...t.certificates.map((c) => c.days_left));
}

export function expiryTone(days: number | null): "expired" | "soon" | "ok" {
  if (days === null || days < 0) return "expired";
  if (days <= 7) return "soon";
  return "ok";
}

export function mileageDeviation(trains: Train[]): { train_id: string; deviation: number }[] {
  if (!trains.length) return [];
  const mean = trains.reduce((s, t) => s + t.cumulative_km, 0) / trains.length;
  return trains
    .map((t) => ({ train_id: t.train_id, deviation: Math.round(t.cumulative_km - mean) }))
    .sort((a, b) => a.deviation - b.deviation);
}

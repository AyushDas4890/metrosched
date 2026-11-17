import { describe, expect, it } from "vitest";
import { countBy, earliestExpiry, expiryTone, km, mileageDeviation } from "@/lib/format";
import type { PlanItem, Train } from "@/lib/types";

const item = (id: string, assignment: PlanItem["assignment"]): PlanItem => ({
  train_id: id, depot_id: "D1", assignment, rank: 1, score: 0, reasons: ["r"], violations: [],
});

const train = (id: string, kmv: number, days: number[]): Train => ({
  train_id: id, depot_id: "D1", cars: 3, cumulative_km: kmv, bay_id: "B", days_since_cleaning: 0, fit: true,
  cleaning_due: false, expired: [], job_cards: [], critical_open: 0, branding: null, apu: null,
  certificates: days.map((d, i) => ({ train_id: id, kind: `K${i}`, label: `K${i}`, valid_until: "2026-11-01", days_left: d })),
});

describe("format helpers", () => {
  it("counts assignments", () => {
    expect(countBy([item("a", "REVENUE"), item("b", "REVENUE"), item("c", "IBL")])).toEqual({ REVENUE: 2, STANDBY: 0, IBL: 1 });
  });

  it("formats km in Indian grouping", () => {
    expect(km(215000)).toBe("2,15,000 km");
  });

  it("finds earliest expiry and tone", () => {
    expect(earliestExpiry(train("a", 0, [30, 5, 60]))).toBe(5);
    expect(expiryTone(5)).toBe("soon");
    expect(expiryTone(-1)).toBe("expired");
    expect(expiryTone(null)).toBe("expired");
    expect(expiryTone(20)).toBe("ok");
  });

  it("computes mileage deviation sorted ascending", () => {
    const d = mileageDeviation([train("a", 100, []), train("b", 300, [])]);
    expect(d).toEqual([{ train_id: "a", deviation: -100 }, { train_id: "b", deviation: 100 }]);
  });
});

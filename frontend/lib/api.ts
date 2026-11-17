import type { ApuModel, FleetStatus, Override, Plan, Scenario, SimulateResult } from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      detail = (await res.json()).detail ?? detail;
    } catch {}
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return res.json() as Promise<T>;
}

export const api = {
  seed: () => call<{ loaded: Record<string, number> }>("/data/seed", { method: "POST" }),
  generate: () => call<Plan>("/plan/generate", { method: "POST", body: "{}" }),
  history: () => call<{ plan_id: number; created_at: string; feasible: boolean; counts: Record<string, number> }[]>("/plan/history"),
  plan: (id: number) => call<Plan>(`/plan/${id}`),
  fleet: () => call<FleetStatus>("/fleet/status"),
  simulate: (scenarios: Scenario[]) =>
    call<SimulateResult>("/plan/simulate", { method: "POST", body: JSON.stringify({ scenarios }) }),
  override: (body: { train_id: string; to_assignment: string; reason: string; plan_id?: number | null }) =>
    call<Override>("/plan/override", { method: "POST", body: JSON.stringify(body) }),
  overrides: () => call<Override[]>("/plan/overrides"),
  apuModel: () => call<ApuModel>("/apu/model"),
  weights: () => call<{ weights: Record<string, number>; source: string; overrides: number; min_required?: number }>("/ml/weights"),
};

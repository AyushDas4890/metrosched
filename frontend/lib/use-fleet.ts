"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import type { FleetStatus, Plan } from "./types";

/** Loads fleet status and (optionally) the latest plan. With no uploads, the backend serves the MetroPT-3 fleet. */
export function useFleet(withPlan = false) {
  const [fleet, setFleet] = useState<FleetStatus | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const f: FleetStatus = await api.fleet();
        setFleet(f);
        if (withPlan) {
          const hist = await api.history();
          setPlan(hist.length ? await api.plan(hist[0].plan_id) : await api.generate());
        }
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [withPlan]);

  return { fleet, plan, error };
}

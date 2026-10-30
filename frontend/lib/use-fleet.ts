"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import type { FleetStatus, Plan } from "./types";

/** Loads fleet status and (optionally) the latest plan. Seeds the backend once if it is empty. */
export function useFleet(withPlan = false) {
  const [fleet, setFleet] = useState<FleetStatus | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        let f: FleetStatus;
        try {
          f = await api.fleet();
        } catch (e) {
          if (!(e as Error).message.includes("No fleet data")) throw e;
          await api.seed();
          f = await api.fleet();
        }
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

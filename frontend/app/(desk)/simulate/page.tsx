"use client";

import { useState } from "react";
import { AssignmentBadge } from "@/components/assignment-badge";
import { ErrorNote, PageHeader } from "@/components/page-header";
import { TrainPlate } from "@/components/train-plate";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { countBy } from "@/lib/format";
import { useFleet } from "@/lib/use-fleet";
import type { Scenario, SimulateResult } from "@/lib/types";

type Kind = Scenario["type"];
const KINDS: { value: Kind; label: string }[] = [
  { value: "cert_expire", label: "A fitness certificate expires (hypothetical)" },
  { value: "crews_absent", label: "Cleaning crews are absent" },
  { value: "critical_job", label: "A critical fault is reported" },
  { value: "required_revenue", label: "Change the number of revenue trains" },
];

const field = "mt-1 block w-full rounded-md border border-input bg-card px-2 py-1.5";

export default function Simulator() {
  const { fleet, error } = useFleet();
  const [kind, setKind] = useState<Kind>("cert_expire");
  const [train, setTrain] = useState("TS-07");
  const [cert, setCert] = useState("ROLLING_STOCK");
  const [count, setCount] = useState(2);
  const [value, setValue] = useState(18);
  const [result, setResult] = useState<SimulateResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (error) return <ErrorNote message={error} />;
  if (!fleet) return <p>Loading fleet…</p>;

  function scenario(): Scenario {
    switch (kind) {
      case "cert_expire":
        return { type: kind, train_id: train, kind: cert };
      case "crews_absent":
        return { type: kind, count };
      case "critical_job":
        return { type: kind, train_id: train };
      case "required_revenue":
        return { type: kind, value };
    }
  }

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setRunError(null);
    try {
      setResult(await api.simulate([scenario()]));
    } catch (err) {
      setRunError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const needsTrain = kind === "cert_expire" || kind === "critical_job";

  return (
    <div>
      <PageHeader title="What-if simulator" />
      <form onSubmit={run} className="mb-6 grid max-w-3xl gap-4 rounded-xl border bg-card p-5 md:grid-cols-3">
        <label className="text-sm md:col-span-3">
          Scenario
          <select className={field} value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
            {KINDS.map((k) => {
              const noCleaning = k.value === "crews_absent" && !fleet.inputs_loaded.cleaning;
              return (
                <option key={k.value} value={k.value} disabled={noCleaning}>
                  {k.label}
                  {noCleaning ? " (needs cleaning data)" : ""}
                </option>
              );
            })}
          </select>
        </label>
        {needsTrain && (
          <label className="text-sm">
            Train
            <select className={field} value={train} onChange={(e) => setTrain(e.target.value)}>
              {fleet.trains.map((t) => (
                <option key={t.train_id}>{t.train_id}</option>
              ))}
            </select>
          </label>
        )}
        {kind === "cert_expire" && (
          <label className="text-sm">
            Certificate
            <select className={field} value={cert} onChange={(e) => setCert(e.target.value)}>
              <option value="ROLLING_STOCK">Rolling-Stock</option>
              <option value="SIGNALLING">Signalling</option>
              <option value="TELECOM">Telecom</option>
            </select>
          </label>
        )}
        {kind === "crews_absent" && (
          <label className="text-sm">
            Crews absent (3 slots each)
            <input type="number" min={1} max={4} className={field} value={count} onChange={(e) => setCount(+e.target.value)} />
          </label>
        )}
        {kind === "required_revenue" && (
          <label className="text-sm">
            Revenue trains needed
            <input type="number" min={1} max={fleet.trains.length} className={field} value={value} onChange={(e) => setValue(+e.target.value)} />
          </label>
        )}
        <div className="flex items-end">
          <Button type="submit" disabled={busy}>
            {busy ? "Running…" : "Run simulation"}
          </Button>
        </div>
      </form>

      {runError && <ErrorNote message={runError} />}

      {result && <SimulationResult result={result} />}
    </div>
  );
}

function SimulationResult({ result }: { result: SimulateResult }) {
  if (!result.scenario.feasible) {
    return (
      <section className="rounded-xl border border-ibl/50 bg-card p-5" aria-live="polite">
        <h2 className="font-condensed text-2xl font-bold">This scenario leaves no valid plan</h2>
        <ul className="mt-2 list-disc pl-5">
          {result.scenario.relaxations.map((r, i) => (
            <li key={i}>{r.message}</li>
          ))}
        </ul>
      </section>
    );
  }
  const before = countBy(result.baseline.items);
  const after = countBy(result.scenario.items);
  return (
    <section aria-live="polite" className="rounded-xl border bg-card p-5">
      <h2 className="mb-2 font-condensed text-2xl font-bold">
        {result.changes.length === 0 ? "No assignments change" : `${result.changes.length} assignment(s) change`}
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Revenue {before.REVENUE} to {after.REVENUE}, standby {before.STANDBY} to {after.STANDBY}, IBL {before.IBL} to {after.IBL}.
      </p>
      <ul className="space-y-3" data-testid="sim-changes">
        {result.changes.map((c) => (
          <li key={c.train_id} className="rounded-md border p-3">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <TrainPlate id={c.train_id} />
              {c.before && <AssignmentBadge value={c.before} />}
              <span aria-label="becomes">→</span>
              <AssignmentBadge value={c.after} />
            </div>
            <ul className="list-disc pl-5 text-sm">
              {c.reasons.slice(0, 3).map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ErrorNote, PageHeader } from "@/components/page-header";
import { api } from "@/lib/api";
import { ASSIGNMENT_LABEL } from "@/lib/format";
import type { Assignment, Override } from "@/lib/types";

type Weights = Awaited<ReturnType<typeof api.weights>>;

export default function OverrideLog() {
  const [rows, setRows] = useState<Override[] | null>(null);
  const [weights, setWeights] = useState<Weights | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.overrides(), api.weights()])
      .then(([o, w]) => {
        setRows(o);
        setWeights(w);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  if (error) return <ErrorNote message={error} />;
  if (!rows || !weights) return <p>Loading overrides…</p>;

  const label = (a: string) => ASSIGNMENT_LABEL[a as Assignment] ?? a;

  return (
    <div>
      <PageHeader title="Override log" />
      <section aria-labelledby="w" className="mb-6 rounded-md border bg-card p-4">
        <h2 id="w" className="font-condensed text-xl font-bold">
          How overrides shape the optimizer
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {weights.source === "learned"
            ? `Weights are learned from ${weights.overrides} logged overrides.`
            : `Using default weights. Learning starts after ${weights.min_required ?? 20} overrides (${weights.overrides} logged so far).`}
        </p>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {Object.entries(weights.weights).map(([k, v]) => (
            <div key={k} className="rounded-md border px-3 py-2">
              <dt className="text-sm capitalize text-muted-foreground">{k}</dt>
              <dd className="font-condensed text-2xl font-bold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="log" className="rounded-md border bg-card p-4">
        <h2 id="log" className="mb-3 font-condensed text-xl font-bold">
          Supervisor overrides ({rows.length})
        </h2>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No overrides yet. Open a train on Tonight&apos;s plan to change its assignment and record why.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2">When</th>
                  <th>Train</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Reason</th>
                  <th>Plan</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2">{new Date(r.created_at).toLocaleString("en-IN")}</td>
                    <td className="font-semibold">{r.train_id}</td>
                    <td>{label(r.from_assignment)}</td>
                    <td>{label(r.to_assignment)}</td>
                    <td>{r.reason}</td>
                    <td>#{r.plan_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

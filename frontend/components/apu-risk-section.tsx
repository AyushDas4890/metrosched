"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import { TOOLTIP } from "@/lib/chart";
import type { ApuModel, Train } from "@/lib/types";

/** Compressor (APU) failure risk per train, from real MetroPT-3 sensor data. */
export function ApuRiskSection({ trains }: { trains: Train[] }) {
  const [model, setModel] = useState<ApuModel | null>(null);

  useEffect(() => {
    api.apuModel().then(setModel).catch(() => setModel(null));
  }, []);

  const rows = trains
    .filter((t) => t.apu)
    .map((t) => ({ train_id: t.train_id, risk: Math.round(t.apu!.risk * 100), apu: t.apu! }))
    .sort((a, b) => b.risk - a.risk);
  if (!rows.length) return null;
  const threshold = Math.round((model?.alert_threshold ?? 0.5) * 100);

  return (
    <section aria-labelledby="apu" className="mb-8 rounded-xl border bg-card p-5">
      <h2 id="apu" className="font-condensed text-2xl font-bold">
        Compressor (APU) fault risk from real sensor data
      </h2>
      <p className="mb-3 max-w-3xl text-sm text-muted-foreground">
        Each train is given a 12-hour slice of real air-compressor readings from a Metro do Porto train (MetroPT-3).
        A model trained on the reported air-leak failures scores the slice. At {threshold}% or more the plan raises an
        alert, and the optimizer prefers to keep the train out of revenue service.
      </p>
      <ul className="mb-3 flex flex-wrap gap-4 text-sm" aria-label="Legend">
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: "var(--ibl)" }} />
          At or above alert level
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: "var(--revenue)" }} />
          Below alert level
        </li>
      </ul>
      <div className="h-[520px]">
        <ResponsiveContainer>
          <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 24 }} barCategoryGap={2}>
            <CartesianGrid horizontal={false} stroke="var(--grid)" />
            <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: "var(--axis)" }} />
            <YAxis type="category" dataKey="train_id" width={56} tick={{ fontSize: 12, fill: "var(--foreground)" }} interval={0} />
            <ReferenceLine x={threshold} stroke="var(--axis)" strokeDasharray="4 4" />
            <Tooltip
              {...TOOLTIP}
              formatter={(v, _n, p) => [
                `${v}% (slice ${p.payload.apu.slice_start} to ${p.payload.apu.slice_end})`,
                p.payload.apu.reported_failure_in_slice ? "Risk · reported air leak in slice" : "Risk",
              ]}
            />
            <Bar dataKey="risk" radius={[0, 4, 4, 0]} isAnimationActive={false}>
              {rows.map((r) => (
                <Cell key={r.train_id} fill={r.risk >= threshold ? "var(--ibl)" : "var(--revenue)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {model && (
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Reported failures caught" value={`${model.metrics.events_detected} of ${model.metrics.events}`} />
          <Stat label="ROC AUC" value={model.metrics.roc_auc.toFixed(3)} />
          <Stat label="Failure windows flagged" value={`${Math.round(model.metrics.recall_at_0_5 * 100)}%`} />
          <Stat label="False alarms (per window)" value={`${(model.metrics.false_alarm_rate_at_0_5 * 100).toFixed(1)}%`} />
        </dl>
      )}

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer">Show sensor slices per train</summary>
        <div className="overflow-x-auto">
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-1">Train</th>
                <th>Risk</th>
                <th>Sensor slice (2020)</th>
                <th>Reported air leak in slice</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.train_id} className="border-b last:border-0">
                  <td className="py-1">{r.train_id}</td>
                  <td>{r.risk}%</td>
                  <td>
                    {r.apu.slice_start} to {r.apu.slice_end}
                  </td>
                  <td>{r.apu.reported_failure_in_slice ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <p className="mt-3 text-xs text-muted-foreground">
        Source: {model?.source ?? "MetroPT-3, UCI Machine Learning Repository (CC BY 4.0)"}. The sensor data is real;
        assigning slices to these synthetic trainsets is a modelling assumption.
      </p>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border px-3 py-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-condensed text-2xl font-bold tabular-nums">{value}</dd>
    </div>
  );
}

"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ErrorNote, PageHeader } from "@/components/page-header";
import { TrainPlate } from "@/components/train-plate";
import { earliestExpiry, expiryTone } from "@/lib/format";
import { TOOLTIP } from "@/lib/chart";
import { useFleet } from "@/lib/use-fleet";

const TONE_COLOR = { expired: "var(--ibl)", soon: "var(--standby)", ok: "var(--revenue)" } as const;
const TONE_LABEL = { expired: "Expired", soon: "Expires within 7 days", ok: "Valid" } as const;
type Tone = keyof typeof TONE_LABEL;

export default function FleetHealth() {
  const { fleet, error } = useFleet();
  if (error) return <ErrorNote message={error} />;
  if (!fleet) return <p>Loading fleet…</p>;

  const expiry = fleet.trains
    .map((t) => {
      const d = earliestExpiry(t);
      return { train_id: t.train_id, days: d ?? -1, tone: expiryTone(d) };
    })
    .sort((a, b) => a.days - b.days);
  const prio: Record<string, number> = { CRITICAL: 0, HIGH: 1, LOW: 2 };
  const openJobs = fleet.trains
    .flatMap((t) => t.job_cards.filter((j) => j.status === "OPEN"))
    .sort((a, b) => prio[a.wopriority] - prio[b.wopriority] || a.assetnum.localeCompare(b.assetnum));

  return (
    <div>
      <PageHeader title="Fleet health" />
      <section aria-labelledby="exp" className="mb-8 rounded-xl border bg-card p-5">
        <h2 id="exp" className="font-condensed text-2xl font-bold">
          Days until each train&apos;s earliest fitness certificate expires
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Counted from service date {fleet.service_date}. Any expired certificate keeps the train out of service.
        </p>
        <ul className="mb-3 flex flex-wrap gap-4 text-sm" aria-label="Legend">
          {(Object.keys(TONE_LABEL) as Tone[]).map((k) => (
            <li key={k} className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ background: TONE_COLOR[k] }} />
              {TONE_LABEL[k]}
            </li>
          ))}
        </ul>
        <div className="h-[560px]">
          <ResponsiveContainer>
            <BarChart data={expiry} layout="vertical" margin={{ left: 8, right: 24 }} barCategoryGap={2}>
              <CartesianGrid horizontal={false} stroke="var(--grid)" />
              <XAxis type="number" tick={{ fontSize: 12, fill: "var(--axis)" }} unit=" d" />
              <YAxis type="category" dataKey="train_id" width={56} tick={{ fontSize: 12, fill: "var(--foreground)" }} interval={0} />
              <ReferenceLine x={0} stroke="var(--axis)" />
              <Tooltip {...TOOLTIP}
                formatter={(v, _n, p) => [`${v} days (${TONE_LABEL[p.payload.tone as Tone]})`, "Earliest expiry"]}
              />
              <Bar dataKey="days" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                {expiry.map((e) => (
                  <Cell key={e.train_id} fill={TONE_COLOR[e.tone]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer">Show certificate table</summary>
          <div className="overflow-x-auto">
            <table className="mt-2 w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-1">Train</th>
                  <th>Rolling-Stock</th>
                  <th>Signalling</th>
                  <th>Telecom</th>
                </tr>
              </thead>
              <tbody>
                {fleet.trains.map((t) => (
                  <tr key={t.train_id} className="border-b last:border-0">
                    <td className="py-1">{t.train_id}</td>
                    {["ROLLING_STOCK", "SIGNALLING", "TELECOM"].map((k) => {
                      const c = t.certificates.find((x) => x.kind === k);
                      return <td key={k}>{c ? `${c.valid_until} (${c.days_left} d)` : "missing"}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section aria-labelledby="jobs" className="rounded-xl border bg-card p-5">
        <h2 id="jobs" className="mb-3 font-condensed text-2xl font-bold">
          Open job cards ({openJobs.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2">Work order</th>
                <th>Train</th>
                <th>Description</th>
                <th>Priority</th>
                <th>Reported</th>
              </tr>
            </thead>
            <tbody>
              {openJobs.map((j) => (
                <tr key={j.wonum} className="border-b last:border-0">
                  <td className="py-2 tabular-nums">{j.wonum}</td>
                  <td>
                    <TrainPlate id={j.assetnum} className="text-sm" />
                  </td>
                  <td>{j.description}</td>
                  <td className={j.wopriority === "CRITICAL" ? "font-semibold text-ibl-ink" : ""}>
                    {j.wopriority === "CRITICAL" ? "⛔ Critical, blocks service" : j.wopriority.toLowerCase()}
                  </td>
                  <td>{j.reportdate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

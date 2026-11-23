"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { NotLoaded } from "@/components/not-loaded";
import { ErrorNote, PageHeader } from "@/components/page-header";
import { TOOLTIP } from "@/lib/chart";
import { useFleet } from "@/lib/use-fleet";

const BELOW = "var(--revenue)";
const ABOVE = "var(--standby)";
const ALARM = "var(--ibl)";

/** Real compressor usage per train (MetroPT-3), plus mileage and branding when real data is uploaded. */
export default function CompressorUsage() {
  const { fleet, error } = useFleet();
  if (error) return <ErrorNote message={error} />;
  if (!fleet) return <p>Loading fleet…</p>;

  const rows = fleet.trains
    .filter((t) => t.apu)
    .map((t) => ({ train_id: t.train_id, duty: Math.round(t.apu!.duty * 100), low: t.apu!.low_pressure_minutes }));
  const mean = rows.length ? Math.round(rows.reduce((s, r) => s + r.duty, 0) / rows.length) : 0;
  const duty = [...rows].sort((a, b) => a.duty - b.duty);
  const low = rows.filter((r) => r.low > 0).sort((a, b) => b.low - a.low);

  return (
    <div>
      <PageHeader title="Compressor use" />
      <section aria-labelledby="duty" className="mb-8 rounded-xl border bg-card p-5">
        <h2 id="duty" className="font-condensed text-2xl font-bold">
          How hard each compressor worked (average {mean}%)
        </h2>
        <p className="mb-3 max-w-3xl text-sm text-muted-foreground">
          Share of time the compressor was pumping air, from real readings. One that works much harder than the rest wears faster
          and may be covering for a leak, so the planner leans towards the lighter-worked trains for service.
        </p>
        <ul className="mb-3 flex gap-4 text-sm" aria-label="Legend">
          <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: BELOW }} />Average or less</li>
          <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: ABOVE }} />Above average</li>
        </ul>
        <div className="h-[340px]">
          <ResponsiveContainer>
            <BarChart data={duty} margin={{ left: 8, right: 8 }} barCategoryGap={2}>
              <CartesianGrid vertical={false} stroke="var(--grid)" />
              <XAxis dataKey="train_id" tick={{ fontSize: 11, fill: "var(--foreground)" }} interval={0} angle={-60} textAnchor="end" height={56} />
              <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 12, fill: "var(--axis)" }} />
              <ReferenceLine y={mean} stroke="var(--axis)" strokeDasharray="4 4" />
              <Tooltip {...TOOLTIP} formatter={(v) => [`${v}% of the time pumping`, "Compressor work"]} />
              <Bar dataKey="duty" isAnimationActive={false} radius={[4, 4, 0, 0]}>
                {duty.map((d) => (
                  <Cell key={d.train_id} fill={d.duty > mean ? ABOVE : BELOW} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section aria-labelledby="lps" className="mb-8 rounded-xl border bg-card p-5">
        <h2 id="lps" className="font-condensed text-2xl font-bold">
          Minutes with air pressure below 7 bar ({low.length} of {rows.length} trains)
        </h2>
        <p className="mb-3 max-w-3xl text-sm text-muted-foreground">
          From the real low-pressure warning signal. Brakes and doors need air above 7 bar, so every minute below it counts against
          passenger service and shows a warning on Tonight&apos;s plan.
        </p>
        {low.length === 0 ? (
          <p className="text-sm text-muted-foreground">No train dropped below 7 bar.</p>
        ) : (
          <div className="h-[260px]">
            <ResponsiveContainer>
              <BarChart data={low} layout="vertical" margin={{ left: 8, right: 24 }} barCategoryGap={4}>
                <CartesianGrid horizontal={false} stroke="var(--grid)" />
                <XAxis type="number" unit=" min" tick={{ fontSize: 12, fill: "var(--axis)" }} />
                <YAxis type="category" dataKey="train_id" width={56} tick={{ fontSize: 12, fill: "var(--foreground)" }} interval={0} />
                <Tooltip {...TOOLTIP} formatter={(v) => [`${v} min below 7 bar`, "Low pressure"]} />
                <Bar dataKey="low" fill={ALARM} radius={[0, 4, 4, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {!fleet.inputs_loaded.mileage && (
          <NotLoaded what="mileage" effect="Kilometres run are not balanced across trains." />
        )}
        {!fleet.inputs_loaded.branding && (
          <NotLoaded what="branding contract" effect="Advert-wrapped trains are not given extra service hours." />
        )}
      </div>
    </div>
  );
}

"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ErrorNote, PageHeader } from "@/components/page-header";
import { km, mileageDeviation } from "@/lib/format";
import { useFleet } from "@/lib/use-fleet";

const BELOW = "#0f7fa8";
const ABOVE = "#b7790a";

export default function MileageBranding() {
  const { fleet, error } = useFleet();
  if (error) return <ErrorNote message={error} />;
  if (!fleet) return <p>Loading fleet…</p>;

  const dev = mileageDeviation(fleet.trains);
  const mean = Math.round(fleet.trains.reduce((s, t) => s + t.cumulative_km, 0) / fleet.trains.length);
  const branded = fleet.trains
    .filter((t) => t.branding)
    .map((t) => ({
      train_id: t.train_id,
      advertiser: t.branding!.advertiser,
      shortfall: t.branding!.hours_shortfall_7d,
      min: t.branding!.min_hours_per_day,
    }))
    .sort((a, b) => b.shortfall - a.shortfall);

  return (
    <div>
      <PageHeader title="Mileage & branding" />
      <section aria-labelledby="km" className="mb-8 rounded-md border bg-card p-4">
        <h2 id="km" className="font-condensed text-xl font-bold">
          Cumulative mileage against the fleet mean of {km(mean)}
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          The optimizer prefers trains below the mean for revenue service so that bogie, brake and HVAC wear evens out.
        </p>
        <ul className="mb-3 flex gap-4 text-sm" aria-label="Legend">
          <li className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm" style={{ background: BELOW }} />
            Below mean
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm" style={{ background: ABOVE }} />
            Above mean
          </li>
        </ul>
        <div className="h-[340px]">
          <ResponsiveContainer>
            <BarChart data={dev} margin={{ left: 16, right: 8 }} barCategoryGap={2}>
              <CartesianGrid vertical={false} stroke="#e3e9ec" />
              <XAxis dataKey="train_id" tick={{ fontSize: 11, fill: "#13262f" }} interval={0} angle={-60} textAnchor="end" height={56} />
              <YAxis tick={{ fontSize: 12, fill: "#4f626b" }} tickFormatter={(v) => `${v / 1000}k`} />
              <ReferenceLine y={0} stroke="#13262f" />
              <Tooltip formatter={(v) => [`${Number(v) > 0 ? "+" : ""}${Number(v).toLocaleString("en-IN")} km`, "From mean"]} />
              <Bar dataKey="deviation" isAnimationActive={false} radius={4}>
                {dev.map((d) => (
                  <Cell key={d.train_id} fill={d.deviation < 0 ? BELOW : ABOVE} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section aria-labelledby="br" className="rounded-md border bg-card p-4">
        <h2 id="br" className="font-condensed text-xl font-bold">
          Branding exposure shortfall over the last 7 days
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Hours each wrapped train is behind its advertiser contract. Larger shortfalls pull the train toward revenue service.
        </p>
        <div className="h-[300px]">
          <ResponsiveContainer>
            <BarChart data={branded} layout="vertical" margin={{ left: 8, right: 24 }} barCategoryGap={4}>
              <CartesianGrid horizontal={false} stroke="#e3e9ec" />
              <XAxis type="number" unit=" h" tick={{ fontSize: 12, fill: "#4f626b" }} />
              <YAxis type="category" dataKey="train_id" width={56} tick={{ fontSize: 12, fill: "#13262f" }} interval={0} />
              <Tooltip formatter={(v, _n, p) => [`${v} h short (needs ${p.payload.min} h/day)`, p.payload.advertiser]} />
              <Bar dataKey="shortfall" fill={BELOW} radius={[0, 4, 4, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="overflow-x-auto">
          <table className="mt-3 w-full text-left text-sm">
            <caption className="sr-only">Branding contracts</caption>
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-1">Train</th>
                <th>Advertiser</th>
                <th>Minimum h/day</th>
                <th>Shortfall (7 d)</th>
              </tr>
            </thead>
            <tbody>
              {branded.map((b) => (
                <tr key={b.train_id} className="border-b last:border-0">
                  <td className="py-1">{b.train_id}</td>
                  <td>{b.advertiser}</td>
                  <td>{b.min}</td>
                  <td>{b.shortfall} h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

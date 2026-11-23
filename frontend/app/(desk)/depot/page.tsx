"use client";

import { AssignmentBadge } from "@/components/assignment-badge";
import { NotLoaded } from "@/components/not-loaded";
import { ErrorNote, PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";
import { useFleet } from "@/lib/use-fleet";
import type { Assignment } from "@/lib/types";

const SHORT: Record<Assignment, string> = { REVENUE: "Rev", STANDBY: "Stby", IBL: "IBL" };

const FILL: Record<Assignment, string> = {
  REVENUE: "border-revenue bg-revenue/30",
  STANDBY: "border-standby bg-standby/30",
  IBL: "border-ibl bg-ibl/30",
};

export default function DepotMap() {
  const { fleet, plan, error } = useFleet(true);
  if (error) return <ErrorNote message={error} />;
  if (!fleet || !plan) return <p>Loading depot…</p>;

  const assignment = Object.fromEntries(plan.items.map((i) => [i.train_id, i.assignment])) as Record<string, Assignment>;
  const byBay = Object.fromEntries(fleet.trains.map((t) => [t.bay_id, t]));
  const depot = fleet.depots[0];
  const bays = fleet.bays.filter((b) => b.depot_id === depot.depot_id);
  const lines = [...new Set(bays.filter((b) => b.kind === "STABLING").map((b) => b.line))].sort();
  const ibl = plan.items.filter((i) => i.assignment === "IBL");
  const shunts = plan.items.flatMap((i) => i.violations.filter((v) => v.startsWith("Shunting")).map((v) => ({ id: i.train_id, v })));

  return (
    <div>
      <PageHeader title={`Depot: ${depot.name}`} />
      <ul className="mb-4 flex flex-wrap gap-3" aria-label="Legend">
        {(["REVENUE", "STANDBY", "IBL"] as Assignment[]).map((a) => (
          <li key={a}>
            <AssignmentBadge value={a} />
          </li>
        ))}
      </ul>

      {fleet.inputs_loaded.bays ? (
      <section aria-labelledby="stab" className="mb-8 rounded-xl border bg-card p-5">
        <h2 id="stab" className="mb-1 font-condensed text-2xl font-bold">
          Stabling lines tonight
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Position 1 is nearest the exit. A revenue train behind a non-revenue train needs a shunting move before morning turn-out.
        </p>
        <div className="space-y-3 overflow-x-auto">
          {lines.map((line) => (
            <div key={line} className="flex items-center gap-2">
              <span className="w-16 shrink-0 font-condensed font-semibold">Line {line}</span>
              <span aria-hidden className="shrink-0 text-muted-foreground">exit ◀</span>
              <ol className="flex gap-1.5">
                {bays
                  .filter((b) => b.kind === "STABLING" && b.line === line)
                  .sort((a, b) => a.position - b.position)
                  .map((b) => {
                    const t = byBay[b.bay_id];
                    const a = t ? assignment[t.train_id] : undefined;
                    return (
                      <li
                        key={b.bay_id}
                        title={b.bay_id}
                        className={cn(
                          "flex h-14 w-20 shrink-0 flex-col items-center justify-center rounded-md border-2 text-center",
                          a ? FILL[a] : "border-dashed border-border text-muted-foreground",
                        )}
                      >
                        <span className="font-condensed text-base font-bold">{t ? t.train_id : "empty"}</span>
                        <span className="text-[11px] text-muted-foreground">P{b.position}{a ? ` · ${SHORT[a]}` : ""}</span>
                      </li>
                    );
                  })}
              </ol>
            </div>
          ))}
        </div>
      </section>
      ) : (
        <div className="mb-8">
          <NotLoaded what="stabling bay" effect="Bay positions and shunting moves cannot be shown or planned." />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <section aria-labelledby="ibl" className="rounded-xl border bg-card p-5">
          <h2 id="ibl" className="mb-2 font-condensed text-2xl font-bold">
            Kept back on the maintenance line ({ibl.length} of {fleet.config.ibl_capacity} bays used)
          </h2>
          <ul className="space-y-1 text-sm">
            {ibl.map((i) => (
              <li key={i.train_id}>
                <span className="font-semibold">{i.train_id}</span>: {i.reasons[0]}
              </li>
            ))}
          </ul>
        </section>
        {fleet.inputs_loaded.bays ? (
        <section aria-labelledby="sh" className="rounded-xl border bg-card p-5">
          <h2 id="sh" className="mb-2 font-condensed text-2xl font-bold">
            Shunting moves needed ({shunts.length})
          </h2>
          {shunts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Every revenue train has a clear exit path.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {shunts.map((s) => (
                <li key={s.id}>{s.v}</li>
              ))}
            </ul>
          )}
        </section>
        ) : (
          <NotLoaded what="stabling bay" effect="Shunting is not part of the plan." />
        )}
      </div>
    </div>
  );
}

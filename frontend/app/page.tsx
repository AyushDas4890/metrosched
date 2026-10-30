"use client";

import { useCallback, useEffect, useState } from "react";
import { AssignmentBadge } from "@/components/assignment-badge";
import { ErrorNote, PageHeader } from "@/components/page-header";
import { TrainPlate } from "@/components/train-plate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { ASSIGNMENT_LABEL, countBy } from "@/lib/format";
import type { Assignment, Plan, PlanItem } from "@/lib/types";

const ORDER: Assignment[] = ["REVENUE", "STANDBY", "IBL"];

export default function TonightsPlan() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const loadLatest = useCallback(async () => {
    try {
      const hist = await api.history();
      if (hist.length) setPlan(await api.plan(hist[0].plan_id));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    loadLatest();
  }, [loadLatest]);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      try {
        setPlan(await api.generate());
      } catch (e) {
        if (!(e as Error).message.includes("No fleet data")) throw e;
        await api.seed();
        setPlan(await api.generate());
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const counts = plan ? countBy(plan.items) : null;

  return (
    <div>
      <PageHeader title="Tonight's plan">
        <div className="flex items-center gap-3">
          {plan?.feasible && (
            <span className="text-sm text-muted-foreground">
              Service date {plan.service_date} · solved in {plan.solve_seconds.toFixed(2)} s · weights: {plan.weights_source ?? "stored"}
            </span>
          )}
          <Button onClick={generate} disabled={busy}>
            {busy ? "Generating…" : "Generate plan"}
          </Button>
        </div>
      </PageHeader>

      {error && <ErrorNote message={error} />}

      {!plan && !error && (
        <p className="max-w-prose text-muted-foreground">
          No plan yet for tonight. Generate a plan to rank every trainset for revenue service, standby or the inspection bay line.
        </p>
      )}

      {plan && !plan.feasible && (
        <section aria-labelledby="relax" className="rounded-md border border-ibl/50 bg-card p-4">
          <h2 id="relax" className="font-condensed text-xl font-bold">
            No plan satisfies every hard rule
          </h2>
          <p className="mb-2 text-sm text-muted-foreground">The smallest relaxation that would make a plan possible:</p>
          <ul className="list-disc pl-5">
            {plan.relaxations.map((r, i) => (
              <li key={i}>{r.message}</li>
            ))}
          </ul>
        </section>
      )}

      {plan?.feasible && counts && (
        <>
          <ol aria-label="Ranked induction list" className="mb-8 overflow-x-auto rounded-md border bg-card">
            <li className="hidden grid-cols-[3rem_6rem_12rem_4.5rem_1fr] gap-3 border-b px-4 py-2 text-sm font-semibold text-muted-foreground md:grid">
              <span>Rank</span>
              <span>Train</span>
              <span>Assignment</span>
              <span className="text-right">Score</span>
              <span>Why</span>
            </li>
            {plan.items.map((item) => (
              <PlanRow
                key={item.train_id}
                item={item}
                expanded={open === item.train_id}
                onToggle={() => setOpen(open === item.train_id ? null : item.train_id)}
                planId={plan.plan_id}
                onOverridden={loadLatest}
              />
            ))}
          </ol>

          <section aria-label="Assignment columns" className="grid gap-4 md:grid-cols-3">
            {ORDER.map((a) => (
              <div key={a} className="rounded-md border bg-card p-4">
                <h2 className="mb-3 flex items-baseline justify-between">
                  <AssignmentBadge value={a} />
                  <span className="font-condensed text-2xl font-bold">{counts[a]}</span>
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {plan.items
                    .filter((i) => i.assignment === a)
                    .map((i) => (
                      <TrainPlate key={i.train_id} id={i.train_id} className="text-sm" />
                    ))}
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}

/** The most train-specific reason: skips the generic headline and the "all certificates valid" line. */
function keyReason(item: PlanItem): string {
  return item.reasons.slice(1).find((r) => !r.startsWith("All fitness")) ?? item.reasons[0];
}

function PlanRow({
  item,
  expanded,
  onToggle,
  planId,
  onOverridden,
}: {
  item: PlanItem;
  expanded: boolean;
  onToggle: () => void;
  planId: number | null;
  onOverridden: () => void;
}) {
  return (
    <li data-testid="plan-row" className="border-b last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="grid w-full grid-cols-[3rem_6rem_1fr] items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/60 md:grid-cols-[3rem_6rem_12rem_4.5rem_1fr]"
      >
        <span className="font-condensed text-lg font-semibold text-muted-foreground">{item.rank}</span>
        <TrainPlate id={item.train_id} />
        <span>
          <AssignmentBadge value={item.assignment} />
        </span>
        <span className="hidden text-right tabular-nums md:block">{item.score.toFixed(1)}</span>
        <span className="col-span-3 flex flex-wrap items-center gap-2 text-sm md:col-span-1">
          <span className="truncate">{keyReason(item)}</span>
          {item.violations.length > 0 && (
            <span className="shrink-0 rounded-md bg-standby/15 px-1.5 py-0.5 text-xs font-semibold text-[#7a5106]">
              ⚠ {item.violations.length} alert{item.violations.length > 1 ? "s" : ""}
            </span>
          )}
        </span>
      </button>
      {expanded && (
        <div className="grid gap-4 bg-muted/40 px-4 py-4 md:grid-cols-[1fr_20rem] md:pl-[10.5rem]">
          <div>
            <h3 className="mb-1 font-semibold">Reasons</h3>
            <ul className="mb-3 list-disc space-y-0.5 pl-5 text-sm">
              {item.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
            {item.violations.length > 0 && (
              <>
                <h3 className="mb-1 font-semibold">Conflict alerts</h3>
                <ul className="list-disc space-y-0.5 pl-5 text-sm">
                  {item.violations.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <OverrideForm item={item} planId={planId} onDone={onOverridden} />
        </div>
      )}
    </li>
  );
}

function OverrideForm({ item, planId, onDone }: { item: PlanItem; planId: number | null; onDone: () => void }) {
  const [to, setTo] = useState<Assignment>(item.assignment === "REVENUE" ? "STANDBY" : "REVENUE");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.override({ train_id: item.train_id, to_assignment: to, reason, plan_id: planId });
      setMsg(`Override saved: ${item.train_id} to ${ASSIGNMENT_LABEL[to]}`);
      onDone();
    } catch (err) {
      setMsg((err as Error).message);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-md border bg-card p-3">
      <h3 className="font-semibold">Override this assignment</h3>
      <label className="block text-sm">
        Move to
        <select
          value={to}
          onChange={(e) => setTo(e.target.value as Assignment)}
          className="mt-1 block w-full rounded-md border border-input bg-card px-2 py-1.5"
        >
          {ORDER.filter((a) => a !== item.assignment).map((a) => (
            <option key={a} value={a}>
              {ASSIGNMENT_LABEL[a]}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Reason
        <Input value={reason} onChange={(e) => setReason(e.target.value)} required minLength={3} className="mt-1" />
      </label>
      <Button type="submit" size="sm" variant="secondary">
        Save override
      </Button>
      {msg && (
        <p role="status" className="text-sm">
          {msg}
        </p>
      )}
    </form>
  );
}


"use client";

import { useState } from "react";
import { KbHitCard } from "@/components/kb-hit";
import { ErrorNote, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { KbHit } from "@/lib/types";

const EXAMPLES = ["compressor air leak", "pressure below 7 bar", "motor current under load", "oil temperature"];

export default function KnowledgeBase() {
  const [q, setQ] = useState("");
  const [result, setResult] = useState<{ guidance: KbHit[]; past_cases: KbHit[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function search(query: string) {
    setQ(query);
    setError(null);
    try {
      const r = await api.kbSearch(query, 5);
      setResult({ guidance: r.guidance, past_cases: r.past_cases });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div>
      <PageHeader title="Knowledge base" />
      <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
        Search the four real MetroPT-3 compressor failure reports and the dataset&apos;s sensor documentation (plus past work orders, if
        you upload real ones). Results are
        retrieved by text similarity and quoted with their source; nothing is generated.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          search(q);
        }}
        className="mb-3 flex max-w-2xl gap-2"
      >
        <label htmlFor="kb-q" className="sr-only">
          Search the knowledge base
        </label>
        <Input id="kb-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. pantograph carbon strip" />
        <Button type="submit" className="pressable">
          Search
        </Button>
      </form>
      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        {EXAMPLES.map((ex) => (
          <button key={ex} type="button" onClick={() => search(ex)} className="pressable rounded-full border px-3 py-1 text-muted-foreground hover:text-foreground">
            {ex}
          </button>
        ))}
      </div>
      {error && <ErrorNote message={error} />}
      {result && (
        <div aria-live="polite">
          {result.guidance.length + result.past_cases.length === 0 ? (
            <p className="text-sm text-muted-foreground">No passage matches “{q}”. Try a fault name such as “door actuator”.</p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <ResultGroup title="Failure reports and sensor documentation" hits={result.guidance} />
              <ResultGroup title="Similar past work orders (uploaded)" hits={result.past_cases} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultGroup({ title, hits }: { title: string; hits: KbHit[] }) {
  return (
    <section aria-label={title}>
      <h2 className="mb-2 font-condensed text-xl font-bold">{title}</h2>
      {hits.length ? (
        <ul className="space-y-2">
          {hits.map((h) => (
            <KbHitCard key={h.id} hit={h} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No match.</p>
      )}
    </section>
  );
}

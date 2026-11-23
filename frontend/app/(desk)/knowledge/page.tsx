"use client";

import { useState } from "react";
import { KbHitCard } from "@/components/kb-hit";
import { ErrorNote, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { KbAnswer, KbHit } from "@/lib/types";

const EXAMPLES = ["compressor air leak", "pressure below 7 bar", "motor current under load", "oil temperature"];

export default function KnowledgeBase() {
  const [q, setQ] = useState("");
  const [result, setResult] = useState<{ guidance: KbHit[]; past_cases: KbHit[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ans, setAns] = useState<KbAnswer | null>(null);

  async function search(query: string) {
    setQ(query);
    setError(null);
    setAns(null);
    api.kbAnswer(query).then(setAns).catch(() => setAns(null));
    try {
      const r = await api.kbSearch(query, 5);
      setResult({ guidance: r.guidance, past_cases: r.past_cases });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div>
      <PageHeader title="Fault notes" />
      <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
        Search the four real compressor failure reports and the sensor notes from MetroPT-3. A short answer is written only from these notes, with the exact quote and its
        source; nothing is made up.
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
        <Input id="kb-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. air leak" />
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
      {ans && <AnswerCard a={ans} />}
      {result && (
        <div aria-live="polite">
          {result.guidance.length + result.past_cases.length === 0 ? (
            <p className="text-sm text-muted-foreground">No passage matches “{q}”. Try simpler words such as “air leak” or “pressure”.</p>
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

const NOTE: Record<KbAnswer["status"], string> = {
  answered: "Written from the quotes below. Check the source before acting.",
  refused: "Not answered",
  no_match: "No answer in the fault notes",
  quotes_only: "Quotes only",
};

/** The short written answer, each claim tied to the real passage it came from. */
function AnswerCard({ a }: { a: KbAnswer }) {
  return (
    <section aria-live="polite" className="mb-6 max-w-3xl rounded-xl border bg-card p-5">
      <h2 className="mb-1 font-condensed text-xl font-bold">Answer</h2>
      <p className="mb-3 text-sm text-muted-foreground">{a.status === "answered" ? NOTE.answered : `${NOTE[a.status]}: ${a.reason}`}</p>
      {a.answer && <p className="mb-3">{a.answer}</p>}
      {a.citations.length > 0 && (
        <ol className="space-y-2 text-sm">
          {a.citations.map((c, i) => (
            <li key={i} className="rounded-md border-l-2 border-revenue bg-muted/50 px-3 py-2">
              <span className="font-semibold">[{i + 1}] {c.title}</span>
              <span className="block text-muted-foreground">“{c.quote}”</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

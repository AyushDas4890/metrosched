"use client";

import { useEffect, useState } from "react";
import { KbHitCard } from "@/components/kb-hit";
import { api } from "@/lib/api";
import type { KbTopic } from "@/lib/types";

/** Procedures and similar past work orders for each of this train's issues tonight (retrieval only). */
export function KbRelated({ trainId }: { trainId: string }) {
  const [topics, setTopics] = useState<KbTopic[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .kbTrain(trainId)
      .then((r) => setTopics(r.related))
      .catch((e) => setError((e as Error).message));
  }, [trainId]);

  if (error) return <p className="text-sm text-ibl-ink">Knowledge base unavailable: {error}</p>;
  if (!topics) return <p className="text-sm text-muted-foreground">Searching the knowledge base…</p>;
  if (!topics.length) return <p className="text-sm text-muted-foreground">No open issues to look up for this train.</p>;

  return (
    <div className="space-y-4">
      {topics.map((t) => (
        <div key={t.topic}>
          <h4 className="mb-2 text-sm font-semibold">{t.topic}</h4>
          <div className="grid gap-3 lg:grid-cols-2">
            <section aria-label={`How to handle: ${t.topic}`}>
              <p className="mb-1 text-xs text-muted-foreground">What the real data says</p>
              <ul className="space-y-2">
                {t.guidance.length ? t.guidance.map((h) => <KbHitCard key={h.id} hit={h} />) : <li className="text-sm text-muted-foreground">No matching document.</li>}
              </ul>
            </section>
            <section aria-label={`Similar past cases: ${t.topic}`}>
              <p className="mb-1 text-xs text-muted-foreground">Similar past work orders (only if uploaded)</p>
              <ul className="space-y-2">
                {t.past_cases.length ? t.past_cases.map((h) => <KbHitCard key={h.id} hit={h} />) : <li className="text-sm text-muted-foreground">No similar past cases.</li>}
              </ul>
            </section>
          </div>
        </div>
      ))}
    </div>
  );
}

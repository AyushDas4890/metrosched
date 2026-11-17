import type { KbHit } from "@/lib/types";
import { cn } from "@/lib/utils";

/** One retrieved passage with its citation and its source label. */
export function KbHitCard({ hit }: { hit: KbHit }) {
  return (
    <li className="rounded-lg border bg-background/60 p-3">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="font-semibold">{hit.title}</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold",
            hit.source === "real" ? "bg-revenue/20 text-revenue-ink" : "bg-muted text-muted-foreground",
          )}
        >
          {hit.source === "real" ? "Real data" : "Unlabelled"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{hit.snippet}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Source: {hit.doc} · {hit.id} · match {hit.score.toFixed(2)}
      </p>
    </li>
  );
}

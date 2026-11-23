/** Shown where an input has no real data. MetroSched never fills these with invented values. */
export function NotLoaded({ what, effect }: { what: string; effect: string }) {
  return (
    <div role="note" className="rounded-lg border border-dashed px-4 py-3 text-sm">
      <p className="font-semibold">No {what} data loaded</p>
      <p className="mt-1 text-muted-foreground">
        KMRL has not shared its {what} records, and MetroSched never makes them up. {effect} Once the records file is uploaded, this switches on by itself.
      </p>
    </div>
  );
}

/** The plan-level list of hard rules that could not be checked because their input is missing. */
export function CoverageNote({ rules, goals }: { rules: string[]; goals: string[] }) {
  if (!rules.length && !goals.length) return null;
  return (
    <details className="mb-4 rounded-lg border border-standby/40 bg-standby/10 px-3 py-2 text-sm">
      <summary className="cursor-pointer text-standby-ink">
        Check by hand tonight: {rules.length} safety check{rules.length === 1 ? "" : "s"} and {goals.length} preference{goals.length === 1 ? "" : "s"} have no records yet (tap to see)
      </summary>
      <div className="mt-2 grid gap-3 md:grid-cols-2">
        <ul className="list-disc pl-5">
          {rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <ul className="list-disc pl-5">
          {goals.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </div>
    </details>
  );
}

import { cn } from "@/lib/utils";

/** Train number styled like the depot's stencilled train plates — the one bold element in the UI. */
export function TrainPlate({ id, className }: { id: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-sm bg-plate px-2 py-0.5 font-condensed text-base font-bold tracking-wider text-plate-ink",
        className,
      )}
    >
      {id}
    </span>
  );
}

import { cn } from "@/lib/utils";

/** Train number styled like a stencilled depot plate — the one bold brand element in the UI. */
export function TrainPlate({ id, className }: { id: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-[5px] bg-plate px-2 py-0.5 font-condensed text-base font-bold tracking-wider text-plate-ink shadow-[inset_0_-1px_0_rgba(0,0,0,0.25)]",
        className,
      )}
    >
      {id}
    </span>
  );
}

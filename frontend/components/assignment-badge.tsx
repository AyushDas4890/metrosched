import type { Assignment } from "@/lib/types";
import { ASSIGNMENT_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";

const STYLE: Record<Assignment, string> = {
  REVENUE: "border-revenue/60 text-revenue-ink bg-revenue/15",
  STANDBY: "border-standby/60 text-standby-ink bg-standby/15",
  IBL: "border-ibl/60 text-ibl-ink bg-ibl/15",
};
const ICON: Record<Assignment, string> = { REVENUE: "▶", STANDBY: "❚❚", IBL: "⚒" };

export function AssignmentBadge({ value }: { value: Assignment }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-sm font-semibold", STYLE[value])}>
      <span aria-hidden>{ICON[value]}</span>
      {ASSIGNMENT_LABEL[value]}
    </span>
  );
}

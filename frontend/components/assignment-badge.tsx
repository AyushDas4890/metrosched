import type { Assignment } from "@/lib/types";
import { ASSIGNMENT_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";

const STYLE: Record<Assignment, string> = {
  REVENUE: "border-revenue text-revenue bg-revenue/10",
  STANDBY: "border-standby text-[#7a5106] bg-standby/10",
  IBL: "border-ibl text-ibl bg-ibl/10",
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

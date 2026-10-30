"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Tonight's plan" },
  { href: "/fleet", label: "Fleet health" },
  { href: "/mileage", label: "Mileage & branding" },
  { href: "/depot", label: "Depot bay map" },
  { href: "/simulate", label: "What-if simulator" },
  { href: "/overrides", label: "Override log" },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="border-b bg-plate text-plate-ink md:w-60 md:shrink-0 md:border-b-0 md:border-r">
      <div className="px-5 py-5">
        <p className="font-condensed text-2xl font-bold tracking-wide">MetroSched</p>
        <p className="text-sm text-plate-ink/70">Muttom depot induction desk</p>
      </div>
      <ul className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible">
        {NAV.map((n) => {
          const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
          return (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block whitespace-nowrap rounded-md px-3 py-2 text-sm",
                  active ? "bg-plate-ink text-plate font-semibold" : "text-plate-ink/80 hover:bg-white/10",
                )}
              >
                {n.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

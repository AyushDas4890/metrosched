"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Wordmark } from "@/components/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Tonight's plan", hint: "Which train goes where" },
  { href: "/fleet", label: "Train health", hint: "Fault risk per train" },
  { href: "/usage", label: "Compressor use", hint: "Air pressure and load" },
  { href: "/depot", label: "Depot", hint: "Maintenance line" },
  { href: "/simulate", label: "What if…", hint: "Test a change first" },
  { href: "/overrides", label: "Change log", hint: "Who changed what" },
  { href: "/knowledge", label: "Fault notes", hint: "Search past failures" },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <nav
      aria-label="Main"
      className="material sticky top-0 z-20 border-b md:h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r"
    >
      <div className="px-5 pb-4 pt-5">
        <Wordmark />
        <p className="mt-2 text-sm text-muted-foreground">Muttom depot · night induction</p>
      </div>
      <ul className="flex gap-1 overflow-x-auto px-3 pb-3 [scrollbar-width:none] md:flex-col md:overflow-visible">
        {NAV.map((n) => {
          const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
          return (
            <li key={n.href} className="relative">
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-lg bg-secondary"
                  aria-hidden="true"
                />
              )}
              <Link
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "pressable relative block whitespace-nowrap rounded-lg px-3 py-2 text-[0.95rem]",
                  active ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {n.label}
                <span className="hidden text-xs font-normal text-muted-foreground md:block">{n.hint}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <Link
        href="/story"
        className="pressable mx-3 mt-4 hidden rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground hover:text-foreground md:block"
      >
        How MetroSched works
      </Link>
    </nav>
  );
}

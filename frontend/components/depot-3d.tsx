"use client";

import { motion, useReducedMotion, useSpring, useTransform } from "motion/react";
import type { Assignment, PlanItem } from "@/lib/types";
import { ASSIGNMENT_LABEL } from "@/lib/format";

const TRACKS: { a: Assignment; hint: string }[] = [
  { a: "REVENUE", hint: "Runs passenger service tomorrow" },
  { a: "STANDBY", hint: "Ready spare if a train fails" },
  { a: "IBL", hint: "Stays back for checks or repair" },
];
const COLOR: Record<Assignment, string> = { REVENUE: "var(--revenue)", STANDBY: "var(--standby)", IBL: "var(--ibl)" };

/**
 * Tonight's plan drawn as three depot tracks in 3D. Each car is one trainset.
 * The scene tilts toward the pointer on a critically damped spring and settles flat when the pointer leaves.
 */
export function Depot3D({ items, onPick }: { items: PlanItem[]; onPick: (id: string) => void }) {
  const reduce = useReducedMotion();
  const rx = useSpring(18, { bounce: 0, duration: 0.4 });
  const ry = useSpring(0, { bounce: 0, duration: 0.4 });
  const transform = useTransform([rx, ry], ([x, y]) => `rotateX(${x}deg) rotateZ(${y}deg)`);

  function move(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    rx.set(18 - py * 12);
    ry.set(px * -6);
  }
  function leave() {
    rx.set(18);
    ry.set(0);
  }

  return (
    <div
      onPointerMove={move}
      onPointerLeave={leave}
      className="mb-8 overflow-hidden rounded-xl border bg-card px-4 pb-6 pt-4 [perspective:1100px]"
      aria-label="Depot tracks for tonight"
    >
      <motion.div style={reduce ? undefined : { transform, transformStyle: "preserve-3d" }} className="space-y-5 py-1">
        {TRACKS.map(({ a, hint }, ti) => {
          const cars = items.filter((i) => i.assignment === a);
          return (
            <div key={a} style={{ transformStyle: "preserve-3d" }}>
              <div className="mb-2 flex items-baseline gap-3">
                <span className="font-semibold" style={{ color: COLOR[a] }}>
                  {ASSIGNMENT_LABEL[a]} · {cars.length}
                </span>
                <span className="text-sm text-muted-foreground">{hint}</span>
              </div>
              <div className="relative" style={{ transformStyle: "preserve-3d" }}>
                {/* rails */}
                <div aria-hidden className="absolute inset-x-0 bottom-1 h-px bg-border" />
                <div aria-hidden className="absolute inset-x-0 bottom-3 h-px bg-border" />
                <ol className="flex flex-wrap gap-2 pb-2" style={{ transformStyle: "preserve-3d" }}>
                  {cars.map((c, ci) => (
                    <motion.li
                      key={c.train_id}
                      layoutId={`car-${c.train_id}`}
                      initial={reduce ? { opacity: 0 } : { opacity: 0, z: 60, y: -12 }}
                      animate={{ opacity: 1, z: 0, y: 0 }}
                      transition={{ type: "spring", bounce: 0, duration: 0.5, delay: reduce ? 0 : ti * 0.12 + ci * 0.025 }}
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      <motion.button
                        type="button"
                        onClick={() => onPick(c.train_id)}
                        whileHover={reduce ? undefined : { z: 14 }}
                        whileTap={{ scale: 0.96 }}
                        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                        title={`${c.train_id}: ${c.reasons[0]}`}
                        className="relative flex h-10 w-[4.5rem] items-center justify-center rounded-md border font-condensed text-sm font-bold tabular-nums"
                        style={{
                          transformStyle: "preserve-3d",
                          background: `color-mix(in oklab, ${COLOR[a]} 22%, var(--card))`,
                          borderColor: `color-mix(in oklab, ${COLOR[a]} 60%, transparent)`,
                          boxShadow: `0 6px 0 -1px color-mix(in oklab, ${COLOR[a]} 45%, var(--background))`,
                        }}
                      >
                        {c.train_id}
                        {c.violations.length > 0 && (
                          <span aria-label="has alerts" className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-standby" />
                        )}
                      </motion.button>
                    </motion.li>
                  ))}
                </ol>
              </div>
            </div>
          );
        })}
      </motion.div>
      <p className="text-sm text-muted-foreground">Tap a train to see why it was placed there. A yellow dot means it needs a look.</p>
    </div>
  );
}

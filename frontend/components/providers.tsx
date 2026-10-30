"use client";

import { MotionConfig } from "motion/react";
import { SPRING } from "@/lib/motion";

/** reducedMotion="user" swaps transform animations for instant changes when the OS asks for less motion. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={SPRING}>
      {children}
    </MotionConfig>
  );
}

import type { Transition } from "motion/react";

/** Critically damped default (Apple: damping 1.0, response ~0.35 s). Used for anything without momentum. */
export const SPRING: Transition = { type: "spring", bounce: 0, duration: 0.35 };

/** Slightly softer spring for layout moves such as rows re-ranking. */
export const LAYOUT_SPRING: Transition = { type: "spring", bounce: 0, duration: 0.45 };

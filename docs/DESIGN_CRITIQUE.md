# Design self-critique

A heuristic review of the MetroSched dashboard and the `/story` page after the brand and motion redesign. Each finding names the principle it breaks, its severity on Nielsen's 0–4 scale, and what was done about it.

## Context

- **User:** a depot supervisor working the 21:00–23:00 induction shift. They use the dashboard every night and know the domain.
- **Primary task:** generate tonight's plan, check why each train got its assignment, override where needed.
- **Posture:** the dashboard is a sovereign tool, used for sustained work and dense by design. The story page is transient: it explains the system once, to examiners or new staff.

## Brand and visual direction

| Decision | Reason |
|---|---|
| Dark "night desk" theme | The tool is used at night in a control-room setting. A dark surface reduces glare and suits the operator posture. |
| Train-plate motif (light stencilled plate) | The single bold element. It mirrors the physical number plates on KMRL stock and makes train IDs the fastest thing to scan. |
| Logo: three stabling lines, the middle one exits through a chevron | Product action, abstracted: one train inducted into service. It works at 28 px and at 64 px. |
| Assignment colours `#2A9FC6` / `#BC8422` / `#DA5670` | Validated for colour-vision deficiency on the card surface with the dataviz palette validator. Each colour also ships with an icon and a text label. |
| Barlow / Barlow Condensed | A signage typeface family that fits a depot. Condensed is used for numbers and headings; tracking tightens at display sizes. |
| Motion: critically damped springs (bounce 0, about 0.35 s) | Apple's fluid-interface defaults. Nothing in the dashboard is flicked, so nothing overshoots. Motion follows `prefers-reduced-motion` through `MotionConfig reducedMotion="user"`. |

## Findings

| # | Where | Finding | Principle | Sev. | Action |
|---|---|---|---|---|---|
| 1 | Story: carousel | Cards turned edge-on rendered as an empty outlined frame. | H8 Aesthetic and minimalist design | 2 | **Fixed.** Each card's opacity now follows how directly it faces the viewer, so turned-away cards fade out. |
| 2 | Depot bay map | At 15% fill on the dark surface, Revenue, Standby and IBL tiles were nearly identical. Colour was the only cue. | Law of Similarity; WCAG 1.4.1 Use of Color | 3 | **Fixed.** Fill raised to 30%, and each tile now says `P1 · Rev`, `Stby` or `IBL`. |
| 3 | Tonight's plan | "Score" had no explanation. | H2 Match between system and real world; H10 Help | 2 | **Fixed.** Added a one-line caption above the list and a tooltip on the column header. |
| 4 | Story: depot captions | On narrow screens a caption could run past the viewport edge. | Responsive layout | 2 | **Fixed.** Captions are inset, balanced and smaller on mobile. |
| 5 | Mobile navigation | The horizontal nav showed a raw scrollbar. | H8 Aesthetic and minimalist design | 1 | **Fixed.** Scrollbar hidden; the strip still scrolls. |
| 6 | Story: 3D depot on small screens | The fixed 980 px floor overflowed narrow viewports. | Responsive layout | 3 | **Fixed.** A wrapper scales the floor at 1150, 860 and 600 px breakpoints without touching the GSAP transform. |
| 7 | Summary counts | The CountUp numbers animate, so a screen reader could announce a value mid-count. | H1 Visibility of system status; accessibility | 2 | **Fixed.** Animated digits are `aria-hidden`; a visually hidden "18 trains" carries the real value. |
| 8 | Overrides | An override cannot be undone from the UI; you have to override it back. | H3 User control and freedom | 2 | **Open.** Each override is logged with its reason, so it stays auditable. Undo is listed as future work. |
| 9 | Tonight's plan | The summary cards repeat train IDs that also appear in the ranked list. | H8 vs. H6 Recognition rather than recall | 1 | **Kept on purpose.** The cards answer "which trains are in revenue?" at a glance; the list answers "why?". |
| 10 | Story page | The scroll-pinned depot scene takes about 3 screens of scrolling. | Goal-gradient; user control | 1 | **Kept.** Captions mark progress; "Open tonight's plan" stays fixed in the header as an exit. |
| 11 | Whole UI | Dark theme only; there is no light mode. | Flexibility | 1 | **Open.** The tokens live in one `:root` block, so a light theme is one override away. |

## What works

- **Visual hierarchy:** the primary action (Generate plan) is the only filled pill on the page. Train plates are the highest-contrast element in every row.
- **Feedback:** buttons scale on press (`:active`, 100 ms). Row expansion and re-ranking animate from the current position with interruptible springs.
- **Status:** the synthetic-data notice is present on every page. Solve time and service date sit beside the plan.
- **Errors:** every error names the cause and the fix ("Check that the backend is running on port 8000, then load the seed data").

## Method

1. Screenshots at desktop (1400 px) and narrow (780 px) widths.
2. A pass over Nielsen's 10 heuristics, the Laws of UX checklist, and the Krug scanning checks.
3. Assignment colours validated with the dataviz CVD validator.

The motion on the story page was reviewed by scrubbing through it, not watched in real time, because the review browser pane throttles animation frames while hidden. A live run-through in a visible browser is still worth doing before the demo.

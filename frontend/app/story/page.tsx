"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { LogoMark } from "@/components/logo";
import "./story.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type A = "REVENUE" | "STANDBY" | "IBL";
// Illustrative animation only: no data is shown here. Train numbers and positions are made up for the walkthrough.
const TRAINS: { id: string; line: number; pos: number; a: A }[] = [
  { id: "TS-22", line: 0, pos: 0, a: "REVENUE" }, { id: "TS-07", line: 0, pos: 1, a: "REVENUE" },
  { id: "TS-15", line: 0, pos: 2, a: "IBL" }, { id: "TS-24", line: 0, pos: 3, a: "REVENUE" },
  { id: "TS-12", line: 1, pos: 0, a: "REVENUE" }, { id: "TS-20", line: 1, pos: 1, a: "STANDBY" },
  { id: "TS-11", line: 1, pos: 2, a: "REVENUE" }, { id: "TS-18", line: 1, pos: 3, a: "IBL" },
  { id: "TS-09", line: 2, pos: 0, a: "REVENUE" }, { id: "TS-03", line: 2, pos: 1, a: "REVENUE" },
  { id: "TS-04", line: 2, pos: 2, a: "STANDBY" }, { id: "TS-06", line: 2, pos: 3, a: "REVENUE" },
];
const FACE: Record<A, string> = { REVENUE: "#2a9fc6", STANDBY: "#bc8422", IBL: "#da5670" };
const LINE_Y = [70, 170, 270];
const POS_X = [80, 290, 500, 710];

const INPUTS = [
  ["Fitness certificates", "Rolling-Stock, Signalling, Telecom. Expired means the train cannot run."],
  ["Maximo job cards", "An open critical work order keeps the train in the inspection bay."],
  ["Cleaning slots", "Crews and bays are limited each night."],
  ["Branding exposure", "Wrapped trains owe advertisers their hours."],
  ["Mileage balance", "Even out bogie, brake and HVAC wear across the fleet."],
  ["Stabling geometry", "Fewer shunting moves before morning turn-out."],
];

const CAPTIONS = [
  "21:00. Twenty-five trainsets are stabled at the depot.",
  "Each one is checked against six inputs.",
  "Unfit trains go to the inspection bay line.",
  "The rest are ranked for revenue service or standby.",
  "By 05:30 the first train leaves with a clear exit path.",
];

export default function Story() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Hero: logo mark assembles, headline rises.
        gsap.from(".hero-line", { yPercent: 110, duration: 1, ease: "power4.out", stagger: 0.08 });
        gsap.from(".hero-sub", { opacity: 0, y: 16, duration: 0.8, delay: 0.4, ease: "power2.out" });

        // Depot scene: pinned, scrubbed timeline.
        const tl = gsap.timeline({
          scrollTrigger: { trigger: ".depot", start: "top top", end: "+=3200", scrub: 1, pin: true },
          defaults: { ease: "power2.inOut" },
        });
        tl.fromTo(".floor", { rotateX: 0, rotateZ: 0, scale: 0.7, y: 120 }, { rotateX: 58, rotateZ: -32, scale: 1, y: 0, duration: 1.2 }, 0)
          .to(".cap-0", { opacity: 1, duration: 0.3 }, 0.2)
          .from(".train", { z: 420, opacity: 0, stagger: 0.06, duration: 0.8, ease: "power3.out" }, 0.3)
          .to(".cap-0", { opacity: 0, duration: 0.3 }, 1.6)
          .to(".cap-1", { opacity: 1, duration: 0.3 }, 1.7)
          .fromTo(".scan", { x: -60, opacity: 0 }, { x: 900, opacity: 1, duration: 1.2, ease: "none" }, 1.8)
          .to(".scan", { opacity: 0, duration: 0.2 }, 3.0)
          .to(".cap-1", { opacity: 0, duration: 0.3 }, 3.0)
          .to(".cap-2", { opacity: 1, duration: 0.3 }, 3.1)
          .to(".t-IBL .face-top", { backgroundColor: FACE.IBL, color: "#fff", duration: 0.4 }, 3.2)
          .to(".t-IBL", { y: (i, el) => 395 - Number((el as HTMLElement).dataset.y), x: (i, el) => 260 + i * 220 - parseFloat((el as HTMLElement).style.left), duration: 1, stagger: 0.1 }, 3.5)
          .to(".cap-2", { opacity: 0, duration: 0.3 }, 4.6)
          .to(".cap-3", { opacity: 1, duration: 0.3 }, 4.7)
          .to(".t-REVENUE .face-top", { backgroundColor: FACE.REVENUE, color: "#fff", duration: 0.5, stagger: 0.04 }, 4.8)
          .to(".t-STANDBY .face-top", { backgroundColor: FACE.STANDBY, color: "#fff", duration: 0.5 }, 5.0)
          .to(".cap-3", { opacity: 0, duration: 0.3 }, 6.0)
          .to(".cap-4", { opacity: 1, duration: 0.3 }, 6.1)
          .to(".lead", { x: -900, duration: 1.4, ease: "power2.in" }, 6.2)
          .to(".floor", { rotateZ: -24, scale: 1.08, duration: 1.4 }, 6.2);

        // Six inputs: a 3D carousel that turns with scroll.
        // Cards fade as they turn away, so none is ever seen edge-on or from behind.
        const cards = gsap.utils.toArray<HTMLElement>(".ring-card");
        const ring = { r: 0 };
        const face = () =>
          cards.forEach((c, i) => {
            const a = (((i * 60 + ring.r) % 360) + 360) % 360;
            const facing = Math.cos((a * Math.PI) / 180);
            c.style.opacity = String(Math.max(0, facing) ** 1.5);
          });
        face();
        gsap.to(ring, {
          r: -300,
          ease: "none",
          onUpdate: () => {
            gsap.set(".ring", { rotateY: ring.r });
            face();
          },
          scrollTrigger: { trigger: ".inputs", start: "top top", end: "+=1800", scrub: 1, pin: true },
        });

        // Proof numbers count in as they enter.
        gsap.utils.toArray<HTMLElement>(".stat").forEach((el) => {
          gsap.from(el, { y: 40, opacity: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } });
        });
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="story" id="main">
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-4 md:px-10">
        <Link href="/" className="flex items-center gap-2.5 font-condensed text-xl font-bold">
          <LogoMark size={28} /> MetroSched
        </Link>
        <Link href="/" className="pressable rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Open tonight&apos;s plan
        </Link>
      </header>

      {/* Hero */}
      <section className="flex min-h-screen flex-col justify-center px-5 md:px-16">
        <p className="hero-sub mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-standby/40 bg-standby/10 px-3 py-1 text-sm text-standby-ink">
          CSE 471 project · illustrative walkthrough · the dashboard uses real MetroPT-3 data
        </p>
        <h1 className="display font-condensed text-[clamp(3.5rem,11vw,10rem)] font-bold uppercase">
          <span className="block overflow-hidden"><span className="hero-line block">Every train,</span></span>
          <span className="block overflow-hidden"><span className="hero-line block text-primary">a reason.</span></span>
        </h1>
        <p className="hero-sub mt-6 max-w-xl text-lg text-muted-foreground">
          MetroSched plans the nightly induction for a metro depot: which trainsets run tomorrow, which wait on standby, and which go for
          inspection. Every decision comes with the rule that made it.
        </p>
        <p className="hero-sub mt-16 text-sm text-muted-foreground">Scroll to watch one night at the depot ↓</p>
      </section>

      {/* Pinned 3D depot */}
      <section className="depot relative flex h-screen items-center justify-center overflow-hidden">
        <div className="stage flex h-full w-full items-center justify-center">
          <div className="floor-fit">
          <div className="floor">
            {LINE_Y.map((y, i) => (
              <div key={y} className="rail" style={{ top: y }}>
                <span className="bay-label" style={{ left: -4, top: -24 }}>LINE {i + 1}</span>
              </div>
            ))}
            <span className="bay-label" style={{ left: 30, top: 372 }}>INSPECTION BAY LINE</span>
            <span className="bay-label" style={{ left: -70, top: 74, color: "var(--primary)" }}>◀ EXIT</span>
            <div className="scan absolute top-0 h-full w-1.5 rounded-full bg-primary/70 blur-[2px]" />
            {TRAINS.map((t) => (
              <div
                key={t.id}
                data-y={LINE_Y[t.line]}
                className={`train t-${t.a} ${t.id === "TS-22" ? "lead" : ""}`}
                style={{ left: POS_X[t.pos], top: LINE_Y[t.line] }}
              >
                <div className="face-front" />
                <div className="face-side" />
                <div className="face-top">{t.id}</div>
              </div>
            ))}
          </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-16 px-6 text-center">
          {CAPTIONS.map((c, i) => (
            <p key={c} className={`cap-${i} absolute inset-x-6 text-balance font-condensed text-2xl font-semibold opacity-0 md:text-4xl`}>
              {c}
            </p>
          ))}
        </div>
        <ul className="absolute right-6 top-24 hidden flex-col gap-2 text-sm md:flex" aria-label="Legend">
          {(Object.keys(FACE) as A[]).map((a) => (
            <li key={a} className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm" style={{ background: FACE[a] }} />
              {a === "IBL" ? "IBL / maintenance" : a[0] + a.slice(1).toLowerCase()}
            </li>
          ))}
        </ul>
      </section>

      {/* Six inputs carousel */}
      <section className="inputs flex h-screen flex-col items-center justify-center gap-16 overflow-hidden px-5">
        <h2 className="display text-center font-condensed text-5xl font-bold md:text-6xl">Six inputs, one decision per train</h2>
        <div className="stage">
          <div className="ring">
            {INPUTS.map(([h, d], i) => (
              <div key={h} className="ring-card" style={{ transform: `rotateY(${i * 60}deg) translateZ(330px)` }}>
                <span className="font-condensed text-sm text-primary">{i < 3 ? "Hard rule" : "Soft goal"}</span>
                <h3 className="font-condensed text-2xl font-bold">{h}</h3>
                <p className="text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof */}
      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-32 md:grid-cols-3">
        {[
          ["0.03 s", "to plan 40 trains across 2 depots"],
          ["0", "hard-rule violations in the seeded plan"],
          ["25 / 25", "trains with plain-language reasons"],
        ].map(([n, l]) => (
          <div key={n} className="stat rounded-2xl border bg-card p-8">
            <p className="display font-condensed text-7xl font-bold text-primary">{n}</p>
            <p className="mt-3 text-muted-foreground">{l}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col items-center gap-6 px-5 pb-40 text-center">
        <LogoMark size={64} />
        <h2 className="display font-condensed text-5xl font-bold md:text-7xl">Plan tonight&apos;s induction</h2>
        <Link href="/" className="pressable rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">
          Open tonight&apos;s plan
        </Link>
        <p className="max-w-md text-sm text-muted-foreground">
          This page is an illustrative animation. The dashboard runs on real MetroPT-3 compressor data (CC BY 4.0); see docs/ASSUMPTIONS.md.
        </p>
      </section>
    </div>
  );
}

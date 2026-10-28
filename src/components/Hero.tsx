"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { TICKER_ITEMS } from "../data";
import { TransitionLink } from "./PageTransition";
import { PixelHero } from "./pixel";
import { Ticker } from "./Ticker";

gsap.registerPlugin(useGSAP);

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Hero() {
  const rootRef = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      if (reducedMotion()) return;
      /* ambient loops: stepped cuts, compositor-only transforms */
      gsap.to(".hero-sprite", {
        y: -8,
        duration: 0.45,
        ease: "steps(1)",
        repeat: -1,
        yoyo: true,
      });
      gsap.to(".hero-cue", {
        y: 10,
        duration: 0.4,
        ease: "steps(1)",
        repeat: -1,
        yoyo: true,
      });
      /* entrance: labeled timeline, staggered hard-cut pops (no easing) */
      const tl = gsap.timeline({ defaults: { ease: "steps(1)", duration: 0.01 } });
      tl.addLabel("badge", 0);
      tl.from(".hero-badge", { autoAlpha: 0 }, "badge");
      tl.addLabel("title", "+=0.15");
      tl.from(".hero-title", { autoAlpha: 0 }, "title");
      tl.from(".hero-sub", { autoAlpha: 0 }, "title+=0.15");
      tl.from(".hero-panel", { autoAlpha: 0 }, "title+=0.3");
      tl.from(".hero-cta", { autoAlpha: 0, stagger: 0.1 }, "title+=0.45");
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} id="hero" aria-label="Intro" className="dotgrid scroll-mt-20 border-b-4 border-ink">
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-6xl flex-col items-center justify-center px-4 py-14 text-center">
        <p className="hero-badge border-4 border-neon bg-abyss px-3 py-2 font-pixel text-[10px] text-neon">
          ★ NEW GAME — PLAYER 1 ★
        </p>
        <h1 className="hero-title mt-6 max-w-4xl font-pixel text-xl leading-relaxed sm:text-3xl sm:leading-relaxed">
          I AM <span className="text-neon">ADARSHA KARKI</span>, FULL STACK DEVELOPER
        </h1>
        <p className="hero-sub mt-4 max-w-2xl font-vt text-2xl text-muted">
          I BUILD WEB WORLDS: REACT UP FRONT, PYTHON IN THE DUNGEON, POSTGRESQL GUARDING THE LOOT.
        </p>
        <div className="hero-panel dotgrid-green mt-8 border-4 border-ink bg-panel p-8 shadow-[8px_8px_0_#f4f4f4]">
          <div className="hero-sprite will-change-transform">
            <PixelHero />
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <TransitionLink
            href="/techstack"
            className="hero-cta border-4 border-ink bg-neon px-5 py-3 font-pixel text-xs text-abyss shadow-[4px_4px_0_#f4f4f4] hover:translate-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#f4f4f4] active:translate-[4px] active:translate-y-[4px] active:shadow-none"
          >
            PRESS START ▸
          </TransitionLink>
          <TransitionLink
            href="/contact"
            className="hero-cta border-4 border-ink bg-panel px-5 py-3 font-pixel text-xs hover:bg-panel2"
          >
            SAVE POINT
          </TransitionLink>
        </div>
        <p aria-hidden="true" className="hero-cue mt-10 font-pixel text-lg text-yellow">
          ▼
        </p>
        <span className="sr-only">Scroll down to continue</span>
      </div>

      <Ticker items={TICKER_ITEMS} />
    </section>
  );
}

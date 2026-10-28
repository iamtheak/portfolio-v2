"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { INTRO_LINES } from "../data";
import { usePageNav } from "./PageTransition";
import { PixelFace, PixelHero } from "./pixel";

gsap.registerPlugin(useGSAP);

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const SEEN_KEY = "ak-intro-seen";

/* sessionStorage can throw (private mode, blocked cookies) — never crash */
function hasSeenIntro(): boolean {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markIntroSeen(): void {
  try {
    window.sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* ignore — intro just replays next visit */
  }
}

/*
 * Intro policy (explicit): full boot + greeting plays ONCE per browser
 * session (sessionStorage). Same-session reloads get a fast boot and land
 * straight on the greeting. Dismissal plays the pixel wipe (cover, drop the
 * overlay mid-wipe, reveal) — never a fade.
 */
export function BootIntro({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"boot" | "talk" | "gone">("boot");
  /* Lazy init from sessionStorage — no setState-in-effect needed */
  const [fast] = useState(() => typeof window !== "undefined" && hasSeenIntro());
  const [line, setLine] = useState(0);
  const { wipeThrough } = usePageNav();
  const last = line === INTRO_LINES.length - 1;
  const rootRef = useRef<HTMLDivElement | null>(null);

  /* stepped sprite bob (GSAP) while the greeting is up */
  useGSAP(
    () => {
      if (phase !== "talk" || reducedMotion()) return;
      gsap.to(".intro-sprite", {
        y: -8,
        duration: 0.45,
        ease: "steps(1)",
        repeat: -1,
        yoyo: true,
      });
    },
    { dependencies: [phase], scope: rootRef },
  );

  /* stepped PRESS START pulse (GSAP) once the final line lands */
  useGSAP(
    () => {
      if (phase !== "talk" || !last || reducedMotion()) return;
      gsap.to(".press-cue", {
        y: -4,
        duration: 0.4,
        ease: "steps(1)",
        repeat: -1,
        yoyo: true,
      });
    },
    { dependencies: [phase, last], scope: rootRef },
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => setPhase("talk"), fast ? 350 : 1100);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = "";
    };
  }, [fast]);

  /* Dismissal plays the pixel wipe: cover, drop the overlay mid-wipe, reveal */
  const dismiss = useCallback(() => {
    markIntroSeen();
    document.body.style.overflow = "";
    window.scrollTo(0, 0);
    wipeThrough(() => {
      setPhase("gone");
      onDone();
    });
  }, [onDone, wipeThrough]);

  if (phase === "gone") return null;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Portfolio intro"
      className="fixed inset-0 z-50 flex items-center justify-center bg-abyss p-4"
    >
      <div className="scanlines pointer-events-none fixed inset-0" aria-hidden="true" />

      {phase === "boot" ? (
        <button
          type="button"
          onClick={() => setPhase("talk")}
          aria-label="Continue past loading screen"
          className="block w-full max-w-md border-4 border-ink bg-panel p-6 text-left shadow-[8px_8px_0_#f4f4f4]"
        >
          <p className="font-pixel text-xs text-yellow">LOADING PORTFOLIO.EXE</p>
          <div className="mt-4 h-8 border-4 border-ink bg-abyss p-1">
            <div className={`h-full bg-neon ${fast ? "animate-boot-fast" : "animate-boot"}`} />
          </div>
          <p className="mt-3 font-pixel text-[10px] text-muted">DO NOT POWER OFF...</p>
        </button>
      ) : (
        <div className="flex w-full max-w-2xl flex-col items-center">
          <div className="intro-sprite">
            <PixelHero />
          </div>
          <div className="mt-6 flex w-full border-4 border-ink bg-panel shadow-[8px_8px_0_#7efc64]">
            <div className="flex items-center border-r-4 border-ink bg-panel2 p-3">
              <PixelFace />
            </div>
            <div className="flex-1 p-4">
              <p className="font-pixel text-[10px] text-neon">??? — LVL 25 DEV</p>
              <p className="mt-2 min-h-14 font-vt text-2xl leading-snug" aria-live="polite">
                {INTRO_LINES[line]}
                <span className="animate-caret ml-1 inline-block h-5 w-3 bg-neon align-middle" />
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => dismiss()}
                  className="border-4 border-ink bg-panel px-3 py-2 font-pixel text-[10px] text-muted hover:bg-panel2 hover:text-ink"
                >
                  SKIP
                </button>
                <button
                  type="button"
                  disabled={line === 0}
                  onClick={() => setLine((l) => Math.max(0, l - 1))}
                  className="border-4 border-ink bg-panel px-3 py-2 font-pixel text-[10px] disabled:opacity-30 enabled:hover:bg-panel2"
                >
                  ◂ BACK
                </button>
                {!last ? (
                  <button
                    type="button"
                    onClick={() => setLine((l) => l + 1)}
                    className="border-4 border-ink bg-neon px-3 py-2 font-pixel text-[10px] text-abyss shadow-[4px_4px_0_#f4f4f4] hover:translate-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#f4f4f4]"
                  >
                    NEXT ▸
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={dismiss}
                    className="press-cue border-4 border-ink bg-neon px-4 py-2 font-pixel text-xs text-abyss shadow-[4px_4px_0_#f4f4f4] hover:translate-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#f4f4f4]"
                  >
                    PRESS START ▸
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DIALOG_LINES, SECTIONS } from "../data";
import { TransitionLink, usePageNav } from "./PageTransition";
import { useMusic } from "./Music";
import { PixelFace } from "./pixel";

function TypedLine({ text }: { text: string }) {
  const [shown, setShown] = useState(() =>
    typeof window === "undefined" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? text.length
      : 0,
  );

  /* Interval callback only — no synchronous setState in the effect body */
  useEffect(() => {
    if (shown >= text.length) return;
    const t = window.setInterval(() => {
      setShown((n) => {
        if (n >= text.length) {
          window.clearInterval(t);
          return n;
        }
        return n + 1;
      });
    }, 14);
    return () => window.clearInterval(t);
  }, [text, shown]);

  return (
    <p aria-live="polite" className="truncate font-vt text-xl leading-tight sm:whitespace-normal">
      {text.slice(0, shown)}
      <span className="animate-caret ml-1 inline-block h-4 w-2 bg-neon align-middle" />
    </p>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { enabled, toggle } = useMusic();
  return (
    <header className="sticky top-0 z-40 border-b-4 border-ink bg-panel">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:border-4 focus:border-neon focus:bg-abyss focus:p-2 focus:font-pixel focus:text-xs"
      >
        SKIP TO CONTENT
      </a>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 p-3">
        <TransitionLink
          href="/"
          className="font-pixel text-sm text-neon"
          aria-label="Adarsha Karki home"
        >
          AK<span className="text-ink">.DEV</span>
        </TransitionLink>
        <nav aria-label="Sections" className="hidden items-center gap-1 sm:flex">
          {SECTIONS.map((s) => (
            <TransitionLink
              key={s.href}
              href={s.href}
              aria-current={pathname === s.href ? "page" : undefined}
              className={`border-4 px-2 py-1 font-pixel text-[10px] hover:border-ink hover:bg-panel2 ${
                pathname === s.href
                  ? "border-neon bg-panel2 text-neon"
                  : "border-transparent text-ink"
              }`}
            >
              {s.label}
            </TransitionLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={enabled}
          aria-label={enabled ? "Turn music off" : "Turn music on"}
          title={enabled ? "MUSIC ON — CLICK TO MUTE" : "MUSIC OFF — CLICK TO PLAY"}
          className={`border-4 border-ink px-3 py-2 font-pixel text-[10px] ${
            enabled ? "bg-neon text-abyss" : "bg-panel2 text-muted"
          }`}
        >
          {enabled ? "♪ ON" : "♪ OFF"}
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
          className="border-4 border-ink bg-panel2 px-3 py-2 font-pixel text-[10px] sm:hidden"
        >
          {open ? "X CLOSE" : "☰ MENU"}
        </button>
      </div>
      {open && (
        <nav aria-label="Sections mobile" className="flex flex-col gap-1 border-t-4 border-ink p-3 sm:hidden">
          {SECTIONS.map((s) => (
            <TransitionLink
              key={s.href}
              href={s.href}
              onNavigate={() => setOpen(false)}
              className={`border-4 border-ink px-3 py-2 font-pixel text-[10px] hover:bg-neon hover:text-abyss ${
                pathname === s.href ? "bg-neon text-abyss" : "bg-panel2"
              }`}
            >
              ▸ {s.label}
            </TransitionLink>
          ))}
        </nav>
      )}
    </header>
  );
}

export function Guide({ started }: { started: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [barHidden, setBarHidden] = useState(false);
  const pathname = usePathname();
  const { navigate } = usePageNav();

  /* dialog line follows the current route instead of scroll position */
  const lineIndex = Math.max(
    0,
    SECTIONS.findIndex((s) => s.href === pathname),
  );

  if (!started) return null;

  const go = (dir: 1 | -1) => {
    const next = Math.min(SECTIONS.length - 1, Math.max(0, lineIndex + dir));
    navigate(SECTIONS[next].href);
  };

  return (
    <>
      {/* guide sprite: fixed bottom-left, opens game menu */}
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        aria-label="Open navigation menu"
        className="fixed bottom-36 left-3 z-40 hidden border-4 border-ink bg-panel2 p-2 shadow-[4px_4px_0_#f4f4f4] hover:bg-neon lg:block"
      >
        <PixelFace />
      </button>

      {menuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Where to, player?"
          className="fixed inset-0 z-50 flex items-center justify-center bg-abyss/80 p-4"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="w-full max-w-sm border-4 border-ink bg-panel p-5 shadow-[8px_8px_0_#7efc64]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-pixel text-xs text-yellow">WHERE TO, PLAYER?</p>
            <div className="mt-4 flex flex-col gap-2">
              {SECTIONS.map((s) => (
                <TransitionLink
                  key={s.href}
                  href={s.href}
                  onNavigate={() => setMenuOpen(false)}
                  className="border-4 border-ink bg-panel2 px-3 py-2 text-left font-pixel text-[10px] hover:bg-neon hover:text-abyss"
                >
                  ▸ {s.label}
                </TransitionLink>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="mt-4 w-full border-4 border-ink bg-abyss px-3 py-2 font-pixel text-[10px] text-muted hover:text-ink"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* dialog bar */}
      {!barHidden ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t-4 border-ink bg-panel">
          <div className="mx-auto flex max-w-6xl items-stretch gap-0">
            <div className="hidden items-center border-r-4 border-ink bg-panel2 px-3 lg:flex">
              <PixelFace />
            </div>
            <div className="min-w-0 flex-1 p-3">
              <TypedLine key={lineIndex} text={DIALOG_LINES[lineIndex].text} />
              <div className="mt-1 flex items-center justify-end gap-2">
                <span className="mr-auto hidden font-pixel text-[9px] text-muted sm:inline">
                  {lineIndex + 1}/{DIALOG_LINES.length} — {DIALOG_LINES[lineIndex].section.toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={() => setBarHidden(true)}
                  className="border-4 border-ink bg-panel px-2 py-1 font-pixel text-[9px] text-muted hover:text-ink"
                >
                  SKIP
                </button>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="border-4 border-ink bg-panel px-2 py-1 font-pixel text-[9px] hover:bg-panel2"
                >
                  ◂ BACK
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="border-4 border-ink bg-neon px-2 py-1 font-pixel text-[9px] text-abyss"
                >
                  NEXT ▸
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setBarHidden(false)}
          className="fixed bottom-3 right-3 z-40 border-4 border-ink bg-panel2 px-2 py-1 font-pixel text-[9px] hover:bg-neon hover:text-abyss"
        >
          SHOW LOG
        </button>
      )}
    </>
  );
}

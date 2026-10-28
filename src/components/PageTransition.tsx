"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";
import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

const COLS = 12;
const ROWS = 8;
const COUNT = COLS * ROWS;
const SWEEP_MS = 400;
/* sweep duration + buffer before swapping the route / releasing the overlay */
const COVER_MS = SWEEP_MS + 150;
const REVEAL_MS = SWEEP_MS + 150;

type Phase = "idle" | "cover" | "reveal";

const NavContext = createContext<{
  navigate: (href: string) => void;
  wipeThrough: (action: () => void) => void;
}>({
  navigate: () => {},
  wipeThrough: (action) => action(),
});

export function usePageNav() {
  return useContext(NavContext);
}

/* Link that plays the pixel wipe instead of a hard Next.js swap */
export function TransitionLink({
  href,
  onNavigate,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  onNavigate?: () => void;
}) {
  const { navigate } = usePageNav();
  return (
    <a
      href={href}
      {...rest}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        onNavigate?.();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}

/* Full-screen page wipe.
   Pixel generation copies PixelTransition's gapless recipe: tiles are
   absolutely positioned in exact percentages (left/top/width/height) with a
   +1px overlap to swallow subpixel seams, and flip with hard stepped cuts —
   never scaled, which is what opened gaps in the previous grid version.
   Stagger order is shuffled like its `from: 'random'`. */
function shuffledOrder(count: number): number[] {
  const arr = Array.from({ length: count }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function WipeOverlay({ mode }: { mode: "cover" | "reveal" }) {
  /* random stagger order, fixed for the life of this overlay instance */
  const order = useMemo(() => shuffledOrder(COUNT), []);

  const cells = [];
  for (let i = 0; i < COUNT; i++) {
    const c = i % COLS;
    const r = Math.floor(i / COLS);
    const delay = (order[i] / COUNT) * SWEEP_MS;
    cells.push(
      <div
        key={i}
        className={`absolute ${
          (c + r) % 5 === 0 ? "bg-neon" : "bg-panel2"
        } ${mode === "cover" ? "animate-wipe-in" : "animate-wipe-out"}`}
        style={{
          left: `${(c * 100) / COLS}%`,
          top: `${(r * 100) / ROWS}%`,
          width: `calc(${100 / COLS}% + 1px)`,
          height: `calc(${100 / ROWS}% + 1px)`,
          animationDelay: `${delay}ms`,
        }}
      />,
    );
  }

  return (
    <div
      aria-hidden="true"
      /* reveal is fully transparent — never let it swallow input if delayed */
      className={`fixed inset-0 z-[70] ${mode === "cover" ? "bg-abyss" : "bg-transparent pointer-events-none"}`}
    >
      {cells}
    </div>
  );
}

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const target = useRef<string | null>(null);
  const busy = useRef(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const reducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* route-less wipe: cover, run the action mid-wipe, reveal (intro dismiss) */
  const wipeThrough = useCallback((action: () => void) => {
    if (busy.current) return;
    if (reducedMotion()) {
      action();
      return;
    }
    busy.current = true;
    setPhase("cover");
    timers.current.push(
      window.setTimeout(() => {
        action();
        setPhase("reveal");
        timers.current.push(
          window.setTimeout(() => {
            setPhase("idle");
            busy.current = false;
          }, REVEAL_MS),
        );
      }, COVER_MS),
    );
  }, []);

  const navigate = useCallback(
    (href: string) => {
      if (href === pathname || busy.current) return;
      if (reducedMotion()) {
        router.push(href);
        window.scrollTo(0, 0);
        return;
      }
      busy.current = true;
      target.current = href;
      setPhase("cover");
      timers.current.push(
        window.setTimeout(() => router.push(href), COVER_MS),
      );
    },
    [pathname, router],
  );

  /* arrival on the new route → play the reveal, then release */
  useEffect(() => {
    if (phase === "cover" && target.current && pathname === target.current) {
      window.scrollTo(0, 0);
      setPhase("reveal");
      timers.current.push(
        window.setTimeout(() => {
          setPhase("idle");
          target.current = null;
          busy.current = false;
        }, REVEAL_MS),
      );
    }
  }, [pathname, phase]);

  /* watchdog: a cover with no arrival (interrupted nav, back-button race)
     must never wedge the UI — force-release after 3s */
  useEffect(() => {
    if (phase !== "cover") return;
    const t = window.setTimeout(() => {
      target.current = null;
      busy.current = false;
      setPhase("idle");
    }, 3000);
    return () => window.clearTimeout(t);
  }, [phase]);

  return (
    <NavContext.Provider value={{ navigate, wipeThrough }}>
      {phase === "cover" && <WipeOverlay mode="cover" />}
      {phase === "reveal" && <WipeOverlay mode="reveal" />}
      {children}
    </NavContext.Provider>
  );
}

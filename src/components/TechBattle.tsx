"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { OPPONENTS, type Move } from "../data";
import { useMusic } from "./Music";
import PixelTransition from "./PixelTransition";

gsap.registerPlugin(useGSAP);

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const ACCENT_HEX = {
  neon: "#7efc64",
  blue: "#29adff",
  yellow: "#ffec27",
  pink: "#ff77a8",
} as const;

const BOSS_LOGOS: Record<string, string> = {
  react: "/logo/react.png",
  next: "/logo/nextjs.png",
  python: "/logo/python.png",
  postgres: "/logo/postgres.png",
};

function BossLogo({ id, name, defeated = false, className }: {
  id: string;
  name: string;
  defeated?: boolean;
  className: string;
}) {
  const spriteRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const sprite = spriteRef.current;
    if (!sprite || defeated) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const bob = gsap.to(sprite, {
        y: -8,
        duration: 0.48,
        ease: "steps(2)",
        repeat: -1,
        yoyo: true,
        paused: true,
      });
      let visible = false;
      const sync = () => {
        if (visible && !document.hidden) bob.play();
        else bob.pause();
      };
      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        sync();
      });
      observer.observe(sprite);
      document.addEventListener("visibilitychange", sync);
      return () => {
        observer.disconnect();
        document.removeEventListener("visibilitychange", sync);
      };
    });
    return () => media.revert();
  }, { scope: spriteRef, dependencies: [defeated], revertOnUpdate: true });

  return (
    <div ref={spriteRef} className={className}>
      <Image
        src={BOSS_LOGOS[id]}
        alt={`${name} boss`}
        width={1280}
        height={1280}
        sizes="128px"
        className={`h-full w-full object-contain ${defeated ? "opacity-40 grayscale" : ""}`}
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}

type Phase = "pick" | "fight";
type Result = "win" | "lose" | null;
type Hit = { damage: number; turn: number } | null;

function HitEffect({ hit, color, player = false }: { hit: Hit; color: string; player?: boolean }) {
  const effectRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!hit) return;
    const tl = gsap.timeline();
    tl.set(".damage-number", { autoAlpha: 1, y: 0 });
    if (!reducedMotion()) {
      tl.fromTo(".impact", { autoAlpha: 1, scale: 0.6 },
        { autoAlpha: 0, scale: 1.2, duration: 0.24, ease: "steps(3)" }, 0);
      tl.fromTo(".hit-pixel", { autoAlpha: 1, x: 0, y: 0 }, {
        x: (i) => [-24, 24, -20, 20][i],
        y: (i) => [-20, -20, 20, 20][i],
        autoAlpha: 0,
        duration: 0.32,
        ease: "steps(4)",
      }, 0);
      tl.to(".damage-number", { y: -18, duration: 0.5, ease: "steps(5)" }, 0);
    }
    tl.to(".damage-number", { autoAlpha: 0, duration: 0.16 }, 0.85);
  }, { scope: effectRef, dependencies: [hit], revertOnUpdate: true });

  return (
    <div ref={effectRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-10" style={{ color }}>
      <svg className="impact invisible absolute inset-0 h-full w-full opacity-0" viewBox="0 0 128 128" fill="none">
        <path d="M24 100L100 24M40 104L104 40" stroke="currentColor" strokeWidth="8" />
        <path d="M52 24V44H32M76 104V84H96" stroke="#f4f4f4" strokeWidth="4" />
      </svg>
      {[0, 1, 2, 3].map((pixel) => (
        <span key={pixel} className="hit-pixel invisible absolute left-1/2 top-1/2 h-2 w-2 bg-current opacity-0" />
      ))}
      <span className={`damage-number invisible absolute whitespace-nowrap border-2 border-current bg-abyss px-2 py-1 font-pixel text-[10px] opacity-0 sm:text-xs ${player ? "right-2 top-4" : "left-1/2 top-2 -translate-x-1/2"}`}>
        −{hit?.damage ?? 0} HP
      </span>
    </div>
  );
}

function roll(power: number) {
  const variance = 6;
  return Math.max(1, power + Math.floor(Math.random() * (variance * 2 + 1)) - variance);
}

function randomPick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function HpBar({ label, hp, max, color }: { label: string; hp: number; max: number; color: string }) {
  const pct = Math.max(0, Math.round((hp / max) * 100));
  const low = pct <= 25;
  return (
    <div>
      <div className="flex items-center justify-between font-pixel text-[10px]">
        <span>{label}</span>
        <span className={low ? "text-pink" : ""}>
          {Math.max(0, hp)}/{max}
        </span>
      </div>
      {/* stepped HP: no transition — width swaps in hard chunks */}
      <div
        role="progressbar"
        aria-label={`${label} HP`}
        aria-valuenow={Math.max(0, hp)}
        aria-valuemin={0}
        aria-valuemax={max}
        className="mt-1 h-6 border-4 border-ink bg-abyss p-0.5"
      >
        <div
          className="h-full"
          style={{ width: `${pct}%`, background: low ? "#ff77a8" : color }}
        />
      </div>
    </div>
  );
}

export function TechBattle() {
  const [phase, setPhase] = useState<Phase>("pick");
  const [index, setIndex] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(100);
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const [enemyHit, setEnemyHit] = useState<Hit>(null);
  const [playerHit, setPlayerHit] = useState<Hit>(null);
  const turnRef = useRef(0);
  const foeRef = useRef<HTMLDivElement | null>(null);
  const playerBarRef = useRef<HTMLDivElement | null>(null);
  const seqRef = useRef<gsap.core.Timeline | null>(null);
  const opp = OPPONENTS[index];
  const { setBossMode, playSound, stopSounds } = useMusic();

  /* boss theme while a fight runs; background theme everywhere else */
  useEffect(() => {
    setBossMode(phase === "fight");
    return () => setBossMode(false);
  }, [phase, setBossMode]);

  /* stray exchange timelines die with the component */
  useEffect(() => {
    return () => {
      seqRef.current?.kill();
      seqRef.current = null;
      stopSounds();
    };
  }, [stopSounds]);

  const startFight = () => {
    stopSounds();
    seqRef.current?.kill();
    seqRef.current = null;
    setPhase("fight");
    setPlayerHp(100);
    setEnemyHp(opp.hp);
    setEnemyHit(null);
    setPlayerHit(null);
    setResult(null);
    setBusy(false);
    setLog([`${opp.name} BLOCKS THE PATH!`, "CHOOSE YOUR ATTACK, PLAYER 1."]);
    document.getElementById("battle-arena")?.scrollIntoView({ block: "nearest" });
  };

  const pushLog = (line: string) =>
    setLog((prev) => [...prev.slice(-3), line]);

  /*
   * One labeled timeline per exchange: strike → damage → optional counter.
   * The timeline is killed on unmount and on every new attack, so its
   * state callbacks can never fire on a dead component. Reduced motion
   * keeps damage feedback visible without shakes or moving particles.
   */
  const attack = (move: Move) => {
    if (busy || result) return;
    seqRef.current?.kill();
    setBusy(true);

    const turn = ++turnRef.current;
    const dmg = Math.min(enemyHp, roll(move.power));
    const enemyAfter = enemyHp - dmg;
    const counter = randomPick(opp.enemyMoves);
    const taken = Math.min(playerHp, roll(counter.power));
    const playerAfter = Math.max(0, playerHp - (enemyAfter <= 0 ? 0 : taken));

    const applyStrike = () => {
      setEnemyHp(enemyAfter);
      setEnemyHit({ damage: dmg, turn });
      pushLog(`YOU USED ${move.name}! -${dmg} HP.`);
      if (enemyAfter <= 0) {
        playSound("bossDeath", "win");
        setResult("win");
        pushLog(`${opp.name} DEFEATED! FLAWLESS VICTORY.`);
      }
    };
    /* enemy counterattack — losing is purely cosmetic, no blockers */
    const applyCounter = () => {
      playSound("damage");
      setPlayerHp(playerAfter);
      setPlayerHit({ damage: taken, turn });
      if (playerAfter <= 0) {
        setResult("lose");
        pushLog(`${opp.name} USED ${counter.name}! -${taken} HP. YOU FAINTED... (NO WORRIES, TRY AGAIN.)`);
      } else {
        pushLog(`${opp.name} USED ${counter.name}! -${taken} HP.`);
      }
    };

    if (reducedMotion()) {
      applyStrike();
      if (enemyAfter > 0) applyCounter();
      setBusy(false);
      return;
    }

    const tl = gsap.timeline({
      defaults: { ease: "steps(1)" },
      onComplete: () => setBusy(false),
    });
    seqRef.current = tl;
    tl.addLabel("strike", 0);
    tl.to(foeRef.current, { x: 12, duration: 0.06 }, "strike");
    tl.to(foeRef.current, { x: 0, duration: 0.06 }, "strike+=0.06");
    tl.to(foeRef.current, { filter: "brightness(2)", duration: 0.06 }, "strike+=0.12");
    tl.to(foeRef.current, { filter: "brightness(1)", duration: 0.06 }, "strike+=0.18");
    tl.add(applyStrike, "strike+=0.12");
    if (enemyAfter > 0) {
      tl.addLabel("counter", "strike+=0.7");
      tl.to(playerBarRef.current, { x: -10, duration: 0.06 }, "counter");
      tl.to(playerBarRef.current, { x: 0, duration: 0.06 }, "counter+=0.06");
      tl.add(applyCounter, "counter+=0.12");
    }
  };

  const leaveFight = () => {
    stopSounds();
    seqRef.current?.kill();
    seqRef.current = null;
    setBusy(false);
    setEnemyHit(null);
    setPlayerHit(null);
    setPhase("pick");
  };

  const pick = (dir: 1 | -1) => {
    setIndex((i) => (i + dir + OPPONENTS.length) % OPPONENTS.length);
  };

  return (
    <section id="stack" aria-label="Tech stack boss battle" className="scroll-mt-20 border-b-4 border-ink bg-base">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <p className="font-pixel text-[10px] text-blue">LVL 02 — TECH STACK</p>
        <h2 className="mt-2 font-pixel text-lg sm:text-2xl">
          BOSS BATTLE<span className="text-neon">.</span>
        </h2>
        <p className="mt-3 max-w-3xl font-vt text-2xl text-muted">
          FOUR BOSSES GUARD THIS STACK. DEFEAT IS PURELY COSMETIC — NO GAME OVERS, NO BLOCKED
          SCROLLING. FIGHT FOR FUN.
        </p>

        {phase === "pick" ? (
          <div className="mt-8 border-4 border-ink bg-panel p-4 shadow-[8px_8px_0_#f4f4f4] sm:p-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => pick(-1)}
                aria-label="Previous opponent"
                className="shrink-0 border-4 border-ink bg-panel2 px-3 py-4 font-pixel text-sm hover:bg-neon hover:text-abyss"
              >
                ◂
              </button>
              <div className="flex min-w-0 flex-1 flex-col items-center gap-3 text-center">
                {/* hover/tap the card: pixel-wipe reveals the boss intel */}
                <PixelTransition
                  key={opp.id}
                  gridSize={8}
                  pixelColor={ACCENT_HEX[opp.accent]}
                  animationStepDuration={0.35}
                  className="shadow-[8px_8px_0_#f4f4f4]"
                  style={{ width: "100%", maxWidth: "22rem" }}
                  firstContent={
                    <div className="flex h-full flex-col items-center justify-center gap-3 bg-panel2 p-4">
                      <BossLogo key={opp.id} id={opp.id} name={opp.name} className="h-24 w-24" />
                      <p className="font-pixel text-sm">{opp.name}</p>
                      <p className="font-pixel text-[9px] text-muted">HOVER FOR INTEL</p>
                    </div>
                  }
                  secondContent={
                    <div className="flex h-full flex-col items-center justify-center gap-2 bg-abyss p-4">
                      <p className="font-pixel text-[10px] text-yellow">BOSS INTEL</p>
                      <p className="font-vt text-xl leading-snug">{opp.tagline}</p>
                      <p className="font-pixel text-[9px] text-muted">
                        WEAK TO: {opp.playerMoves[0].name}
                      </p>
                    </div>
                  }
                />
                <p className="font-pixel text-[10px] text-yellow">
                  {index + 1} / {OPPONENTS.length}
                </p>
                <button
                  type="button"
                  onClick={startFight}
                  className="border-4 border-ink bg-pink px-6 py-3 font-pixel text-xs text-abyss shadow-[4px_4px_0_#f4f4f4] hover:translate-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#f4f4f4]"
                >
                  ⚔ FIGHT!
                </button>
              </div>
              <button
                type="button"
                onClick={() => pick(1)}
                aria-label="Next opponent"
                className="shrink-0 border-4 border-ink bg-panel2 px-3 py-4 font-pixel text-sm hover:bg-neon hover:text-abyss"
              >
                ▸
              </button>
            </div>
          </div>
        ) : (
          <div
            id="battle-arena"
            className="mt-8 border-4 border-ink bg-panel p-4 shadow-[8px_8px_0_#29adff] sm:p-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div ref={playerBarRef} className="relative will-change-transform">
                <HpBar label="PLAYER 1" hp={playerHp} max={100} color="#7efc64" />
                <HitEffect hit={playerHit} color="#ff77a8" player />
              </div>
              <HpBar label={opp.name} hp={enemyHp} max={opp.hp} color="#29adff" />
            </div>

            <div className="mt-6 flex justify-center">
              <div ref={foeRef} className="relative will-change-transform">
                <BossLogo
                  key={opp.id}
                  id={opp.id}
                  name={opp.name}
                  defeated={result !== null}
                  className="h-32 w-32"
                />
                <HitEffect hit={enemyHit} color="#7efc64" />
              </div>
            </div>

            {result ? (
              <div className="mt-6 border-4 border-ink bg-abyss p-4 text-center">
                <p className={`font-pixel text-sm ${result === "win" ? "text-neon" : "text-pink"}`}>
                  {result === "win" ? "★ YOU WIN! LOOT: +1 SKILL ★" : "✖ YOU FAINTED! (COSMETIC ONLY)"}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={startFight}
                    className="border-4 border-ink bg-neon px-4 py-2 font-pixel text-[10px] text-abyss"
                  >
                    REMATCH
                  </button>
                  <button
                    type="button"
                    onClick={leaveFight}
                    className="border-4 border-ink bg-panel2 px-4 py-2 font-pixel text-[10px] hover:bg-ink hover:text-abyss"
                  >
                    NEW OPPONENT
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <p className="font-pixel text-[10px] text-yellow">CHOOSE ATTACK ▸</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {opp.playerMoves.map((m) => (
                    <button
                      key={m.name}
                      type="button"
                      disabled={busy}
                      onClick={() => attack(m)}
                      className="min-h-16 min-w-0 border-4 border-ink bg-panel2 px-2 py-2 text-left font-pixel text-[9px] leading-relaxed [overflow-wrap:anywhere] hover:bg-neon hover:text-abyss disabled:cursor-wait disabled:opacity-50 sm:px-3 sm:py-3 sm:text-[10px]"
                    >
                      ▸ {m.name}
                      <span className="mt-1 block text-muted">PWR {m.power}±6</span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={leaveFight}
                  className="mt-3 border-4 border-ink bg-abyss px-3 py-2 font-pixel text-[10px] text-muted hover:text-ink"
                >
                  RUN AWAY (BACK TO SELECT)
                </button>
              </div>
            )}

            <div aria-live="polite" className="mt-4 border-4 border-ink bg-abyss p-3">
              {log.map((line, i) => (
                <p key={`${i}-${line}`} className="font-vt text-xl leading-snug text-ink">
                  <span className="text-neon">&gt; </span>
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

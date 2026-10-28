"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PROJECTS } from "../data";

const ProjectTV = dynamic(() => import("./ProjectTV"), {
  ssr: false,
  loading: () => <div role="status" className="flex aspect-[6/5] items-center justify-center font-vt text-2xl text-neon">TUNING IN...</div>,
});

gsap.registerPlugin(useGSAP, ScrollTrigger);

/* Mobile pins the TV and current card together; desktop keeps the sticky TV. */
export function Projects() {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);
  const talesRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const relicRef = useRef<HTMLDivElement | null>(null);
  const taleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeRef = useRef(0);

  useGSAP(
    () => {
      ScrollTrigger.config({ ignoreMobileResize: true });
      const grid = gridRef.current;
      const tales = talesRef.current;
      const television = relicRef.current;
      const cards = taleRefs.current.filter((card): card is HTMLDivElement => card !== null);
      if (!grid || !tales || !television || !cards.length) return;

      const media = gsap.matchMedia();
      media.add({
        desktop: "(min-width: 1024px)",
        reducedMotion: "(prefers-reduced-motion: reduce)",
        all: "all",
      }, (context) => {
        const { desktop, reducedMotion } = context.conditions!;
        if (!desktop) {
          const selectQuest = (progress: number) => {
            const next = Math.min(cards.length - 1, Math.floor(progress * cards.length));
            if (activeRef.current !== next) {
              activeRef.current = next;
              setActive(next);
            }
          };
          ScrollTrigger.create({
            trigger: grid,
            pin: grid,
            start: "top 80px",
            end: () => `+=${cards.length * window.innerHeight}`,
            invalidateOnRefresh: true,
            onUpdate: (self) => selectQuest(self.progress),
            onRefresh: (self) => selectQuest(self.progress),
          });
          return;
        }
        const pinTop = 80;
        gsap.set(tales, { y: 0 });
        const moveList = gsap.quickSetter(tales, "y", "px");
        let step = 1;
        let hold = 0;
        let scrollTravel = 1;
        let offsets: number[] = [];
        let stops: number[] = [];
        const measureLayout = () => {
          step = Math.max(480, window.innerHeight * 0.7);
          hold = Math.max(160, window.innerHeight * 0.2);
          scrollTravel = (cards.length - 1) * step + hold * 2;
          const listTop = 0;
          // Reserve travel after the scene, never between the individual cards.
          const visibleHeight = Math.max(television.offsetHeight, listTop + cards[0].offsetHeight);
          gsap.set(grid, { minHeight: visibleHeight + scrollTravel + 64 });
          gsap.set(tales, { top: listTop });
          const first = cards[0].getBoundingClientRect();
          offsets = cards.map((card) => {
            const rect = card.getBoundingClientRect();
            return rect.top + rect.height / 2 - first.top - first.height / 2;
          });
          stops = cards.map((_, i) => (hold + i * step) / scrollTravel);
        };
        const stickyStart = () => Math.max(0, window.scrollY + grid.getBoundingClientRect().top - pinTop);
        measureLayout();
        const syncScene = (progress: number) => {
          const distance = progress * scrollTravel;
          const channel = gsap.utils.clamp(0, cards.length - 1, (distance - hold) / step);
          const from = Math.floor(channel);
          const to = Math.min(cards.length - 1, from + 1);
          const visualTravel = offsets[from] + (offsets[to] - offsets[from]) * (channel - from);
          // Counter the page scroll so compact cards move slowly through view.
          // Both endpoint holds keep the first/last card beside the television.
          moveList(distance - visualTravel);
          const nearest = Math.round(channel);
          if (activeRef.current !== nearest) {
            activeRef.current = nearest;
            setActive(nearest);
          }
        };
        ScrollTrigger.create({
          trigger: tales,
          start: stickyStart,
          end: () => stickyStart() + scrollTravel,
          invalidateOnRefresh: true,
          onRefreshInit: measureLayout,
          onRefresh: (self) => syncScene(self.progress),
          onUpdate: (self) => syncScene(self.progress),
          onEnter: (self) => syncScene(self.progress),
          onEnterBack: (self) => syncScene(self.progress),
          onLeave: () => syncScene(1),
          onLeaveBack: () => syncScene(0),
          snap: desktop && !reducedMotion ? {
            snapTo: (progress, self) => {
              // Interacting with a live site must not move the parent page.
              if (document.activeElement instanceof HTMLIFrameElement || !stops.length) return progress;
              const direction = self?.direction ?? 0;
              // At either end, let the user leave the scene in that direction.
              if ((direction < 0 && progress <= stops[0]) ||
                  (direction > 0 && progress >= stops[stops.length - 1])) return progress;
              return ScrollTrigger.snapDirectional(stops)(progress, direction);
            },
            inertia: false,
            directional: true,
            delay: 0.2,
            duration: { min: 0.12, max: 0.24 },
            ease: "none",
          } : undefined,
        });
      });

      let mounted = true;
      let refreshFrame = 0;
      const refresh = () => {
        if (!mounted || refreshFrame) return;
        refreshFrame = window.requestAnimationFrame(() => {
          refreshFrame = 0;
          if (mounted) ScrollTrigger.refresh();
        });
      };
      // Lazy 3D loading, text wrapping, and iframe/screenshot changes can resize
      // the TV after the first measurement. Coalesce those refreshes per frame.
      const observer = new ResizeObserver(refresh);
      observer.observe(television);
      observer.observe(tales);
      document.fonts.ready.then(refresh).catch(() => {});
      window.addEventListener("load", refresh);
      refresh();
      return () => {
        mounted = false;
        window.cancelAnimationFrame(refreshFrame);
        observer.disconnect();
        window.removeEventListener("load", refresh);
        media.revert();
      };
    },
    { scope: sectionRef },
  );

  const current = PROJECTS[active];

  return (
    <section
      id="quests"
      ref={sectionRef}
      aria-label="Projects"
      className="scroll-mt-20 border-b-4 border-ink bg-panel"
    >
      <div className="mx-auto max-w-6xl px-4 py-14">
        <p className="font-pixel text-[10px] text-pink">LVL 03 — SIDE QUESTS</p>
        <h2 className="mt-2 font-pixel text-[12px] lg:text-2xl">
          QUEST LOG<span className="text-neon">.</span>
        </h2>

        <div ref={gridRef} className="relative mx-auto mt-8 flex w-[90%] flex-col gap-3 lg:block lg:w-full">
          {/* Compact list; its scroll speed is independent of the card gaps. */}
          <div ref={talesRef} className="grid w-full lg:absolute lg:left-0 lg:top-0 lg:flex lg:w-[calc(50%-12px)] lg:flex-col lg:gap-4">
            {PROJECTS.map((p, i) => (
              <div
                key={p.no}
                className={`col-start-1 row-start-1 transition-[opacity,visibility] duration-200 motion-reduce:transition-none lg:visible lg:opacity-100 ${active === i ? "visible opacity-100" : "pointer-events-none invisible opacity-0 lg:pointer-events-auto"}`}
              >
                <div
                  ref={(el) => { taleRefs.current[i] = el; }}
                  className={`w-full border-4 bg-base p-3 lg:p-5 ${
                    active === i
                      ? "border-neon shadow-[8px_8px_0_#7efc64]"
                      : "border-ink shadow-[8px_8px_0_#f4f4f4]"
                  }`}
                >
                  <span
                    className={`inline-block border-4 border-ink px-2 py-1 font-pixel text-[10px] ${
                      active === i ? "bg-neon text-abyss" : "bg-panel2 text-muted"
                    }`}
                  >
                    QUEST {p.no}
                  </span>
                  <h3 className="mt-2 font-pixel text-[12px] leading-relaxed lg:mt-3 lg:text-sm">{p.title}</h3>
                  {p.description && <p className="mt-2 font-vt text-[10px] leading-snug text-muted lg:mt-3 lg:text-2xl">
                    {p.description}
                  </p>}
                  {p.tags.length > 0 && <div className="mt-4 flex flex-wrap gap-2">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="border-2 border-ink bg-panel2 px-2 py-1 font-pixel text-[9px] text-blue"
                      >
                        {t}
                      </span>
                    ))}
                  </div>}
                  {p.preview.type === "website" && (
                    <a href={p.preview.src} target="_blank" rel="noopener noreferrer"
                      className="mt-2 inline-block font-pixel lg:mt-4 text-[10px] text-blue underline underline-offset-4 focus-visible:outline-4 focus-visible:outline-neon">
                      OPEN WEBSITE
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Sticky moves the whole TV, canvas, and live iframe as one unit. */}
          <div className="order-first w-full lg:sticky lg:top-20 lg:z-10 lg:mr-0 lg:ml-auto lg:w-[calc(50%-12px)]">
            <div ref={relicRef} className="w-full">
              <div
                className="dotgrid border-4 border-ink bg-base p-2 lg:p-4 shadow-[8px_8px_0_#f4f4f4]"
              >
                <p className="font-pixel text-[10px] text-muted">RELIC {current.no}/0{PROJECTS.length}</p>
                <div className="mt-2">
                  <ProjectTV project={current} />
                </div>
                <p className="mt-2 text-center font-pixel text-[12px] lg:mt-4">{current.title}</p>
                <p className="mt-2 hidden text-center font-vt text-xl text-muted lg:block">
                  SCROLL THE LOG TO CHANGE CHANNELS
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

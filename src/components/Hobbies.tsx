"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Ticker } from "./Ticker";
import styles from "./Hobbies.module.css";

const HOBBIES = [
  { title: "GAMING", subtitle: "CASUAL GAMER. FPS AND SURVIVAL.", details: "Valorant, Minecraft, Friend Slop", image: "/gif/gaming.gif", face: styles.front, pitch: -20, yaw: -25 },
  { title: "MUSIC", subtitle: "AVID MUSIC LISTENER. R&B AND ROCK.", details: "The Weeknd, Tory Lanez, Pantera", image: "/gif/music.gif", face: styles.right, pitch: -20, yaw: -65 },
  { title: "LIFTING", subtitle: "AVERAGE LIFTER. CHRONIC SHOULDER PAIN.", details: "Push Pull Legs Rest U/L", image: "/gif/lift.gif", face: styles.top, pitch: -55, yaw: -40 },
];

// Fixed arithmetic positions keep the starfield stable without a render loop.
const STARS = Array.from({ length: 80 }, (_, i) => ({
  left: `${(i * 73.37 + 11) % 100}%`,
  top: `${(i * i * 13.71 + i * 23.3 + 7) % 100}%`,
  width: i % 13 === 0 ? 3 : 1,
  height: i % 13 === 0 ? 3 : 1,
  opacity: 0.25 + (i % 5) * 0.15,
}));

export function Hobbies() {
  const [selected, setSelected] = useState<string | null>(null);
  const cube = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);
  const view = useRef({ pitch: -30, yaw: -40 });
  const drag = useRef<{ x: number; y: number; pitch: number; yaw: number } | null>(null);

  function rotate(pitch: number, yaw: number) {
    // Stay in the front/right/top octant so no other cube faces can be exposed.
    view.current = { pitch: Math.max(-55, Math.min(-20, pitch)), yaw: Math.max(-65, Math.min(-25, yaw)) };
    if (cube.current) cube.current.style.transform = `rotateX(${view.current.pitch}deg) rotateY(${view.current.yaw}deg)`;
  }

  return (
    <section id="hearts" aria-label="Hobbies" className={`${styles.space} scroll-mt-20`}>
      <div className={styles.stars} aria-hidden="true">
        {STARS.map((star, index) => <span key={index} style={star} />)}
      </div>
      <h1 className="px-4 pt-10 text-center font-pixel text-xl text-neon sm:text-2xl" aria-live="polite">{selected ?? "HEARTS"}</h1>
      <p className="mx-auto mt-3 max-w-xl px-4 text-center font-vt text-xl text-ink sm:text-2xl" aria-live="polite">
        {HOBBIES.find((hobby) => hobby.title === selected)?.subtitle ?? "THREE THINGS THAT KEEP ME FULLY CHARGED."}
      </p>
      <div
        className={styles.stage}
        role="group"
        tabIndex={0}
        aria-label="Hobby cube. Select a face to bring it forward and change the title and banner. Drag or use arrow keys to rotate. Home resets the view."
        onPointerDown={(event) => {
          if (event.button !== 0 || !event.isPrimary) return;
          const target = (event.target as HTMLElement).closest("button") ?? event.currentTarget;
          target.focus({ preventScroll: true });
          target.setPointerCapture(event.pointerId);
          dragged.current = false;
          event.currentTarget.dataset.dragging = "true";
          drag.current = { x: event.clientX, y: event.clientY, ...view.current };
        }}
        onPointerMove={(event) => {
          if (!event.isPrimary || !drag.current) return;
          if (Math.hypot(event.clientX - drag.current.x, event.clientY - drag.current.y) > 6) dragged.current = true;
          if (!dragged.current) return;
          rotate(drag.current.pitch + (event.clientY - drag.current.y) * 0.25, drag.current.yaw + (event.clientX - drag.current.x) * 0.25);
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onLostPointerCapture={(event) => {
          drag.current = null;
          delete event.currentTarget.dataset.dragging;
        }}
        onKeyDown={(event) => {
          const { pitch, yaw } = view.current;
          switch (event.key) {
            case "ArrowLeft": rotate(pitch, yaw - 5); break;
            case "ArrowRight": rotate(pitch, yaw + 5); break;
            case "ArrowUp": rotate(pitch - 5, yaw); break;
            case "ArrowDown": rotate(pitch + 5, yaw); break;
            case "Home": rotate(-30, -40); break;
            default: return;
          }
          event.preventDefault();
        }}
      >
        <div className={styles.orbit}>
        <div ref={cube} className={styles.cube}>
          {HOBBIES.map((hobby) => (
            <button
              key={hobby.title}
              type="button"
              className={`${styles.face} ${hobby.face}`}
              aria-label={hobby.title}
              aria-pressed={selected === hobby.title}
              onClick={(event) => {
                if (event.detail !== 0 && dragged.current) return;
                setSelected(hobby.title);
                rotate(hobby.pitch, hobby.yaw);
              }}
            >
              <div className="relative m-3 flex-1">
                <Image src={hobby.image} alt="" fill unoptimized draggable={false} sizes="(max-width: 560px) 190px, 360px" className="object-contain [image-rendering:pixelated]" />
              </div>
              <span className="px-3 pb-3 text-center font-vt text-[clamp(12px,2vw,20px)] leading-snug">{hobby.details}</span>
            </button>
          ))}
        </div>
        </div>
      </div>
      <Ticker items={selected ? ["XO", "AK", selected] : ["XO", "AK"]} />
    </section>
  );
}

import Image from "next/image";

/* Real sprite art — 408x612 PNG, crisp pixels, no smoothing.
   Motion (idle bob etc.) is driven by GSAP at the call site, not here. */
export function PixelHero({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={className}>
      <Image
        src="/character.png"
        alt=""
        width={408}
        height={612}
        priority
        className="h-64 w-auto sm:h-72"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}

/* Mini portrait for dialog box + guide button: head crop of the sprite */
export function PixelFace({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`relative h-12 w-12 overflow-hidden border-2 border-abyss bg-abyss ${className}`}
    >
      <Image
        src="/character.png"
        alt=""
        fill
        sizes="48px"
        className="object-cover object-top"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}

const HEART_MAP = [
  ".XX.XX.",
  "XXXXXXX",
  "XXXXXXX",
  ".XXXXX.",
  "..XXX..",
  "...X...",
];

export function PixelHeart({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`grid grid-cols-7 gap-0 ${className}`}
      style={{ width: "fit-content" }}
    >
      {HEART_MAP.flatMap((row, y) =>
        row.split("").map((cell, x) => (
          <div
            key={`${x}-${y}`}
            className="h-3 w-3"
            style={{ background: cell === "X" ? "#ff77a8" : "transparent" }}
          />
        )),
      )}
    </div>
  );
}

const ACCENT_TEXT: Record<string, string> = {
  neon: "text-neon",
  blue: "text-blue",
  yellow: "text-yellow",
  pink: "text-pink",
};

const ACCENT_BORDER: Record<string, string> = {
  neon: "border-neon",
  blue: "border-blue",
  yellow: "border-yellow",
  pink: "border-pink",
};

export function Monogram({
  text,
  accent,
  className = "",
}: {
  text: string;
  accent: keyof typeof ACCENT_TEXT;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center border-4 bg-abyss font-pixel ${ACCENT_BORDER[accent]} ${ACCENT_TEXT[accent]} ${className}`}
    >
      {text}
    </div>
  );
}

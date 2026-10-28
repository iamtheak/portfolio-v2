export const SECTIONS = [
  { id: "hero", label: "START", href: "/" },
  { id: "stack", label: "BOSS BATTLE", href: "/techstack" },
  { id: "quests", label: "QUESTS", href: "/projects" },
  { id: "hearts", label: "HEARTS", href: "/hobbies" },
  { id: "contact", label: "CONTACT", href: "/contact" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

/* Narrator dialog lines. Auto-sync to the section in view. */
export const DIALOG_LINES: { section: SectionId; text: string }[] = [
  {
    section: "hero",
    text: "YO! I AM ADARSHA KARKI, FULL STACK DEVELOPER. PRESS START, NEW GAME BEGINS!",
  },
  {
    section: "stack",
    text: "PICK YOUR OPPONENT, CHALLENGER. FOUR BOSSES GUARD THIS STACK. CHOOSE WISELY, THEN FIGHT!",
  },
  {
    section: "quests",
    text: "SIDE QUESTS UNLOCKED! SCROLL SLOWLY, TRAVELLER. EACH TALE SWAPS THE RELIC ON THE RIGHT.",
  },
  {
    section: "hearts",
    text: "EVEN HEROES REST. I GAME, I BLAST TUNES, I LIFT HEAVY. THREE HEARTS, FULLY CHARGED.",
  },
  {
    section: "contact",
    text: "FINAL SAVE POINT! DROP YOUR NAME AND A MESSAGE. I REPLY FASTER THAN A SPEEDRUN.",
  },
];

export const INTRO_LINES = [
  "SYSTEM BOOT... PORTFOLIO.EXE LOADED.",
  "A WILD DEVELOPER APPEARS!",
  "I AM ADARSHA KARKI. I BUILD FULL STACK WORLDS.",
  "SCROLL, FIGHT BOSSES, TAKE MY HEARTS. READY?",
];

/* TODO: replace with your real links */
export const LINKS = {
  email: "hello@adarshakarki.dev",
  github: "https://github.com/",
  linkedin: "https://www.linkedin.com/",
};

export interface Move {
  name: string;
  power: number;
}

export interface Opponent {
  id: string;
  name: string;
  monogram: string;
  accent: "neon" | "blue" | "yellow" | "pink";
  tagline: string;
  hp: number;
  playerMoves: Move[];
  enemyMoves: Move[];
}

export const OPPONENTS: Opponent[] = [
  {
    id: "react",
    name: "REACT",
    monogram: "Re",
    accent: "blue",
    tagline: "THE COMPONENT HYDRA. EVERY HEAD RE-RENDERS.",
    hp: 100,
    playerMoves: [
      { name: "VIRTUAL DOM STRIKE", power: 22 },
      { name: "DEPENDENCY ARRAY SLAM", power: 26 },
      { name: "RE-RENDER BARRAGE", power: 18 },
      { name: "MAXIMUM DEPTH REACH", power: 30 },
    ],
    enemyMoves: [
      { name: "STALE CLOSURE", power: 14 },
      { name: "INFINITE LOOP", power: 20 },
      { name: "PROP DRILL SPIRAL", power: 16 },
    ],
  },
  {
    id: "next",
    name: "NEXT.JS",
    monogram: "Nx",
    accent: "neon",
    tagline: "THE SERVER SORCERER. RENDERS BEFORE YOU BLINK.",
    hp: 100,
    playerMoves: [
      { name: "SERVER-SIDE RENDER", power: 24 },
      { name: "STATIC REGEN PULSE", power: 20 },
      { name: "HYDRATION MISMATCH", power: 28 },
      { name: "EDGE SLASH", power: 18 },
    ],
    enemyMoves: [
      { name: "BUILD TIME QUAKE", power: 16 },
      { name: "CACHE INVALIDATION", power: 20 },
      { name: "MIDDLEWARE MAZE", power: 14 },
    ],
  },
  {
    id: "python",
    name: "PYTHON",
    monogram: "Py",
    accent: "yellow",
    tagline: "THE SERPENT SAGE. SLOW LOOK, FAST BITE.",
    hp: 100,
    playerMoves: [
      { name: "GIL LOCK", power: 22 },
      { name: "DUCK TYPING DODGE", power: 18 },
      { name: "LIST COMBO STORM", power: 24 },
      { name: "INDENTATION ERROR", power: 30 },
    ],
    enemyMoves: [
      { name: "RUNTIME FANG", power: 16 },
      { name: "RECURSION COIL", power: 20 },
      { name: "PIP DEPENDENCY HELL", power: 14 },
    ],
  },
  {
    id: "postgres",
    name: "POSTGRESQL",
    monogram: "PG",
    accent: "pink",
    tagline: "THE DATA GOLEM. EVERY ROW IS ARMOR.",
    hp: 100,
    playerMoves: [
      { name: "INDEX SMASH", power: 24 },
      { name: "FULL TABLE SCAN", power: 18 },
      { name: "DEADLOCK", power: 28 },
      { name: "VACUUM VORTEX", power: 20 },
    ],
    enemyMoves: [
      { name: "SEQUENTIAL SLAM", power: 16 },
      { name: "CONNECTION FLOOD", power: 20 },
      { name: "LOCK ESCALATION", power: 14 },
    ],
  },
];

export interface Project {
  no: string;
  title: string;
  description: string;
  tags: string[];
  visualLabel: string;
  accent: "neon" | "blue" | "yellow" | "pink";
}

export type ProjectPreview =
  | { type: "image"; src: string }
  | { type: "website"; src: string };

export interface PreviewProject extends Project {
  preview: ProjectPreview;
}

/* Use a website preview with a hosted URL for live, interactive projects. */
export const PROJECTS: PreviewProject[] = [
  {
    no: "07",
    title: "F1 CIRCUITS",
    description: "A 3D viewer for Formula 1 circuits.",
    tags: [],
    visualLabel: "F1 CIRCUITS",
    accent: "blue",
    preview: { type: "website", src: "https://circuits.adarshakarki709.com.np/" },
  },
  {
    no: "06",
    title: "SIX STORIES DEEP",
    description: "A personal blogging website.",
    tags: [],
    visualLabel: "SIX STORIES DEEP",
    accent: "yellow",
    preview: { type: "website", src: "https://sixstoriesdeep.com/" },
  },
  {
    no: "05",
    title: "THE WEEKND",
    description: "A tribute to The Weeknd featuring album covers animated with GSAP.",
    tags: [],
    visualLabel: "THE WEEKND",
    accent: "pink",
    preview: { type: "website", src: "https://weeknd.adarshakarki709.com.np/" },
  },
  {
    no: "04",
    title: "TRACKING",
    description: "A task tracking system with role-based access control (RBAC) and shareable links.",
    tags: [],
    visualLabel: "TRACKING",
    accent: "blue",
    preview: { type: "image", src: "/projects/tracking.png" },
  },
  {
    no: "03",
    title: "REPORTCARD",
    description: "Marksheet data entry with generation of polished report cards.",
    tags: [],
    visualLabel: "REPORTCARD",
    accent: "yellow",
    preview: { type: "image", src: "/projects/reportcard.png" },
  },
  {
    no: "02",
    title: "KEYCLOAK UI",
    description: "A custom UI for Keycloak built with Keycloakify.",
    tags: [],
    visualLabel: "KEYCLOAK",
    accent: "pink",
    preview: { type: "image", src: "/projects/keycloak.png" },
  },
  {
    no: "01",
    title: "CERTIFY",
    description: "Certificate generation from templates with bulk mailing and customizable emails.",
    tags: [],
    visualLabel: "CERTIFY",
    accent: "neon",
    preview: { type: "image", src: "/projects/certify.png" },
  },
];

export const TICKER_ITEMS = [
  "FULL STACK DEVELOPER",
  "REACT // NEXT.JS",
  "PYTHON // POSTGRESQL",
  "OPEN FOR QUESTS",
  "PLAYER 1 READY",
];

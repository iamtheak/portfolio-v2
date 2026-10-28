import type { Metadata } from "next";
import { TechBattle } from "../../components/TechBattle";

export const metadata: Metadata = {
  title: "Boss Battle — Adarsha Karki",
  description: "Pick an opponent and fight: React, Next.js, Python, PostgreSQL.",
};

export default function TechStackPage() {
  return <TechBattle />;
}

import type { Metadata } from "next";
import { Projects } from "../../components/Projects";

export const metadata: Metadata = {
  title: "Quest Log — Adarsha Karki",
  description: "Side quests: selected projects by Adarsha Karki.",
};

export default function ProjectsPage() {
  return <Projects />;
}

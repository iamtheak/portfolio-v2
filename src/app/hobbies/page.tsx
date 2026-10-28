import type { Metadata } from "next";
import { Hobbies } from "../../components/Hobbies";

export const metadata: Metadata = {
  title: "Heart Container — Adarsha Karki",
  description: "Off-duty buffs: gaming, music, lifting.",
};

export default function HobbiesPage() {
  return <Hobbies />;
}

import type { Metadata } from "next";
import { Contact } from "../../components/Contact";

export const metadata: Metadata = {
  title: "Save Point — Adarsha Karki",
  description: "Contact Adarsha Karki: drop a message at the save point.",
};

export default function ContactPage() {
  return <Contact />;
}

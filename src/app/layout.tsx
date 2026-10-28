import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "../components/SiteChrome";

const pixel = Press_Start_2P({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: "400",
});

const vt = VT323({
  variable: "--font-vt",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Adarsha Karki — Full Stack Developer",
  description:
    "Retro 8-bit portfolio of Adarsha Karki: boss-battle tech stack, quests (projects), hobbies and contact.",
  icons: {
    icon: [
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${pixel.variable} ${vt.variable} h-full`}>
      <body className="min-h-full bg-base text-ink antialiased">
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}

"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BootIntro } from "./BootIntro";
import { Guide, Header } from "./Chrome";
import { MusicProvider } from "./Music";
import { PageTransitionProvider } from "./PageTransition";

/* Persistent shell: intro plays once per session, chrome survives page wipes */
export function SiteChrome({ children }: { children: ReactNode }) {
  const [started, setStarted] = useState(false);
  const pathname = usePathname();

  return (
    <PageTransitionProvider>
      <MusicProvider>
        <BootIntro onDone={() => setStarted(true)} />
        {pathname !== "/projects" && (
          <div className="scanlines pointer-events-none fixed inset-0 z-30" aria-hidden="true" />
        )}
        <Header />
        <main id="main" className="pb-40">
          {children}
        </main>
        <Guide started={started} />
      </MusicProvider>
    </PageTransitionProvider>
  );
}

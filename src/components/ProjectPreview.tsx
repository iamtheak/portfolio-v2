"use client";

import Image from "next/image";
import type { PreviewProject } from "../data";

export function ProjectPreview({ project }: { project: PreviewProject }) {
  return project.preview.type === "image" ? (
    <Image
      src={project.preview.src}
      alt={`${project.title} project screenshot`}
      fill
      unoptimized
      sizes="(min-width: 1024px) 420px, 90vw"
      className="object-contain"
    />
  ) : (
    <iframe
      src={project.preview.src}
      title={`${project.title} live website`}
      loading="lazy"
      className="h-full w-full border-0 bg-white"
      allowFullScreen
    />
  );
}

export function ProjectFallback({ project }: { project: PreviewProject }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden border-4 border-ink bg-base">
      <ProjectPreview project={project} />
    </div>
  );
}

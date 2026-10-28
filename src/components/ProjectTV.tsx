"use client";

import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import { Box3, DoubleSide, Float32BufferAttribute, Group, Matrix4, Mesh, ShaderMaterial, Spherical, Vector3, type BufferGeometry } from "three";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import type { PreviewProject } from "../data";
import { ProjectFallback, ProjectPreview } from "./ProjectPreview";

const screenOrigin = () => [0, 0];
gsap.registerPlugin(useGSAP);

class TVBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function ViewControls({ src }: { src: string }) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const connected = useThree((state) => state.events.connected);
  useGSAP(() => {
    const orbit = controls.current;
    if (!orbit) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      orbit.reset();
      return;
    }
    const start = new Spherical().setFromVector3(orbit.position0.clone().sub(orbit.target0));
    const view = { azimuth: orbit.getAzimuthalAngle(), polar: orbit.getPolarAngle() };
    const difference = start.theta - view.azimuth;
    const transition = gsap.to(view, {
      azimuth: view.azimuth + Math.atan2(Math.sin(difference), Math.cos(difference)),
      polar: start.phi,
      duration: 0.65,
      ease: "power2.inOut",
      onComplete: () => orbit.reset(),
      onUpdate: () => {
        orbit.setAzimuthalAngle(view.azimuth);
        orbit.setPolarAngle(view.polar);
      },
    });
    const interrupt = () => { transition.kill(); };
    orbit.addEventListener("start", interrupt);
    return () => { orbit.removeEventListener("start", interrupt); };
  }, { dependencies: [src], revertOnUpdate: true });
  useEffect(() => {
    if (!(connected instanceof HTMLElement)) return;
    const rotate = (event: KeyboardEvent) => {
      if (event.target !== connected || !controls.current) return;
      const orbit = controls.current;
      switch (event.key) {
        case "ArrowLeft": orbit.setAzimuthalAngle(orbit.getAzimuthalAngle() - 0.15); break;
        case "ArrowRight": orbit.setAzimuthalAngle(orbit.getAzimuthalAngle() + 0.15); break;
        case "ArrowUp": orbit.setPolarAngle(orbit.getPolarAngle() - 0.15); break;
        case "ArrowDown": orbit.setPolarAngle(orbit.getPolarAngle() + 0.15); break;
        case "Home": orbit.reset(); break;
        default: return;
      }
      orbit.dispatchEvent({ type: "start", target: orbit });
      event.preventDefault();
    };
    connected.addEventListener("keydown", rotate);
    return () => connected.removeEventListener("keydown", rotate);
  }, [connected]);
  return <OrbitControls ref={controls} enablePan={false} enableZoom={false} enableDamping={false} minPolarAngle={0.5} maxPolarAngle={2.4} />;
}

function LiveScreen({ project, height, active }: { project: PreviewProject; height: number; active: boolean }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div hidden={!active} className="relative overflow-hidden bg-white" style={{ width: 960, height, borderRadius: "8% / 10%" }}>
      {!loaded && <p role="status" className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-base font-vt text-3xl text-neon">LOADING WEBSITE...</p>}
      <iframe
        src={project.preview.src}
        title={`${project.title} live website`}
        className="relative block h-full w-full border-0"
        onLoad={() => setLoaded(true)}
        allow="fullscreen"
        allowFullScreen
      />
    </div>
  );
}

function Television({ project }: { project: PreviewProject }) {
  const [visitedWebsites, setVisitedWebsites] = useState<PreviewProject[]>([]);
  // Retain iframe nodes so returning to a channel preserves its browsing state.
  if (project.preview.type === "website" && !visitedWebsites.some((visited) => visited.preview.src === project.preview.src)) {
    setVisitedWebsites([...visitedWebsites, project]);
  }
  const { scene } = useGLTF("/3d/old_tv%20(1).glb");
  const invalidate = useThree((state) => state.invalidate);
  const preview = useRef<HTMLDivElement>(null);
  const attachPreview = useCallback((element: HTMLDivElement | null) => {
    preview.current = element;
    invalidate();
  }, [invalidate]);
  const projection = useMemo(() => new Matrix4(), []);
  const viewport = useMemo(() => new Matrix4(), []);
  const television = useMemo(() => {
    const model = scene.clone(true);
    const geometries: BufferGeometry[] = [];
    const materials: ShaderMaterial[] = [];
    let screen: { mesh: Mesh; bounds: Box3; glass: BufferGeometry } | undefined;
    // Separate the glass triangles from the asset's single atlas mesh. The
    // project uses the glass's original curved geometry, with no overlay plane.
    const meshes: Mesh[] = [];
    model.traverse((object) => { if (object instanceof Mesh) meshes.push(object); });
    for (const mesh of meshes) {
      const original = mesh.geometry;
      const positions = original.getAttribute("position");
      const atlas = original.getAttribute("uv");
      const indices = original.index;
      if (!indices || !atlas) continue;
      const bodyIndices: number[] = [];
      const screenIndices: number[] = [];
      const bounds = new Box3();
      for (let i = 0; i < indices.count; i += 3) {
        const triangle = [indices.getX(i), indices.getX(i + 1), indices.getX(i + 2)];
        const isScreen = triangle.every((id) =>
          atlas.getX(id) > 0.46 && atlas.getX(id) < 0.8 &&
          atlas.getY(id) < 0.29 && positions.getY(id) < -28.5,
        );
        (isScreen ? screenIndices : bodyIndices).push(...triangle);
        if (isScreen) {
          for (const id of triangle) bounds.expandByPoint(new Vector3().fromBufferAttribute(positions, id));
        }
      }
      if (!screenIndices.length) throw new Error("TV screen geometry was not found");
      const body = original.clone();
      body.setIndex(bodyIndices);
      mesh.geometry = body;
      const glass = original.clone();
      glass.setIndex(screenIndices);
      const width = bounds.max.x - bounds.min.x;
      const height = bounds.max.z - bounds.min.z;
      const screenUV = new Float32Array(positions.count * 2);
      for (let i = 0; i < positions.count; i++) {
        screenUV[i * 2] = (positions.getX(i) - bounds.min.x) / width;
        screenUV[i * 2 + 1] = (positions.getZ(i) - bounds.min.z) / height;
      }
      glass.setAttribute("uv", new Float32BufferAttribute(screenUV, 2));
      geometries.push(body, glass);
      screen = { mesh, bounds, glass };

    }
    const size = new Box3().setFromObject(model).getSize(new Vector3());
    model.scale.setScalar(4.236 / size.x);
    const group = new Group();
    group.add(model);
    group.updateMatrixWorld(true);
    const center = new Box3().setFromObject(group).getCenter(new Vector3());
    model.position.sub(center);
    group.updateMatrixWorld(true);
    if (!screen) throw new Error("TV screen geometry was not found");
    // The live DOM viewport sits behind the bezel. Its WebGL depth mask uses
    // the actual curved glass, keeping the live site inside the screen opening.
    const { mesh, bounds, glass } = screen;
    const nativeCenter = bounds.getCenter(new Vector3());
    nativeCenter.y = bounds.max.y;
    const screenPosition = mesh.localToWorld(nativeCenter);
    const modelScale = mesh.getWorldScale(new Vector3()).x;
    const screenWidth = (bounds.max.x - bounds.min.x) * modelScale;
    const screenHeight = (bounds.max.z - bounds.min.z) * modelScale;
    const screenMask = glass.clone().applyMatrix4(mesh.matrixWorld);
    screenMask.translate(-screenPosition.x, -screenPosition.y, -screenPosition.z);
    geometries.push(screenMask);
    const screenMaterial = new ShaderMaterial({
      side: DoubleSide,
      vertexShader: "void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "void main() { gl_FragColor = vec4(0.0); }",
    });
    materials.push(screenMaterial);
    return { group, geometries, materials, screenPosition, screenWidth, screenHeight, screenMask, screenMaterial };
  }, [scene]);

  useEffect(() => { invalidate(); }, [invalidate, project, television]);

  useFrame(({ camera, size }) => {
    if (!preview.current) return;
    const { screenPosition, screenWidth, screenHeight } = television;
    camera.updateMatrixWorld();
    // Project CSS pixels through the same camera as the glass, including perspective.
    projection.makeScale(screenWidth / 960, -screenWidth / 960, 1);
    projection.setPosition(screenPosition.x - screenWidth / 2, screenPosition.y + screenHeight / 2, screenPosition.z);
    projection.premultiply(camera.matrixWorldInverse).premultiply(camera.projectionMatrix);
    projection.premultiply(viewport.set(
      size.width / 2, 0, 0, size.width / 2,
      0, -size.height / 2, 0, size.height / 2,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ));
    preview.current.style.transform = `matrix3d(${projection.elements.join(",")})`;
    preview.current.style.visibility = camera.position.z > screenPosition.z ? "visible" : "hidden";
  });

  useEffect(() => () => {
    television.geometries.forEach((geometry) => geometry.dispose());
    television.materials.forEach((material) => material.dispose());
  }, [television]);

  return (
    <>
      <primitive object={television.group} dispose={null} />
      <Html
        calculatePosition={screenOrigin}
        zIndexRange={[0, 0]}
        style={{ width: 0, height: 0, backfaceVisibility: "hidden" }}
      >
        <div ref={attachPreview} className="absolute overflow-hidden bg-[#101813]" style={{ width: 960, height: Math.round(960 * television.screenHeight / television.screenWidth), transformOrigin: "top left" }}>
          {project.preview.type === "image" && <ProjectPreview project={project} />}
          {visitedWebsites.map((website) => (
            <LiveScreen
              key={website.preview.src}
              project={website}
              active={project.preview.type === "website" && website.preview.src === project.preview.src}
              height={Math.round(960 * television.screenHeight / television.screenWidth)}
            />
          ))}
        </div>
      </Html>
        <mesh
          position={television.screenPosition}
          geometry={television.screenMask}
          material={television.screenMaterial}
          dispose={null}
        />
    </>
  );
}

export default function ProjectTV({ project }: { project: PreviewProject }) {
  const container = useRef<HTMLDivElement>(null);
  const fallback = <ProjectFallback project={project} />;
  return (
    <TVBoundary fallback={fallback}>
      <div ref={container} tabIndex={0} role="group" className="relative isolate aspect-[6/5] max-h-[42svh] lg:max-h-none w-full touch-pan-y cursor-grab overflow-hidden active:cursor-grabbing focus-visible:outline-4 focus-visible:outline-neon" aria-label={`Old TV displaying ${project.title}. Drag the bezel or use arrow keys to rotate. Home resets the view.`}>
        <Canvas
          style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none" }}
          camera={{ position: [1.7, 0.7, 7.3], fov: 36 }}
          eventSource={container}
          dpr={[1, 2]}
          frameloop="demand"
          fallback={fallback}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={1.5} />
          <directionalLight position={[2, 4, 5]} intensity={3} />
          <directionalLight position={[-4, 1, 2]} intensity={1} color="#b3c8ff" />
          <Suspense fallback={null}>
            <Television project={project} />
          </Suspense>
          <ViewControls src={project.preview.src} />
        </Canvas>
      </div>
      <p className="mt-1 text-center font-vt text-[10px] text-muted lg:mt-2 lg:text-lg">DRAG THE BEZEL TO ROTATE · ARROW KEYS WHEN FOCUSED</p>
    </TVBoundary>
  );
}

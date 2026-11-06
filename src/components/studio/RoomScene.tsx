"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { addAfterEffect, Canvas, useFrame, useThree } from "@react-three/fiber";
import { Outlines } from "@react-three/drei/core/Outlines";
import { useGLTF } from "@react-three/drei/core/Gltf";
import { Html } from "@react-three/drei/web/Html";
import { Color, Group, LineBasicMaterial, LineSegments, Material, Mesh, MeshBasicMaterial, MeshStandardMaterial, Vector3, type DirectionalLight, type OrthographicCamera } from "three";
import WorkstationScreen, { type ScreenPage, type ScreenProps } from "./WorkstationScreen";
import models from "./workstationModels.json";
import BakedContactShadow from "./BakedContactShadow";

export type SceneQuality = "normal" | "low";
type Props = { entered: boolean; reducedMotion: boolean; compact: boolean; active: boolean; quality: SceneQuality; skipReveal: boolean; onEnter: (page?: ScreenPage) => void; onReady: () => void; onModelsReady: () => void; onRevealDone: () => void; onUnavailable: () => void; screenProps: ScreenProps };
const COMPUTER: [number, number, number] = [-0.24, 0.76, -0.045];
const SCREEN = new Vector3(...models.screen.position as [number, number, number]).add(new Vector3(...COMPUTER));
const DARK = new Color("#14191d");
const EDGE = new Color("#95a2a8");
const REVEAL_EDGE = new Color("#e6e9e9");

type ModelPart = { name: string; mesh: boolean; geometry: Mesh["geometry"]; material: MeshStandardMaterial | MeshBasicMaterial | LineBasicMaterial; color: Color };
function ScreenSurface({ invalidate, screenProps }: { invalidate: () => void; screenProps: ScreenProps }) {
  // Html uses a separate React root; draw once after its DOM has actually mounted.
  useEffect(() => { invalidate(); }, [invalidate]);
  return <WorkstationScreen {...screenProps} />;
}
function useParts(scene: Group) {
  const parts = useMemo(() => {
    const result: ModelPart[] = [];
    scene.traverse(node => {
      if (!(node instanceof Mesh) && !(node instanceof LineSegments)) return;
      const source = (Array.isArray(node.material) ? node.material[0] : node.material) as ModelPart["material"];
      const material = source.clone();
      result.push({ name: node.name, mesh: node instanceof Mesh, geometry: node.geometry, material, color: source.color.clone() });
    });
    return result;
  }, [scene]);
  useEffect(() => () => { for (const part of parts) part.material.dispose(); }, [parts]);
  return parts;
}

function Asset({ parts, quality }: { parts: ModelPart[]; quality: SceneQuality }) {
  const group = useRef<Group>(null);
  useEffect(() => {
    const outlines: Material[] = [];
    group.current?.traverse(node => { if (node instanceof Mesh && node.material instanceof Material && node.material.type === "ShaderMaterial") outlines.push(node.material); });
    return () => { for (const material of outlines) material.dispose(); };
  }, [parts]);
  return <group ref={group}>{parts.map(part => part.mesh ? <mesh key={part.name} name={part.name} geometry={part.geometry} material={part.material} castShadow={part.name !== "glass" && part.name !== "window"} receiveShadow={part.name !== "glass" && part.name !== "window"} dispose={null}>
    {quality === "normal" && part.name !== "glass" && part.name !== "window" && <Outlines thickness={0.55} angle={0} color="#111920" opacity={0.75} transparent />}
  </mesh> : <lineSegments key={part.name} geometry={part.geometry} material={part.material} dispose={null} />)}</group>;
}

function Workstation({ quality, entered, compact, reducedMotion, skipReveal, onEnter, onModelsReady, onRevealDone, screenProps }: Props) {
  const urls = [models.assets.computer[quality].url, models.assets.chair[quality].url, models.assets.desk[quality].url, models.assets.tower[quality].url];
  const [computer, chair, desk, tower] = useGLTF(urls);
  const computerParts = useParts(computer.scene), chairParts = useParts(chair.scene), deskParts = useParts(desk.scene);
  const towerParts = useParts(tower.scene);
  const allParts = useMemo(() => [...computerParts, ...chairParts, ...deskParts, ...towerParts], [computerParts, chairParts, deskParts, towerParts]);
  const { invalidate, gl } = useThree();
  const reveal = useRef(0), completed = useRef(false);
  useEffect(() => { onModelsReady(); invalidate(); }, [onModelsReady, invalidate]);
  useEffect(() => { completed.current = false; gl.shadowMap.needsUpdate = true; invalidate(); }, [allParts, gl, invalidate]);
  useEffect(() => { invalidate(); }, [skipReveal, reducedMotion, entered, invalidate]);
  useFrame((_, delta) => {
    if (completed.current) return;
    reveal.current = skipReveal || reducedMotion || entered ? 1 : Math.min(1, reveal.current + Math.min(delta, 0.05) / 1.25);
    const t = reveal.current, shaded = t * t * (3 - 2 * t);
    for (const part of allParts) {
      if (part.mesh) part.material.color.lerpColors(DARK, part.color, shaded);
      else { part.material.color.lerpColors(REVEAL_EDGE, EDGE, shaded); part.material.opacity = 0.85 - shaded * 0.68; }
    }
    if (t === 1) { completed.current = true; onRevealDone(); } else invalidate();
  });
  return <group visible={!compact}>
    <Asset parts={deskParts} quality={quality} />
    <group position={COMPUTER} onClick={event => { event.stopPropagation(); if (!entered) onEnter(); }}>
      <Asset parts={computerParts} quality={quality} />
      <Html transform position={models.screen.position as [number, number, number]} distanceFactor={models.screen.distanceFactor} zIndexRange={[20, 10]} style={{ display: compact ? "none" : "block", pointerEvents: screenProps.interactive ? "auto" : "none" }}><ScreenSurface invalidate={invalidate} screenProps={screenProps} /></Html>
    </group>
    <group position={[0.56, 0.76, -0.03]}><Asset parts={towerParts} quality={quality} /></group>
    <group position={[0.59, 0, 0.7]} rotation={[0, Math.PI - 0.3, 0]}><Asset parts={chairParts} quality={quality} /></group>
    <BakedContactShadow resolution={quality === "low" ? 128 : 256} />
  </group>;
}

function StudioLighting({ quality }: { quality: SceneQuality }) {
  const key = useRef<DirectionalLight>(null);
  const { gl, invalidate } = useThree();
  useEffect(() => {
    const light = key.current;
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    invalidate();
    return () => { light?.shadow.dispose(); };
  }, [quality, gl, invalidate]);
  return <>
    <ambientLight intensity={0.18} />
    <hemisphereLight args={["#dbe7ed", "#30251d", 0.35]} />
    <directionalLight key={quality} ref={key} position={[-3, 4.5, 2]} intensity={5.5} color="#ffe0b2" castShadow shadow-mapSize-width={quality === "low" ? 256 : 512} shadow-mapSize-height={quality === "low" ? 256 : 512} shadow-camera-left={-2} shadow-camera-right={2} shadow-camera-top={2} shadow-camera-bottom={-2} shadow-camera-near={0.5} shadow-camera-far={12} shadow-bias={-0.00015} shadow-normalBias={0.003} />
    <directionalLight position={[2, 2.5, -2]} intensity={4.6} color="#a7d1f5" />
    <directionalLight position={[1, 1.5, 3]} intensity={0.65} color="#dce5ec" />
  </>;
}

function Camera({ entered, compact, reducedMotion, onReady }: Pick<Props, "entered" | "compact" | "reducedMotion" | "onReady">) {
  const { camera, size, invalidate } = useThree();
  const target = useRef(new Vector3(0, 0.66, 0.14));
  const motion = useRef({ elapsed: 0, running: true, position: new Vector3(), target: new Vector3(), zoom: 70 });
  const destination = useMemo(() => new Vector3(), []), desiredTarget = useMemo(() => new Vector3(), []);
  const close = entered && !compact;
  useEffect(() => {
    const state = motion.current; state.elapsed = 0; state.running = true; state.position.copy(camera.position); state.target.copy(target.current); state.zoom = (camera as OrthographicCamera).zoom; invalidate();
  }, [camera, close, reducedMotion, size.width, size.height, invalidate]);
  useFrame((_, delta) => {
    const state = motion.current;
    if (!state.running) return;
    const ortho = camera as OrthographicCamera;
    desiredTarget.copy(close ? SCREEN : new Vector3(0, 0.66, 0.17));
    destination.copy(close ? SCREEN.clone().add(new Vector3(0, 0, 3)) : new Vector3(2.3, 1.9, 3.2));
    const zoom = close ? Math.min(size.width * 0.9 / models.screen.width, Math.max(size.height - 220, 230) / models.screen.height) : Math.min(size.width / 2.65, Math.max(size.height - 240, 280) / 1.9);
    state.elapsed += Math.min(delta, 0.05);
    const t = reducedMotion ? 1 : Math.min(1, state.elapsed / 0.85), eased = t * t * (3 - 2 * t);
    camera.position.lerpVectors(state.position, destination, eased); target.current.lerpVectors(state.target, desiredTarget, eased); ortho.zoom = state.zoom + (zoom - state.zoom) * eased; ortho.updateProjectionMatrix(); camera.lookAt(target.current);
    if (t === 1) { state.running = false; onReady(); } else invalidate();
  });
  return null;
}

function SceneStats({ quality, onUnavailable }: { quality: SceneQuality; onUnavailable: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onUnavailable(); };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl, onUnavailable]);
  const frames = useRef(0), previous = useRef(0), intervals = useRef<number[]>([]), started = useRef(0), peak = useRef(0);
  useFrame(() => {
    const now = performance.now(); const interval = now - previous.current;
    if (interval > 0 && interval < 100) { intervals.current.push(interval); if (intervals.current.length > 120) intervals.current.shift(); }
    previous.current = now; started.current = now; frames.current++;
  }, -100);
  useEffect(() => addAfterEffect(() => {
    const host = gl.domElement.closest<HTMLElement>(".workstation");
    if (!host) return;
    peak.current = Math.max(peak.current, gl.info.render.triangles);
    const sorted = [...intervals.current].sort((a, b) => a - b);
    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
    host.dataset.sceneStats = JSON.stringify({ quality, frames: frames.current, calls: gl.info.render.calls, triangles: gl.info.render.triangles, peakTriangles: peak.current, geometries: gl.info.memory.geometries, textures: gl.info.memory.textures, programs: gl.info.programs?.length, p95FrameMs: Math.round((sorted[Math.floor(sorted.length * 0.95)] ?? 0) * 10) / 10, lastRenderMs: Math.round((performance.now() - started.current) * 10) / 10, heapBytes: memory?.usedJSHeapSize });
  }), [gl, quality]);
  return null;
}

export default function RoomScene(props: Props) {
  return <Canvas className="workstation-canvas" shadows="percentage" orthographic camera={{ position: [2.3, 1.9, 3.2], zoom: 170, near: 0.01, far: 30 }} dpr={props.quality === "low" ? 1 : [1, 1.5]} frameloop={props.active && !props.compact ? "demand" : "never"} gl={{ antialias: props.quality === "normal", alpha: true, powerPreference: "low-power" }} role="group" aria-label="An architectural workstation with a working portfolio computer. Use Enter workstation to sit down.">
    <StudioLighting quality={props.quality} />
    <Camera entered={props.entered} compact={props.compact} reducedMotion={props.reducedMotion} onReady={props.onReady} />
    <Suspense fallback={null}><Workstation {...props} /></Suspense>
    <SceneStats quality={props.quality} onUnavailable={props.onUnavailable} />
  </Canvas>;
}

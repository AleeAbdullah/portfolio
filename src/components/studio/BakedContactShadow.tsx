"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Mesh, MeshDepthMaterial, OrthographicCamera, PlaneGeometry, ShaderMaterial, WebGLRenderTarget } from "three";
import { HorizontalBlurShader } from "three/addons/shaders/HorizontalBlurShader.js";
import { VerticalBlurShader } from "three/addons/shaders/VerticalBlurShader.js";

export default function BakedContactShadow({ resolution }: { resolution: number }) {
  const { gl, scene } = useThree();
  const receiver = useRef<Mesh>(null), baked = useRef(false);
  const resources = useMemo(() => {
    const target = new WebGLRenderTarget(resolution, resolution), blurTarget = new WebGLRenderTarget(resolution, resolution);
    target.texture.generateMipmaps = blurTarget.texture.generateMipmaps = false;
    const geometry = new PlaneGeometry(4.6, 4.6).rotateX(-Math.PI / 2);
    const camera = new OrthographicCamera(-2.3, 2.3, 2.3, -2.3, 0, 2);
    camera.position.set(0, -0.008, 0.2); camera.rotation.x = Math.PI / 2; camera.updateMatrixWorld();
    const depth = new MeshDepthMaterial(); depth.depthTest = depth.depthWrite = false;
    depth.onBeforeCompile = shader => {
      shader.fragmentShader = shader.fragmentShader.replace('vec4( vec3( 1.0 - fragCoordZ ), opacity );', 'vec4( vec3(0.0), 1.0 - fragCoordZ );');
    };
    const horizontal = new ShaderMaterial(HorizontalBlurShader), vertical = new ShaderMaterial(VerticalBlurShader);
    horizontal.depthTest = vertical.depthTest = false;
    const plane = new Mesh(geometry, horizontal); plane.position.set(0, 0, 0.2); plane.rotation.z = Math.PI;
    return { target, blurTarget, geometry, camera, depth, horizontal, vertical, plane };
  }, [resolution]);
  useEffect(() => {
    baked.current = false;
    return () => { const r = resources; r.target.dispose(); r.blurTarget.dispose(); r.geometry.dispose(); r.depth.dispose(); r.horizontal.dispose(); r.vertical.dispose(); };
  }, [resources]);
  useFrame(() => {
    if (baked.current || !receiver.current) return;
    const r = resources, oldOverride = scene.overrideMaterial, oldBackground = scene.background, oldTarget = gl.getRenderTarget();
    receiver.current.visible = false;
    try {
      scene.overrideMaterial = r.depth; scene.background = null;
      gl.setRenderTarget(r.target); gl.render(scene, r.camera);
      r.plane.material = r.horizontal; r.horizontal.uniforms.tDiffuse.value = r.target.texture; r.horizontal.uniforms.h.value = 2.4 / 256;
      gl.setRenderTarget(r.blurTarget); gl.render(r.plane, r.camera);
      r.plane.material = r.vertical; r.vertical.uniforms.tDiffuse.value = r.blurTarget.texture; r.vertical.uniforms.v.value = 2.4 / 256;
      gl.setRenderTarget(r.target); gl.render(r.plane, r.camera);
      baked.current = true;
    } finally { scene.overrideMaterial = oldOverride; scene.background = oldBackground; gl.setRenderTarget(oldTarget); receiver.current.visible = true; }
  });
  return <mesh ref={receiver} geometry={resources.geometry} position={[0, -0.009, 0.2]}><meshBasicMaterial transparent map={resources.target.texture} opacity={0.6} depthWrite={false} /></mesh>;
}

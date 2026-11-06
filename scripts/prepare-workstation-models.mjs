import fs from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { Box3, Color, EdgesGeometry, Group, LineBasicMaterial, LineSegments, Matrix4, Mesh, MeshBasicMaterial, MeshStandardMaterial, Vector3 } from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries, mergeVertices, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { MeshoptSimplifier } from 'meshoptimizer';

const sourceDirectory = process.argv[2];
if (!sourceDirectory) throw new Error('Pass the folder containing the extracted computer, chair, and desk OBJ files.');
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((value) => { this.result = value; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then((value) => { this.result = `data:${blob.type};base64,${Buffer.from(value).toString('base64')}`; this.onloadend?.(); }); }
};

await MeshoptSimplifier.ready;
const configurations = {
  computer: { file: 'computer/[OBJ] old_computer/old_computer.obj', normal: 6500, low: 2800, source: 'https://elements.envato.com/vintage-desktop-computer-with-mouse-and-keyboard-45XJTRR' },
  chair: { file: 'chair/office_chair_12_obj/office_chair_12_obj.obj', normal: 18000, low: 6500, source: 'https://elements.envato.com/modern-office-chair-with-high-backrest-and-armrest-AQYRJQV' },
  desk: { file: 'desk/[OBJ] desk/desk.obj', normal: 1868, low: 1000, source: 'https://elements.envato.com/rustic-wooden-desk-with-drawers-U43GGJB' },
};
const palette = {
  case: ['#a8b3b9', 0.42, 0.35], keys: ['#464c52', 0.7, 0.08], cable: ['#111820', 1, 0], glass: ['#0b1012', 1, 0],
  body: ['#111820', 0.7, 0.12], hardware: ['#82929e', 0.36, 0.65], rubber: ['#090e13', 1, 0], upholstery: ['#232c36', 0.9, 0],
  wood: ['#63432f', 0.76, 0], desktop: ['#966344', 0.62, 0], frame: ['#17212b', 0.48, 0.45],
};
const manifest = { units: 'metres', assets: {}, screen: null };

for (const [id, config] of Object.entries(configurations)) {
  const original = new OBJLoader().parse(await fs.readFile(path.join(sourceDirectory, config.file), 'utf8'));
  const rawBounds = new Box3().setFromObject(original);
  const rawSize = rawBounds.getSize(new Vector3());
  let scale, transform;
  if (id === 'computer') {
    const body = original.children.find((mesh) => mesh.name === 'old_computer_main_pCube62');
    const center = new Box3().setFromObject(body).getCenter(new Vector3());
    scale = 0.9;
    transform = new Matrix4().makeTranslation(-center.x, -rawBounds.min.y, 0).premultiply(new Matrix4().makeScale(scale, scale, scale));
    const display = original.children.find((mesh) => mesh.name.includes('_screen_'));
    const bounds = new Box3().setFromObject(display), centerScreen = bounds.getCenter(new Vector3()).applyMatrix4(transform);
    const height = (bounds.max.y - bounds.min.y) * scale * 0.92;
    manifest.screen = { position: [centerScreen.x, centerScreen.y, bounds.max.z * scale + 0.0012], width: height * 800 / 560, height, distanceFactor: height * 400 / 560 };
  } else if (id === 'chair') {
    scale = 1.18 / rawSize.y;
    transform = new Matrix4().makeTranslation(6.5, -rawBounds.min.y, 2.7).premultiply(new Matrix4().makeRotationY(-Math.PI / 2)).premultiply(new Matrix4().makeScale(scale, scale, scale));
  } else {
    scale = 0.76 / rawSize.y;
    transform = new Matrix4().makeTranslation(0, -rawBounds.min.y, -(rawBounds.min.z + rawBounds.max.z) / 2).premultiply(new Matrix4().makeScale(scale, scale, scale));
  }
  const meshes = original.children.filter((mesh) => mesh.isMesh);
  const originalTriangles = meshes.reduce((sum, mesh) => sum + (mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count) / 3, 0);
  const transformedBounds = rawBounds.clone().applyMatrix4(transform);
  manifest.assets[id] = { source: config.source, originalTriangles, size: transformedBounds.getSize(new Vector3()).toArray(), normal: null, low: null };

  for (const quality of ['normal', 'low']) {
    const buckets = new Map(), edges = [], materials = new Map();
    let triangles = 0;
    for (const mesh of meshes) {
      let geometry = mesh.geometry.clone();
      geometry.deleteAttribute('normal'); geometry.deleteAttribute('uv');
      geometry = mergeVertices(geometry, 0.000001);
      const indices = new Uint32Array(geometry.index.array);
      const target = Math.max(12, Math.floor(indices.length * config[quality] / originalTriangles / 3) * 3);
      if (target < indices.length) {
        const [simplified] = MeshoptSimplifier.simplify(indices, geometry.attributes.position.array, 3, target, quality === 'low' ? 0.025 : 0.008, ['LockBorder']);
        geometry.setIndex(Array.from(simplified));
      }
      geometry.applyMatrix4(transform);
      triangles += geometry.index.count / 3;
      const sourceMaterial = Array.isArray(mesh.material) ? mesh.material[0].name : mesh.material.name;
      const role = id === 'desk' ? 'wood' : id === 'chair'
        ? sourceMaterial.includes('metal') ? 'hardware' : sourceMaterial.includes('leather') ? 'upholstery' : sourceMaterial.includes('wheels') ? 'rubber' : 'body'
        : mesh.name.includes('_screen_') ? 'glass' : mesh.name.includes('cable') ? 'cable' : mesh.name.includes('keyboard') ? 'keys' : 'case';
      if (role !== 'glass') edges.push(new EdgesGeometry(geometry, quality === 'low' ? 38 : 28));
      const pieces = new Map();
      if (id === 'desk') {
        const positions = geometry.attributes.position, index = geometry.index.array;
        for (let i = 0; i < index.length; i += 3) {
          const y = (positions.getY(index[i]) + positions.getY(index[i + 1]) + positions.getY(index[i + 2])) / 3;
          const finish = y > 0.725 ? 'desktop' : y > 0.515 ? 'wood' : 'frame';
          if (!pieces.has(finish)) pieces.set(finish, []);
          pieces.get(finish).push(index[i], index[i + 1], index[i + 2]);
        }
      } else pieces.set(role, Array.from(geometry.index.array));
      for (const [finish, indices] of pieces) {
        const piece = geometry.clone().setIndex(indices);
        const shaded = mergeVertices(toCreasedNormals(piece, Math.PI / 3), 0.00001);
        if (!buckets.has(finish)) buckets.set(finish, []);
        buckets.get(finish).push(shaded);
        piece.dispose();
      }
      geometry.dispose();
    }
    const output = new Group(); output.name = `${id}-${quality}`;
    output.userData = { assetSource: config.source, author: 'TurboSquid / Envato', units: 'metres' };
    for (const [role, geometries] of buckets) {
      const [color, roughness, metalness] = palette[role];
      const material = role === 'glass' ? new MeshBasicMaterial({ color }) : new MeshStandardMaterial({ color: new Color(color), roughness, metalness });
      material.name = role; materials.set(role, material);
      const mesh = new Mesh(mergeGeometries(geometries), material); mesh.name = role;
      output.add(mesh);
    }
    const lines = new LineSegments(mergeGeometries(edges), new LineBasicMaterial({ color: '#a6b0b3', transparent: true, opacity: 0.3 }));
    lines.name = 'construction-lines'; output.add(lines);
    const buffer = Buffer.from(await new GLTFExporter().parseAsync(output, { binary: true, onlyVisible: true }));
    const folder = path.join('public/models/workstation', quality); await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(path.join(folder, `${id}.glb`), buffer);
    manifest.assets[id][quality] = { url: `/models/workstation/${quality}/${id}.glb`, triangles, drawables: output.children.length, bytes: buffer.length, gzipBytes: gzipSync(buffer).length };
    console.log(id, quality, 'triangles', triangles, 'GLB', buffer.length, 'gzip', gzipSync(buffer).length);
    output.traverse((node) => { node.geometry?.dispose(); if (node.material) node.material.dispose(); });
    for (const parts of buckets.values()) for (const part of parts) part.dispose();
    for (const part of edges) part.dispose();
  }
}
await fs.writeFile('src/components/studio/workstationModels.json', JSON.stringify(manifest, null, 2) + '\n');
console.log('Screen measurements', manifest.screen);
await import('./build-modern-hardware.mjs');

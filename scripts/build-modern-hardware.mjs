import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { Box3, BoxGeometry, BufferGeometry, Color, CylinderGeometry, EdgesGeometry, Float32BufferAttribute, Group, LineBasicMaterial, LineSegments, Matrix4, Mesh, MeshBasicMaterial, MeshStandardMaterial, TorusGeometry, Vector3 } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries, mergeVertices, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { MeshoptSimplifier } from 'meshoptimizer';

const sourceDirectory = process.argv[2];
assert(sourceDirectory, 'Pass the existing extracted asset folder.');
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(value => { this.result = value; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then(value => { this.result = `data:${blob.type};base64,${Buffer.from(value).toString('base64')}`; this.onloadend?.(); }); }
};
await MeshoptSimplifier.ready;
const manifest = JSON.parse(await fs.readFile('src/components/studio/workstationModels.json', 'utf8'));
const peripheralsSource = manifest.assets.computer.source;
const oldComputer = new OBJLoader().parse(await fs.readFile(path.join(sourceDirectory, 'computer/[OBJ] old_computer/old_computer.obj'), 'utf8'));
const palette = {
  bezel: ['#131d24', .45, .32], aluminum: ['#9cabb2', .38, .58], keys: ['#3f4c55', .72, .07], cable: ['#101820', 1, 0],
  case: ['#a8b8be', .42, .4], dark: ['#101b24', .65, .22], hardware: ['#647f90', .38, .65], copper: ['#b97946', .4, .65],
  glass: ['#080f14', 1, 0], window: ['#5d7784', .24, .08], indicator: ['#efbc75', .4, 0],
};

for (const quality of ['normal', 'low']) {
  const segments = quality === 'normal' ? 16 : 8;
  for (const id of ['computer', 'tower']) {
    const buckets = new Map(), edges = [];
    function add(role, geometry, position = [0, 0, 0], rotation = [0, 0, 0], outline = true) {
      geometry.rotateX(rotation[0]); geometry.rotateY(rotation[1]); geometry.rotateZ(rotation[2]); geometry.translate(...position);
      geometry.deleteAttribute('uv');
      if (!buckets.has(role)) buckets.set(role, []);
      buckets.get(role).push(geometry.toNonIndexed ? (geometry.index ? geometry.toNonIndexed() : geometry) : geometry);
      if (outline && role !== 'glass' && role !== 'window') edges.push(new EdgesGeometry(geometry, 35));
    }
    const box = (role, size, position, radius = 0, rotation = [0, 0, 0], outline = true) => add(role, radius ? new RoundedBoxGeometry(...size, 1, radius) : new BoxGeometry(...size), position, rotation, outline);
    const cylinder = (role, radius, height, position, rotation = [0, 0, 0], outline = true) => add(role, new CylinderGeometry(radius, radius, height, segments), position, rotation, outline);
    if (id === 'computer') {
      // A 27-inch-class display, with a separate rear shell, narrow bezel and metal stand.
      box('bezel', [.61, .361, .021], [0, .31, 0], .007);
      box('aluminum', [.586, .337, .022], [0, .31, -.015], .008);
      box('glass', [.564, .31584, .0015], [0, .31, .0117], .002);
      box('bezel', [.56, .012, .002], [0, .139, .012], .001);
      cylinder('aluminum', .024, .09, [0, .262, -.043], [Math.PI / 2, 0, 0]);
      box('aluminum', [.045, .225, .025], [0, .129, -.058], .006, [-.16, 0, 0]);
      box('aluminum', [.223, .012, .16], [0, .009, -.027], .005);
      box('dark', [.193, .004, .125], [0, .002, -.027], .001);
      for (let n = 0; n < (quality === 'normal' ? 16 : 8); n++) box('dark', [.0025, .023, .001], [-.18 + n * (quality === 'normal' ? .024 : .048), .18, -.027], 0, [0, 0, 0], false);
      cylinder('indicator', .0016, .001, [.255, .139, .014], [Math.PI / 2, 0, 0], false);
      for (const source of oldComputer.children.filter(mesh => /keyboard|mouse/.test(mesh.name))) {
        let geometry = source.geometry.clone(); geometry.deleteAttribute('normal'); geometry.deleteAttribute('uv'); geometry = mergeVertices(geometry, .000001);
        const target = Math.floor(geometry.index.count * (quality === 'normal' ? .46 : .2) / 3) * 3;
        const [indices] = MeshoptSimplifier.simplify(new Uint32Array(geometry.index.array), geometry.attributes.position.array, 3, target, quality === 'normal' ? .008 : .025, ['LockBorder']);
        geometry.setIndex(Array.from(indices));
        geometry.applyMatrix4(new Matrix4().makeTranslation(.032, .004702, 0).premultiply(new Matrix4().makeScale(.9, .9, .9)));
        geometry = mergeVertices(toCreasedNormals(geometry, Math.PI / 3), .00001);
        add(source.name.includes('keyboard') ? 'keys' : source.name.includes('cable') ? 'cable' : 'aluminum', geometry);
      }
    } else {
      // A compact workstation tower with a ventilated intake and a clear side panel.
      box('case', [.24, .012, .36], [0, .421, 0], .004);
      box('case', [.24, .012, .36], [0, .027, 0], .004);
      box('case', [.009, .385, .35], [-.116, .224, 0], .003);
      box('case', [.223, .385, .009], [0, .224, -.175], .003);
      box('dark', [.221, .385, .012], [0, .224, .175], .003);
      box('window', [.003, .354, .326], [.121, .224, 0], .001);
      for (const y of [.043, .407]) box('case', [.008, .011, .35], [.12, y, 0], .002);
      for (const z of [-.17, .17]) box('case', [.008, .375, .011], [.12, .224, z], .002);
      for (const x of [-.088, .088]) for (const z of [-.135, .135]) cylinder('dark', .014, .016, [x, .012, z]);
      for (let row = 0; row < 14; row++) box('hardware', [.187, .0025, .0015], [0, .065 + row * .02, .182], 0, [0, 0, 0], false);
      for (const y of [.13, .281]) {
        add('copper', new TorusGeometry(.058, .0025, 4, segments), [0, y, .183], [0, 0, 0], false);
        cylinder('hardware', .013, .01, [0, y, .181], [Math.PI / 2, 0, 0], false);
        const blades = [];
        for (let n = 0; n < 7; n++) {
          const angle = n * Math.PI * 2 / 7;
          for (const [r, a] of [[.015, angle], [.052, angle + .28], [.047, angle + .85]]) blades.push(Math.cos(a) * r, Math.sin(a) * r, 0);
        }
        const blade = new BufferGeometry(); blade.setAttribute('position', new Float32BufferAttribute(blades, 3)); blade.computeVertexNormals();
        add('hardware', blade, [0, y, .179], [0, 0, 0], false);
      }
      box('dark', [.008, .285, .279], [-.088, .237, -.014]);
      box('hardware', [.025, .084, .083], [-.057, .265, -.031], .002);
      for (let fin = 0; fin < (quality === 'normal' ? 12 : 6); fin++) box('aluminum', [.065, .0025, .08], [-.027, .226 + fin * (quality === 'normal' ? .0064 : .0128), -.031], 0, [0, 0, 0], false);
      box('dark', [.195, .053, .19], [0, .063, -.055], .002);
      box('copper', [.073, .015, .26], [-.026, .155, -.005], .002);
      cylinder('hardware', .007, .002, [.071, .381, .183], [Math.PI / 2, 0, 0]);
      cylinder('indicator', .0035, .002, [.047, .381, .184], [Math.PI / 2, 0, 0], false);
      for (const x of [-.064, -.036]) box('dark', [.018, .006, .002], [x, .382, .182], .001);
      for (const y of [.055, .392]) for (const z of [-.15, .15]) cylinder('hardware', .0038, .003, [.124, y, z], [0, 0, Math.PI / 2], false);
    }
    const output = new Group(); output.name = `${id}-${quality}`;
    output.userData = { units: 'metres', design: 'Original workstation hardware', peripheralsSource: id === 'computer' ? peripheralsSource : undefined };
    let triangles = 0;
    for (const [role, geometries] of buckets) {
      const [color, roughness, metalness] = palette[role];
      const material = role === 'glass' ? new MeshBasicMaterial({ color }) : new MeshStandardMaterial({ color, roughness, metalness, transparent: role === 'window', opacity: role === 'window' ? .22 : 1, depthWrite: role !== 'window' });
      if (role === 'indicator') { material.emissive = new Color('#e0a050'); material.emissiveIntensity = .5; }
      material.name = role;
      const geometry = mergeVertices(mergeGeometries(geometries), .000001);
      triangles += (geometry.index?.count ?? geometry.attributes.position.count) / 3;
      const mesh = new Mesh(geometry, material); mesh.name = role; output.add(mesh);
    }
    const lines = new LineSegments(mergeGeometries(edges), new LineBasicMaterial({ color: '#95a2a8', transparent: true, opacity: .17 })); lines.name = 'construction-lines'; output.add(lines);
    const buffer = Buffer.from(await new GLTFExporter().parseAsync(output, { binary: true }));
    await fs.mkdir(`public/models/workstation/${quality}`, { recursive: true });
    await fs.writeFile(`public/models/workstation/${quality}/${id}.glb`, buffer);
    manifest.assets[id] ??= {};
    manifest.assets[id].source = id === 'computer' ? peripheralsSource : 'Original geometry';
    manifest.assets[id].design = 'Original modern hardware';
    manifest.assets[id].size = new Box3().setFromObject(output).getSize(new Vector3()).toArray();
    delete manifest.assets[id].originalTriangles;
    manifest.assets[id][quality] = { url: `/models/workstation/${quality}/${id}.glb`, triangles, drawables: output.children.length, bytes: buffer.length, gzipBytes: gzipSync(buffer).length };
    console.log(id, quality, triangles, 'triangles', gzipSync(buffer).length, 'compressed bytes');
    output.traverse(node => { node.geometry?.dispose(); node.material?.dispose(); });
    for (const group of buckets.values()) for (const geometry of group) geometry.dispose();
    for (const geometry of edges) geometry.dispose();
  }
}
manifest.screen = { position: [0, .31, .0132], width: .558, height: .31248, distanceFactor: .2232 };
assert(Math.abs(manifest.screen.width / manifest.screen.height - 1000 / 560) < 0.000001);
assert(Object.values(manifest.assets).reduce((n, asset) => n + asset.normal.triangles * 3, 0) < 100000, 'Keep the one-time shadow pass within the triangle budget.');
await fs.writeFile('src/components/studio/workstationModels.json', JSON.stringify(manifest, null, 2) + '\n');

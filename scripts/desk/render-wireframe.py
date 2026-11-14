"""Render the loading linework from the shipped room, without rebuilding its lightmaps.

Run: blender -b --factory-startup -t 4 -P scripts/desk/render-wireframe.py
Requires Blender with Freestyle and cwebp. Re-run when the room or its camera changes.
"""
import json
import math
from pathlib import Path
import re
import subprocess
import tempfile

import bmesh
import numpy as np
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public/models/desk"
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(OUT / "room.glb"))
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 1
scene.world = bpy.data.worlds.new("Black")
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0, 0, 0, 1)

# Black surfaces provide real occlusion: the back of the room must not show through the furniture.
ink = bpy.data.materials.new("Ink")
ink.use_nodes = True
nodes = ink.node_tree.nodes
nodes.clear()
output = nodes.new("ShaderNodeOutputMaterial")
emission = nodes.new("ShaderNodeEmission")
emission.inputs[0].default_value = (0, 0, 0, 1)
ink.node_tree.links.new(emission.outputs[0], output.inputs[0])
for obj in scene.objects:
    if obj.type != "MESH":
        continue
    obj.data.materials.clear()
    obj.data.materials.append(ink)
    # glTF splits vertices at UV seams; welding avoids broken Freestyle strokes.
    mesh = bmesh.new()
    mesh.from_mesh(obj.data)
    bmesh.ops.remove_doubles(mesh, verts=list(mesh.verts), dist=0.00001)
    mesh.to_mesh(obj.data)
    mesh.free()
    if obj.name in {"sky", "key-legends"}:
        obj.hide_render = True

# Match the live room's visible cards and badges.
notes = min(6, len(list((ROOT / "content/field-notes").glob("*.md"))) + 2)
jobs_source = (ROOT / "src/lib/portfolioData.ts").read_text().split("export const experiences = [", 1)[1].split("];", 1)[0]
jobs = min(5, max(0, jobs_source.count("company:") - 1))
for prefix, count, capacity in [("cardslot", notes, 6), ("badgeslot", jobs, 5)]:
    for i in range(capacity):
        slot = bpy.data.objects.get(f"{prefix}-{i}")
        if slot is None:
            continue
        if i >= count:
            for obj in [slot, *slot.children_recursive]:
                obj.hide_render = True
        elif prefix == "badgeslot":
            slot.location.x += (capacity - count) * 0.04

# Read the actual room pose; the vertical field of view matches Scene.tsx.
views = (ROOT / "src/components/desk/data.ts").read_text()
pose = re.search(r"room: \{ pos: (\[[^\]]+\]), target: (\[[^\]]+\])", views)
assert pose, "Room camera not found in data.ts"
assert "camera={{ fov: 38," in (ROOT / "src/components/desk/Scene.tsx").read_text(), "Update the wireframe field of view to match Scene.tsx"
convert = lambda v: Vector((v[0], -v[2], v[1]))
camera = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
scene.collection.objects.link(camera)
camera.location = convert(json.loads(pose[1]))
camera.rotation_euler = (convert(json.loads(pose[2])) - camera.location).to_track_quat("-Z", "Y").to_euler()
camera.data.sensor_fit = "VERTICAL"
camera.data.angle = math.radians(38)
scene.camera = camera
scene.render.resolution_percentage = 100
scene.render.use_freestyle = True
freestyle = scene.view_layers[0].freestyle_settings
freestyle.crease_angle = math.radians(135)
lines = freestyle.linesets[0]
lines.select_silhouette = True
lines.select_border = True
lines.select_crease = True
lines.select_external_contour = True
lines.linestyle = bpy.data.linestyles.new("Room outlines")
lines.linestyle.color = (0.65, 0.70, 0.72)
lines.linestyle.thickness = 1.5
lines.linestyle.use_dashed_line = False
scene.view_settings.view_transform = "Standard"
scene.render.image_settings.file_format = "PNG"

# One 16:9 image covers narrow viewports by height and ultrawide viewports by width,
# matching the live camera's vertical FOV and its ultrawide horizontal-FOV cap.
scene.render.resolution_x, scene.render.resolution_y = 2400, 1350
with tempfile.TemporaryDirectory(prefix="desk-wireframe-") as temp:
    png = Path(temp) / "wireframe.png"
    scene.render.filepath = str(png)
    bpy.ops.render.render(write_still=True)
    image = bpy.data.images.load(str(png))
    pixels = np.empty(2400 * 1350 * 4, dtype=np.float32)
    image.pixels.foreach_get(pixels)
    coverage = np.count_nonzero(pixels.reshape(-1, 4)[:, :3].max(axis=1) > 0.1) / (2400 * 1350)
    assert 0.005 < coverage < 0.15, "Expected detailed linework on a mostly black background"
    subprocess.run(["cwebp", "-quiet", "-q", "90", str(png), "-o", str(OUT / "wireframe.webp")], check=True)

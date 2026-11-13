"""Builds the /desk room: models, bakes light for the dark and light rooms, exports for the web.

Run:  blender -b --factory-startup -P scripts/desk/build-room.py -- <out dir> [samples] [lightmap size] [models dir] [preview] [raw]
Out:  room.glb, light-dark.webp, light-light.webp, room.json (lightmap scales), poster-dark.webp, poster-light.webp
      (the page reads room.json from src/components/desk/, written there directly after a rebuild)

Coordinates are written in three.js terms (x right, y up, z towards the viewer) and converted with P().
Clickable objects sit under empties named hot-<id>; faces that show live content are named
(paper-top, paper-bottom, card-N, screen, badge-N, photo, phone-screen, calendar, sky) so the page can paint them.
"""

import json
import math
import os
import subprocess
import sys
import time

import bmesh
import bpy
import numpy as np
from mathutils import Euler, Matrix, Vector

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = os.path.abspath(args[0] if args else "out")
SAMPLES = int(args[1]) if len(args) > 1 else 512
SIZE = int(args[2]) if len(args) > 2 else 2048
# Optional folder with the unpacked Envato downloads; without it the built shapes are used.
ASSETS = os.path.abspath(args[3]) if len(args) > 3 and args[3] != "-" else None
PREVIEW = "preview" in args[4:]  # place models and render quick stills of both rooms, no bake
RAW = "raw" in args[4:]  # also keep the unencoded bake (light-<theme>.npy), to try encodings without rebaking
os.makedirs(OUT, exist_ok=True)

scene = bpy.context.scene
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj)
scene.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
prefs.compute_device_type = "METAL"
prefs.get_devices()
for device in prefs.devices:
    device.use = True
scene.cycles.device = "GPU"
scene.cycles.samples = SAMPLES
scene.view_settings.view_transform = "Standard"


def P(x, y, z):
    return Vector((x, -z, y))


def lin(hex_color):
    c = [int(hex_color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c]


MATS = {}


def mat(name, color, rough=0.7, emit=None):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*lin(color), 1)
    bsdf.inputs["Roughness"].default_value = rough
    if emit:
        bsdf.inputs["Emission Color"].default_value = (*lin(emit), 1)
        bsdf.inputs["Emission Strength"].default_value = 0
    MATS[name] = m
    return m


def link(name, mesh, parent=None):
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    if parent:
        obj.parent = parent
    return obj


def place(obj, x, y, z, rot=(0, 0, 0)):
    # three.js XYZ Euler (rx, ry, rz) becomes Blender YZX (rx, -rz, ry) after the axis swap.
    obj.location = P(x, y, z)
    obj.rotation_mode = "YZX"
    obj.rotation_euler = Euler((rot[0], -rot[2], rot[1]), "YZX")
    return obj


def finish(bm, name, material, parent):
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(material)
    return link(name, mesh, parent)


def box(name, w, h, d, at, material, bevel=0.004, rot=(0, 0, 0), parent=None):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        v.co = Vector((v.co.x * w, v.co.y * d, v.co.z * h))
    if name.startswith(("desk-top", "desk-apron", "drawer", "shelf", "window-frame", "window-sill", "photo-frame", "corkboard-frame")):
        bevel = min(.012, max(.006, bevel))
    if bevel:
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=min(bevel, w / 2.5, h / 2.5, d / 2.5), segments=3, profile=0.5, affect="EDGES", clamp_overlap=True)
    return place(finish(bm, name, material, parent), *at, rot)


def cyl(name, r_top, r_bottom, h, at, material, rot=(0, 0, 0), segments=24, parent=None):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=segments, radius1=r_bottom, radius2=r_top, depth=h)
    return place(finish(bm, name, material, parent), *at, rot)


def ball(name, radii, at, material, parent=None, subdivisions=2):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdivisions, radius=1)
    for v in bm.verts:
        v.co = Vector((v.co.x * radii[0], v.co.y * radii[2], v.co.z * radii[1]))
    for f in bm.faces:
        f.smooth = True
    return place(finish(bm, name, material, parent), *at)


def quad(name, corners, material, parent=None, v=(0, 1)):
    """A content face: corners in three.js space, bottom-left first, counter-clockwise from the front.
    `v` is the slice of the canvas it shows, bottom to top."""
    bm = bmesh.new()
    face = bm.faces.new([bm.verts.new(P(*c)) for c in corners])
    uv = bm.loops.layers.uv.new("UVMap")
    for loop, coord in zip(face.loops, [(0, v[0]), (1, v[0]), (1, v[1]), (0, v[1])]):
        loop[uv].uv = coord
    return finish(bm, name, material, parent)


def rotate_y(p, a):
    return (p[0] * math.cos(a) + p[2] * math.sin(a), p[1], -p[0] * math.sin(a) + p[2] * math.cos(a))


def rotate_z(p, a):
    return (p[0] * math.cos(a) - p[1] * math.sin(a), p[0] * math.sin(a) + p[1] * math.cos(a), p[2])


def flat(name, w, d, at, material, ry=0, parent=None, v=(0, 1)):
    """Face lying on a surface, readable from the chair (top edge towards the wall)."""
    pts = [(-w / 2, 0, d / 2), (w / 2, 0, d / 2), (w / 2, 0, -d / 2), (-w / 2, 0, -d / 2)]
    return quad(name, [tuple(a + b for a, b in zip(rotate_y(p, ry), at)) for p in pts], material, parent, v)


def upright(name, w, h, at, material, rz=0, parent=None):
    """Face on the back wall, facing the room."""
    pts = [(-w / 2, -h / 2, 0), (w / 2, -h / 2, 0), (w / 2, h / 2, 0), (-w / 2, h / 2, 0)]
    return quad(name, [tuple(a + b for a, b in zip(rotate_z(p, rz), at)) for p in pts], material, parent)


def pivot(name, at=(0, 0, 0), rot=(0, 0, 0), parent=None):
    """An empty the page can move or turn, carrying its children."""
    empty = bpy.data.objects.new(name, None)
    scene.collection.objects.link(empty)
    empty.parent = parent
    return place(empty, *at, rot)


def hot(name):
    return pivot(f"hot-{name}")


# --- Materials ---------------------------------------------------------------------------
wall = mat("wall", "#d9cfc0", 0.95)
floor = mat("floor", "#8a6a4e", 0.6)
skirting = mat("skirting", "#c9bca9", 0.8)
oak = mat("oak", "#9a6a42", 0.55)
oak_dark = mat("oak-dark", "#6e4a30", 0.6)
steel = mat("steel", "#6d6862", 0.4)
black = mat("black", "#1c1a18", 0.5)
plastic = mat("plastic", "#2a2725", 0.45)
key = mat("key", "#3a3632", 0.5)
fabric = mat("fabric", "#3a332d", 0.9)
cork = mat("cork", "#b07a4c", 0.95)
frame_wood = mat("frame-wood", "#4a3424", 0.7)
paper_body = mat("paper-body", "#e6dfd0", 0.9)
card_body = mat("card-body", "#efe9de", 0.9)
pin = mat("pin", "#e0763a", 0.4)
rug = mat("rug", "#8a3f22", 1.0)
ceramic = mat("ceramic", "#ece6dc", 0.35)
terracotta = mat("terracotta", "#a4532d", 0.8)
leaf = mat("leaf", "#4e6b43", 0.7)
shade = mat("shade", "#e0763a", 0.5)
bulb = mat("bulb", "#ffe2b8", 0.5, emit="#ffd9a8")
glass_dark = mat("screen-glass", "#121110", 0.2, emit="#f2e6d6")
phone_glass = mat("phone-glass", "#121110", 0.2, emit="#f2e6d6")
sky_mat = mat("sky", "#101320", 1.0, emit="#1a2236")
lanyards = [mat(f"lanyard-{i}", c, 0.7) for i, c in enumerate(["#c8602f", "#3a342c", "#6e4a30", "#8a4421", "#4a5a52"])]
books = [mat(f"book-{i}", c, 0.8) for i, c in enumerate(["#8a4421", "#26231e", "#e6ddcf", "#4a2a18", "#c4612c", "#3a342c"])]
content = {n: mat(f"content-{n}", c, 0.85) for n, c in [("paper", "#ebe4d6"), ("card", "#f3eee4"), ("badge", "#f3eee4"), ("calendar", "#ece6dc"), ("photo", "#7a5a40"), ("spine", "#d8cfbf")]}

# --- Room shell --------------------------------------------------------------------------
X0, X1, Z0, Z1, H = -1.4, 4.0, -0.84, 4.0, 3.2
box("floor", X1 - X0, 0.04, Z1 - Z0, ((X0 + X1) / 2, -0.02, (Z0 + Z1) / 2), floor, bevel=0)
# The walls meet at the inside corner (x -1.36, z -0.8): an end tucked inside the other wall would look out
# through its deleted outer face and bake sky light into the corner as a bright seam.
XI, ZI = -1.36, -0.8
box("wall-back", X1 - XI, H, 0.04, ((XI + X1) / 2, H / 2, -0.82), wall, bevel=0)
# Left wall, built around the window opening (z -0.42..0.52, y 0.96..1.74)
WZ0, WZ1, WY0, WY1 = -0.42, 0.52, 0.96, 1.74
box("wall-left-low", 0.04, WY0, Z1 - ZI, (-1.38, WY0 / 2, (ZI + Z1) / 2), wall, bevel=0)
box("wall-left-high", 0.04, H - WY1, Z1 - ZI, (-1.38, (WY1 + H) / 2, (ZI + Z1) / 2), wall, bevel=0)
box("wall-left-back", 0.04, WY1 - WY0, WZ0 - ZI, (-1.38, (WY0 + WY1) / 2, (ZI + WZ0) / 2), wall, bevel=0)
box("wall-left-front", 0.04, WY1 - WY0, Z1 - WZ1, (-1.38, (WY0 + WY1) / 2, (WZ1 + Z1) / 2), wall, bevel=0)
box("skirting-back", X1 - X0, 0.08, 0.015, ((X0 + X1) / 2, 0.04, -0.795), skirting, bevel=0.002)
box("skirting-left", 0.015, 0.08, Z1 - Z0, (-1.355, 0.04, (Z0 + Z1) / 2), skirting, bevel=0.002)
for i, (w, h, d, y, z) in enumerate([(0.07, 0.05, 1.02, WY0, 0.05), (0.07, 0.05, 1.02, WY1, 0.05), (0.07, WY1 - WY0 - 0.05, 0.05, 1.35, WZ0), (0.07, WY1 - WY0 - 0.05, 0.05, 1.35, WZ1), (0.06, WY1 - WY0 - 0.05, 0.03, 1.35, 0.05)]):
    box(f"window-frame-{i}", w, h, d, (-1.36, y, z), frame_wood, bevel=0.004)
box("window-sill", 0.12, 0.025, 1.12, (-1.32, WY0 - 0.035, 0.05), skirting, bevel=0.003)
sky = quad("sky", [(-1.5, 0.75, 0.75), (-1.5, 0.75, -0.65), (-1.5, 1.95, -0.65), (-1.5, 1.95, 0.75)], sky_mat)
sky.visible_shadow = False  # the moon and sun shine through it into the room
# The outside of the shell is never seen; dropping it leaves that lightmap space to the walls in view.
for name, axis, sign in [("floor", 2, -1), ("wall-back", 1, 1), ("wall-left-low", 0, -1), ("wall-left-high", 0, -1), ("wall-left-back", 0, -1), ("wall-left-front", 0, -1)]:
    bm = bmesh.new()
    bm.from_mesh(bpy.data.objects[name].data)
    bm.normal_update()
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.normal[axis] * sign > 0.5], context="FACES")
    bm.to_mesh(bpy.data.objects[name].data)
    bm.free()
box("rug", 1.5, 0.008, 1.1, (-0.05, 0.004, 0.55), rug, bevel=0.003)
# Never drawn or exported: keeps the moon and sun from pouring in over the top of the walls.
box("roof", X1 - X0, 0.04, Z1 - Z0, ((X0 + X1) / 2, H + 0.02, (Z0 + Z1) / 2), wall, bevel=0).visible_camera = False

# Shelf and books
box("shelf", 0.6, 0.025, 0.18, (0.85, 1.36, -0.71), oak_dark, bevel=0.003)
for i, x in enumerate([0.62, 1.08]):
    box(f"shelf-bracket-{i}", 0.015, 0.08, 0.14, (x, 1.31, -0.73), steel, bevel=0.002)
# Warm LED strip under the shelf: lights the badges below it at night.
strip_glow = mat("strip-glow", "#ffd9a8", 0.5, emit="#ffd9a8")
box("shelf-strip", 0.5, 0.005, 0.012, (0.85, 1.345, -0.66), strip_glow, bevel=0.001)
for i in range(6):
    hb = 0.17 + ((i * 37) % 7) / 100
    box(f"book-{i}", 0.04, hb, 0.13, (0.62 + i * 0.047, 1.3725 + hb / 2, -0.71), books[i], bevel=0.003, rot=(0, 0, 0.08 if i == 5 else 0))
    # The spine facing the room, for the page to paint a title on (u across, v up the spine).
    upright(f"spine-{i}", 0.034, hb - 0.012, (0.62 + i * 0.047, 1.3725 + hb / 2, -0.6438), content["spine"], rz=0.08 if i == 5 else 0)

# --- Desk --------------------------------------------------------------------------------
box("desk-top", 1.6, 0.04, 0.72, (0, 0.75, 0), oak, bevel=0.008)
for i, (x, z) in enumerate([(-0.76, -0.32), (-0.76, 0.32)]):
    box(f"desk-leg-{i}", 0.045, 0.73, 0.045, (x, 0.365, z), oak_dark, bevel=0.004)
box("desk-apron", 1.1, 0.07, 0.02, (-0.2, 0.695, 0.3), oak_dark, bevel=0.003)
box("drawers", 0.42, 0.71, 0.66, (0.55, 0.375, 0), oak_dark, bevel=0.006)
for i, y in enumerate([0.56, 0.33, 0.12]):
    box(f"drawer-front-{i}", 0.38, 0.19, 0.012, (0.55, y, 0.335), oak, bevel=0.004)
    box(f"drawer-handle-{i}", 0.12, 0.012, 0.016, (0.55, y + 0.05, 0.346), steel, bevel=0.003)

# Keyboard (one mesh) and mouse
bm = bmesh.new()
bmesh.ops.create_cube(bm, size=1)
for v in bm.verts:
    v.co = Vector((v.co.x * 0.44, v.co.y * 0.14, v.co.z * 0.016))
bmesh.ops.bevel(bm, geom=bm.edges[:], offset=0.004, segments=2, affect="EDGES", clamp_overlap=True)
for row in range(5):
    for col in range(14):
        k = bmesh.ops.create_cube(bm, size=1)["verts"]
        for v in k:
            v.co = Vector((v.co.x * 0.025 + (col - 6.5) * 0.029, v.co.y * 0.022 + (row - 2) * 0.026, v.co.z * 0.008 + 0.011))
keyboard = place(finish(bm, "keyboard", key, None), -0.07, 0.778, 0.12)
ball("mouse", (0.032, 0.018, 0.055), (0.3, 0.779, 0.15), plastic)
box("mouse-pad", 0.24, 0.003, 0.2, (0.3, 0.7715, 0.14), fabric, bevel=0.002)

# Mug and plant
# Mug: a turned profile (foot, wall, rounded lip, inside), coffee in it and a curved handle towards the room.
MUG = (0.48, 0.77, -0.34)  # base centre; rim at y 0.865
bm = bmesh.new()
profile = [(0, 0), (0.033, 0), (0.0355, 0.003), (0.0375, 0.03), (0.039, 0.07), (0.0398, 0.09), (0.0396, 0.0935), (0.0388, 0.095), (0.0375, 0.0952), (0.0364, 0.0945), (0.0357, 0.092), (0.0352, 0.085), (0.034, 0.03), (0.032, 0.013), (0.029, 0.01), (0, 0.01)]
verts = [bm.verts.new((r, 0, h)) for r, h in profile]
edges = [bm.edges.new(pair) for pair in zip(verts, verts[1:])]
bmesh.ops.spin(bm, geom=verts + edges, cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * math.pi, steps=64, use_merge=True)
bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-5)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])  # the page draws front faces only
for f in bm.faces:
    f.smooth = True
place(finish(bm, "mug", ceramic, None), *MUG)
cyl("mug-coffee", 0.0348, 0.0348, 0.002, (MUG[0], MUG[1] + 0.078, MUG[2]), mat("coffee", "#24150c", 0.15), segments=32)
bm = bmesh.new()
rings = []
for k in range(49):
    a = math.radians(-112 + k * 224 / 48)
    centre = Vector((0.046 + 0.022 * math.cos(a), 0, 0.05 + 0.027 * math.sin(a)))
    out = Vector((math.cos(a) / 0.022, 0, math.sin(a) / 0.027)).normalized()
    rings.append([bm.verts.new(centre + out * 0.0055 * math.cos(t) + Vector((0, 0.0075 * math.sin(t), 0))) for t in (j * 2 * math.pi / 20 for j in range(20))])
for r0, r1 in zip(rings, rings[1:]):
    for j in range(20):
        bm.faces.new((r0[j], r0[(j + 1) % 20], r1[(j + 1) % 20], r1[j])).smooth = True
bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
place(finish(bm, "mug-handle", ceramic, None), *MUG)
for part in ("mug", "mug-handle"):  # outward check: faces should point away from the mug's axis
    mesh = bpy.data.objects[part].data
    out = sum(1 for poly in mesh.polygons if Vector((poly.center.x, poly.center.y, 0)).dot(poly.normal) > 0)
    print(f"{part}: {out}/{len(mesh.polygons)} faces point outward")
cyl("pot", 0.065, 0.048, 0.11, (0.66, 0.825, -0.22), terracotta)
cyl("soil", 0.06, 0.06, 0.005, (0.66, 0.875, -0.22), mat("soil", "#2a1d14", 1.0))
for i, (dx, dy, dz, rx, ry, rz) in enumerate([(0, 0.95, 0, 0.07, 0.05, 0.07), (0.06, 0.99, 0.02, 0.06, 0.045, 0.05), (-0.055, 0.98, -0.02, 0.06, 0.05, 0.05), (0.02, 1.04, -0.03, 0.055, 0.05, 0.05), (-0.03, 0.93, 0.045, 0.05, 0.04, 0.05), (0.04, 0.92, -0.05, 0.05, 0.04, 0.045), (-0.01, 1.08, 0.01, 0.04, 0.04, 0.04)]):
    ball(f"leaf-{i}", (rx, ry, rz), (0.66 + dx, dy, -0.22 + dz), leaf)

# Chair, pulled up to the desk's left end
chair = bpy.data.objects.new("chair", None)
scene.collection.objects.link(chair)
place(chair, -0.07, 0, 0.78)  # pulled out in front of the keyboard, facing the monitor
box("chair-seat", 0.48, 0.08, 0.46, (0, 0.48, 0), fabric, bevel=0.025, parent=chair)
box("chair-back", 0.46, 0.56, 0.07, (0, 0.86, 0.22), fabric, bevel=0.025, rot=(-0.12, 0, 0), parent=chair)
box("chair-spine", 0.06, 0.3, 0.025, (0, 0.6, 0.24), black, bevel=0.006, parent=chair)
for i, x in enumerate([-0.25, 0.25]):
    box(f"chair-arm-{i}", 0.04, 0.025, 0.28, (x, 0.66, 0.02), black, bevel=0.008, parent=chair)
    box(f"chair-arm-post-{i}", 0.025, 0.16, 0.03, (x, 0.57, 0.08), black, bevel=0.005, parent=chair)
cyl("chair-pole", 0.025, 0.025, 0.36, (0, 0.27, 0), steel, segments=16, parent=chair)
for i in range(5):
    a = i * 2 * math.pi / 5
    box(f"chair-spoke-{i}", 0.3, 0.025, 0.035, (math.cos(a) * 0.14, 0.07, -math.sin(a) * 0.14), black, bevel=0.006, rot=(0, a, 0), parent=chair)
    ball(f"chair-caster-{i}", (0.022, 0.022, 0.022), (math.cos(a) * 0.28, 0.025, -math.sin(a) * 0.28), black, parent=chair)

# --- Clickable objects -------------------------------------------------------------------
blog = hot("blog")
# Baked open; the page folds the near half under the far one and unfolds it when the blog opens.
news = pivot("news", (-0.48, 0.772, 0.08), (0, 0.35, 0), blog)
box("paper-far", 0.3, 0.004, 0.21, (0, 0, -0.105), paper_body, bevel=0.001, parent=news)
flat("paper-top", 0.298, 0.208, (0, 0.0021, -0.105), content["paper"], parent=news, v=(0.5, 1))
fold = pivot("paper-fold", (0, -0.002, 0), parent=news)
box("paper-near", 0.3, 0.004, 0.21, (0, 0.002, 0.105), paper_body, bevel=0.001, parent=fold)
flat("paper-bottom", 0.298, 0.208, (0, 0.0041, 0.105), content["paper"], parent=fold, v=(0, 0.5))

notes = hot("notes")
box("corkboard-frame", 0.66, 0.46, 0.022, (-0.8, 1.5, -0.789), frame_wood, bevel=0.004, parent=notes)
box("corkboard", 0.62, 0.42, 0.01, (-0.8, 1.5, -0.775), cork, bevel=0.001, parent=notes)
for i, (x, y, rz) in enumerate([(-0.99, 1.6, 0.06), (-0.77, 1.62, -0.05), (-0.6, 1.58, 0.04), (-0.95, 1.4, -0.04), (-0.74, 1.4, 0.07), (-0.6, 1.38, -0.06)]):
    slot = pivot(f"cardslot-{i}", (x, y, -0.7685), (0, 0, rz), notes)
    box(f"cardbody-{i}", 0.15, 0.106, 0.003, (0, 0, 0), card_body, bevel=0, parent=slot)
    upright(f"card-{i}", 0.148, 0.104, (0, 0, 0.0017), content["card"], parent=slot)
    # The pin travels with its card, and like the card it casts no baked shadow.
    ball(f"pin-{i}", (0.005, 0.005, 0.009), (0, 0.042, 0.010), pin, parent=slot)

work = hot("work")
box("monitor", 0.68, 0.42, 0.025, (-0.05, 1.12, -0.17), black, bevel=0.008, parent=work)
box("monitor-back", 0.34, 0.22, 0.04, (-0.05, 1.12, -0.2), black, bevel=0.015, parent=work)
box("monitor-neck", 0.04, 0.24, 0.025, (-0.05, 0.9, -0.215), steel, bevel=0.006, parent=work)
box("monitor-base", 0.22, 0.012, 0.16, (-0.05, 0.776, -0.19), steel, bevel=0.004, parent=work)
upright("screen", 0.645, 0.385, (-0.05, 1.125, -0.1572), glass_dark, parent=work)

experience = hot("experience")
BADGES = 5
box("badge-hook", 0.08 * BADGES + 0.04, 0.02, 0.03, (0.72, 1.24, -0.785), steel, bevel=0.004, parent=experience)
for i in range(BADGES):
    # Each badge hangs from its own point on the hook, so the page can fan them out;
    # the strap runs exactly to the badge's top edge.
    mid = (BADGES - 1) / 2
    slot = pivot(f"badgeslot-{i}", (0.72 + (i - mid) * 0.08, 1.24, -0.783), parent=experience)
    drop = 0.15 + i * 0.006
    strap = drop - 0.05
    cyl(f"lanyard-{i}", 0.003, 0.003, strap, (0, -strap / 2, 0), lanyards[i % len(lanyards)], segments=6, parent=slot)
    box(f"badgebody-{i}", 0.07, 0.1, 0.003, (0, -drop, 0.0035), card_body, bevel=0.001, rot=(0, 0, (i - mid) * 0.04), parent=slot)
    box(f"badge-clip-{i}", 0.012, 0.021, 0.005, (0, -drop + 0.061, 0.009), steel, bevel=0.002, parent=slot)
    upright(f"badge-{i}", 0.068, 0.098, (0, -drop, 0.007), content["badge"], rz=(i - mid) * 0.04, parent=slot)

about = hot("about")
photo_frame = box("photo-frame", 0.13, 0.16, 0.014, (-0.72, 0.85, 0.28), frame_wood, bevel=0.003, rot=(-0.10, 0.18, 0), parent=about)
upright("photo", 0.1, 0.13, (0, 0, 0.009), content["photo"], parent=photo_frame)
box("photo-stand", 0.03, 0.12, 0.01, (0, -0.02, -0.04), frame_wood, bevel=0.002, rot=(0.5, 0, 0), parent=photo_frame)

contact = hot("contact")
# Phone on a little stand, leaning back 65 degrees from the desk and turned towards the room camera.
PHONE_TILT, PHONE_TURN, PHONE_FOOT = math.radians(65), 0.475, (0.4, 0.778, 0.2)
stand_turn = Matrix.Rotation(PHONE_TURN, 3, "Z")  # Blender Z is up
phone = box("phone", 0.075, 0.01, 0.15, (0, 0, 0), plastic, bevel=0.005, parent=contact)
phone.rotation_mode = "XYZ"
phone.rotation_euler = (stand_turn @ Matrix.Rotation(PHONE_TILT, 3, "X")).to_euler("XYZ")  # screen-up, far end lifted
# Bottom edge resting on the stand's lip: centre is half the phone's length up the slope.
up_slope = phone.rotation_euler.to_matrix() @ Vector((0, 1, 0))
normal = phone.rotation_euler.to_matrix() @ Vector((0, 0, 1))
phone.location = P(*PHONE_FOOT) + up_slope * 0.075 + normal * 0.005
screen = flat("phone-screen", 0.068, 0.14, (0, 0.0052, 0), phone_glass, parent=phone)
stand_at = P(*PHONE_FOOT)
base = box("phone-stand-base", 0.07, 0.006, 0.075, (0, 0, 0), black, bevel=0.002, parent=contact)
base.rotation_mode = "XYZ"
base.rotation_euler = stand_turn.to_euler("XYZ")
base.location = stand_at + stand_turn @ Vector((0, 0.03, 0)) - Vector((0, 0, 0.005))
lip = box("phone-stand-lip", 0.07, 0.012, 0.006, (0, 0, 0), black, bevel=0.0015, parent=contact)
lip.rotation_mode = "XYZ"
lip.rotation_euler = stand_turn.to_euler("XYZ")
lip.location = stand_at + stand_turn @ Vector((0, -0.006, 0))
back = box("phone-stand-back", 0.05, 0.004, 0.1, (0, 0, 0), black, bevel=0.0015, parent=contact)
back.rotation_mode = "XYZ"
back.rotation_euler = phone.rotation_euler
back.location = P(*PHONE_FOOT) + up_slope * 0.05 - normal * 0.004

activity = hot("activity")
box("calendar-board", 0.36, 0.21, 0.008, (1.39, 1.60, -0.796), card_body, bevel=0.002, parent=activity)
upright("calendar", 0.344, 0.196, (1.39, 1.60, -0.7915), content["calendar"], parent=activity)
ball("calendar-nail", (0.005, 0.005, 0.005), (1.39, 1.712, -0.792), steel, parent=activity)

# The current job: one larger badge on its own nail, apart from the hook.
now = hot("now")
NOW = (-0.14, 1.56)  # face centre on the back wall
ball("now-nail", (0.006, 0.006, 0.006), (NOW[0], NOW[1] + 0.2, -0.795), steel, parent=now)
for i, side in enumerate((-1, 1)):
    box(f"now-lanyard-{i}", 0.008, 0.125, 0.002, (NOW[0] + side * 0.011, NOW[1] + 0.138, -0.796), lanyards[0], bevel=0, rot=(0, 0, side * 0.17), parent=now)
box("now-clip", 0.03, 0.014, 0.004, (NOW[0], NOW[1] + 0.071, -0.795), steel, bevel=0.001, parent=now)
box("now-badgebody", 0.094, 0.129, 0.003, (NOW[0], NOW[1], -0.7965), card_body, bevel=0, parent=now)
upright("now-badge", 0.09, 0.125, (NOW[0], NOW[1], -0.793), content["badge"], parent=now)

lamp = hot("lamp")
cyl("lamp-base", 0.07, 0.08, 0.02, (-0.62, 0.78, -0.2), black, parent=lamp)
cyl("lamp-arm-low", 0.008, 0.008, 0.42, (-0.62, 0.99, -0.2), steel, rot=(0, 0, -0.25), segments=10, parent=lamp)
ball("lamp-joint", (0.014, 0.014, 0.014), (-0.57, 1.19, -0.2), black, parent=lamp)
cyl("lamp-arm-high", 0.008, 0.008, 0.3, (-0.48, 1.22, -0.14), steel, rot=(0, 0, 1.0), segments=10, parent=lamp)
cyl("lamp-shade", 0.03, 0.08, 0.12, (-0.38, 1.21, -0.08), shade, rot=(0, 0, -0.5), parent=lamp)
ball("lamp-bulb", (0.026, 0.026, 0.026), (-0.365, 1.18, -0.08), bulb, parent=lamp)

bpy.context.view_layer.update()
c = screen.matrix_world @ Vector(np.mean([v.co[:] for v in screen.data.vertices], 0))
print(f"phone-screen centre (three): {c.x:.3f}, {c.z:.3f}, {-c.y:.3f}")

# --- Store-bought models (Envato) ---------------------------------------------------------
LAMP_HEAD = (-0.37, 1.19, -0.08)


def remove(*names):
    for name in names:
        if name in bpy.data.objects:
            bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)


def import_parts(path):
    """Imports a model and bakes every transform into its meshes; returns {name: mesh object}."""
    before = set(bpy.data.objects)
    ext = path.lower().rsplit(".", 1)[1]
    if ext == "obj":
        bpy.ops.wm.obj_import(filepath=path)
    elif ext == "fbx":
        bpy.ops.import_scene.fbx(filepath=path)
    else:
        bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    meshes = [o for o in new if o.type == "MESH"]
    for o in meshes:
        world_matrix = o.matrix_world.copy()
        o.parent = None
        o.data.transform(world_matrix)
        o.matrix_world = Matrix.Identity(4)
    for o in new:
        if o.type != "MESH":
            bpy.data.objects.remove(o, do_unlink=True)
    for o in meshes:
        for slot in o.material_slots:
            bsdf = slot.material and slot.material.node_tree and slot.material.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                # Metal and glass bake to black in a diffuse-light bake; the page shows flat colour anyway.
                bsdf.inputs["Metallic"].default_value = 0
                bsdf.inputs["Transmission Weight"].default_value = 0
                bsdf.inputs["Alpha"].default_value = 1
    return {o.name: o for o in meshes}


def join(objs, name, parent=None):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    obj.name = obj.data.name = name
    obj.parent = parent
    return obj


def bounds(obj):
    co = np.array([v.co[:] for v in obj.data.vertices])
    return co.min(0), co.max(0)


def decimate(obj, max_tris):
    tris = sum(len(p.vertices) - 2 for p in obj.data.polygons)
    if tris <= max_tris:
        return
    mod = obj.modifiers.new("decimate", "DECIMATE")
    mod.ratio = max_tris / tris
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=mod.name)


def fit(objs, *, size, axis, at, anchor="bottom", turn=0.0, tilt=None):
    """Scales the parts together so their extent along `axis` (Blender 0,1,2) is `size`,
    turns them `turn` radians about the vertical, then puts their bottom-centre (or centre) at `at`."""
    if tilt:
        for o in objs:
            o.data.transform(Matrix.Rotation(tilt[1], 4, tilt[0]))
    lo = np.min([bounds(o)[0] for o in objs], 0)
    hi = np.max([bounds(o)[1] for o in objs], 0)
    scale = size / (hi[axis] - lo[axis])
    pivot = Vector(((lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, lo[2] if anchor == "bottom" else (lo[2] + hi[2]) / 2))
    m = Matrix.Translation(P(*at)) @ Matrix.Rotation(turn, 4, "Z") @ Matrix.Scale(scale, 4) @ Matrix.Translation(-pivot)
    for o in objs:
        o.data.transform(m)
    return m


if ASSETS:
    A = lambda *p: os.path.join(ASSETS, *p)

    parts = list(import_parts(A("office-chair", "office_chair_12_obj", "office_chair_12_obj.obj")).values())
    for name in [n for n in list(bpy.data.objects.keys()) if n.startswith("chair-")]:
        remove(name)
    fit(parts, size=1.08, axis=2, at=(0, 0, 0), turn=math.pi / 2)
    office = join(parts, "chair-model", chair)
    for face in office.data.polygons:
        face.use_smooth = True
    for slot in office.material_slots:
        material = slot.material
        if material:
            bsdf = material.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                for node in list(material.node_tree.nodes):
                    if node.type == "TEX_IMAGE":
                        material.node_tree.nodes.remove(node)
                for edge in list(bsdf.inputs["Base Color"].links):
                    material.node_tree.links.remove(edge)
                bsdf.inputs["Base Color"].default_value = (*lin("#686661"), 1)
                bsdf.inputs["Roughness"].default_value = 0.65
    parts = list(import_parts(A("white-mug", "[OBJ] Promotional_Coffee_Mug_Mockup_01_White", "Promotional_Coffee_Mug_Mockup_01_White.obj")).values())
    fit(parts, size=0.095, axis=2, at=MUG)
    remove("mug", "mug-handle")
    mug = join(parts, "mug")
    mug.data.materials.clear()
    mug.data.materials.append(ceramic)
    for face in mug.data.polygons:
        face.material_index = 0
        face.use_smooth = True

    # Plant: authored lying down; stand it up and put it where the built one was.
    parts = list(import_parts(A("potted-anthurium", "Anthurium_andreanum_obj", "Anthurium_andreanum_obj.obj")).values())
    fit(parts, size=0.34, axis=2, at=(0.66, 0.77, -0.22), tilt=("X", -math.pi / 2))
    plant = join(parts, "plant")
    # Preserve the pot silhouette along with the leaves.
    for face in plant.data.polygons:
        face.use_smooth = True
    remove("pot", "soil", *[f"leaf-{i}" for i in range(7)])

    # Lamp: base at the back-left corner of the desk, head reaching over the keyboard.
    parts = list(import_parts(A("articulating-desk-lamp", "[OBJ] Decor_Lamp_On", "Decor_Lamp_On.obj")).values())
    fit(parts, size=0.44, axis=2, at=(-0.5, 0.77, -0.16), turn=0.0)
    lamp_model = join(parts, "lamp-model", lamp)
    # Keep the authored curved surfaces intact.
    remove("lamp-base", "lamp-arm-low", "lamp-joint", "lamp-arm-high", "lamp-shade")
    # Its .mtl only has placeholder wire colours; the real bronze is the base-colour map in Extras.
    bronze = bpy.data.materials.new("lamp-bronze")
    bronze.use_nodes = True
    texture = bronze.node_tree.nodes.new("ShaderNodeTexImage")
    texture.image = bpy.data.images.load(A("articulating-desk-lamp", "Extras", "Clock_Lamp_Glasses_BaseColor.png"))
    bsdf = bronze.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*lin("#655c4f"), 1)
    bsdf.inputs["Roughness"].default_value = 0.6
    for slot in lamp_model.material_slots:
        slot.material = bronze
    # The bulb and the lamp's light go inside the shade: the vertices furthest along the arm.
    co = np.array([v.co[:] for v in lamp_model.data.vertices])
    head = co[co[:, 0] > co[:, 0].max() - 0.09].mean(0)
    LAMP_HEAD = (head[0], head[2] - 0.035, -head[1])
    bpy.data.objects["lamp-bulb"].location = P(*LAMP_HEAD)

    # Corkboard: keep the frame and cork (the long loose parts), drop its own papers and pins.
    parts = list(import_parts(A("framed-cork-board", "[OBJ] Board", "Board.obj")).values())
    board = join(parts, "corkboard-model", notes)
    bpy.context.view_layer.objects.active = board
    bpy.ops.object.select_all(action="DESELECT")
    board.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.separate(type="LOOSE")
    bpy.ops.object.mode_set(mode="OBJECT")
    pieces = [o for o in bpy.context.selected_objects]
    lo = np.min([bounds(o)[0] for o in pieces], 0)
    hi = np.max([bounds(o)[1] for o in pieces], 0)
    span = min(hi[0] - lo[0], hi[2] - lo[2])
    keep = [o for o in pieces if max(np.ptp(np.array([v.co[:] for v in o.data.vertices]), 0)[[0, 2]]) > 0.6 * span]
    for o in pieces:
        if o not in keep:
            bpy.data.objects.remove(o, do_unlink=True)
    # Portrait to landscape, front towards the room.
    fit(keep, size=0.66, axis=0, at=(-0.8, 1.5, -0.795), anchor="centre", tilt=("Y", math.pi / 2))
    board = join(keep, "corkboard-model", notes)
    decimate(board, 8000)
    # Keep the cork texture, but give the outer frame a clean, uniform finish.
    board.data.materials.append(frame_wood)
    for face in board.data.polygons:
        centre = face.center
        if abs(centre.x + 0.8) > 0.305 or abs(centre.z - 1.5) > 0.205:
            face.material_index = len(board.data.materials) - 1
    remove("corkboard-frame", "corkboard")

    # Computer: monitor, keyboard and mouse on the desk; the tower on the floor under it.
    parts = import_parts(A("desktop-computer", "14. Computer.glb"))
    display = parts["Cube.162"]
    face = max(display.data.polygons, key=lambda poly: poly.area)
    normal = face.normal.copy()
    turn = math.atan2(normal.x, -normal.y)  # turns the screen to face the room (-Y in Blender)
    monitor = [parts[n] for n in ("Imac.009", "Cube.001", "Cube.002")]
    desk_kit = monitor + [o for n, o in parts.items() if n.startswith(("Keyboard", "Cube.16", "Plane.02")) and n not in ("Cube.162",)]
    tower = [o for n, o in parts.items() if n.startswith(("Cube.17", "Cylinder"))]
    lo, hi = bounds(display)
    width = math.hypot(hi[0] - lo[0], hi[1] - lo[1])
    centre = Vector(((lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2))
    scale = 0.6 / width
    m = Matrix.Translation(P(-0.05, 1.125, -0.17)) @ Matrix.Rotation(-turn, 4, "Z") @ Matrix.Scale(scale, 4) @ Matrix.Translation(-centre)
    for o in desk_kit + tower + [display]:
        o.data.transform(m)
    # The monitor stands on the desk; keyboard and mouse sit on the desk top.
    stand = Matrix.Translation((0, 0, 0.771 - min(bounds(o)[0][2] for o in monitor)))
    for o in monitor + [display]:
        o.data.transform(stand)
    kit_low = min(bounds(o)[0][2] for o in desk_kit if not o.name.startswith(("Imac", "Cube.00")))
    floor_drop = Matrix.Translation((0, 0, 0.771 - kit_low))
    for o in desk_kit:
        if not o.name.startswith(("Imac", "Cube.00")):
            o.data.transform(floor_drop)
    dlo, dhi = bounds(display)
    # Keys: the bought caps are stark blank plates. Soften them and print small legends on their tops.
    keycap, legend_dark, legend_light = mat("keycap", "#9a948b", 0.6), mat("legend-dark", "#615b53", 0.6), mat("legend-light", "#2f2c28", 0.6)
    faces = []
    for o in desk_kit:
        if not o.name.startswith("Cube.16"):
            continue
        lo, hi = bounds(o)
        for vertex in o.data.vertices:
            if vertex.co.z > hi[2] - 0.0015:
                vertex.co.z += 0.003
        bevel = o.modifiers.new("keycap-edge", "BEVEL")
        bevel.width, bevel.segments = 0.0007, 3
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier=bevel.name)
        pale = any(slot.material and slot.material.name.startswith("White") for slot in o.material_slots)
        if pale:
            for slot in o.material_slots:
                slot.material = keycap
        for poly in o.data.polygons:
            if poly.normal.z > 0.9:
                faces.append((np.array([o.data.vertices[i].co[:] for i in poly.vertices]), pale))
    # A cap's top is several faces; faces on the top plane that touch belong to one key.
    top = max(f[0][:, 2].max() for f in faces)
    faces = [f for f in faces if f[0][:, 2].mean() > top - 0.0015]
    lows = np.array([f[0][:, :2].min(0) for f in faces]) - 0.0005
    highs = np.array([f[0][:, :2].max(0) for f in faces]) + 0.0005
    group = list(range(len(faces)))
    def root(i):
        while group[i] != i:
            group[i] = group[group[i]]
            i = group[i]
        return i
    for i in range(len(faces)):
        touching = np.all((lows[i + 1:] <= highs[i]) & (highs[i + 1:] >= lows[i]), axis=1)
        for j in np.nonzero(touching)[0] + i + 1:
            group[root(int(j))] = root(i)
    keys = {}
    for i, (co, pale) in enumerate(faces):
        keys.setdefault(root(i), ([], pale))[0].append(co)
    keys = [(np.vstack(c).min(0), np.vstack(c).max(0), pale) for c, pale in keys.values()]
    keys = [((lo + hi) / 2, hi - lo, pale) for lo, hi, pale in keys]
    unit = float(np.median([k[1][1] for k in keys]))
    rows = []
    for k in sorted(keys, key=lambda k: -k[0][1]):  # back row first
        if rows and abs(rows[-1][0][0][1] - k[0][1]) < unit * 0.5:
            rows[-1].append(k)
        else:
            rows.append([k])
    # The bought keyboard is a simple 44-key board: a short function row, three rows of 12, and a row with a long space bar.
    LABELS = [
        ["Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11"],
        list("1234567890-="),
        list("QWERTYUIOP[]"),
        ["Ctrl", "Alt", "Alt", "Fn", "<", "v", ">"],
    ]
    glyphs = []
    for r, row in enumerate(rows[:len(LABELS)]):
        names = iter(LABELS[r])
        for centre, size, pale in sorted(row, key=lambda k: k[0][0]):
            if size[0] > unit * 1.4:
                continue  # wide keys (Tab, Shift, Enter, space) stay plain
            text = next(names, None)
            if text is None:
                break
            curve = bpy.data.curves.new("legend", "FONT")
            curve.body, curve.size, curve.resolution_u = text, unit * (0.32 if len(text) == 1 else 0.2), 2
            curve.align_x, curve.align_y = "CENTER", "CENTER"
            holder = bpy.data.objects.new("legend", curve)
            scene.collection.objects.link(holder)
            mesh = bpy.data.meshes.new_from_object(holder.evaluated_get(bpy.context.evaluated_depsgraph_get()))
            bpy.data.objects.remove(holder, do_unlink=True)
            mesh.transform(Matrix.Translation(Vector((centre[0], centre[1], centre[2] + 0.0004))))
            mesh.materials.append(legend_dark if pale else legend_light)
            glyphs.append(link(f"legend-{len(glyphs)}", mesh))
    print(f"keyboard: {len(keys)} keys in {len(rows)} rows of {[len(r) for r in rows]}, key {unit * 1000:.1f} mm, {len(glyphs)} legends")
    legends = join(glyphs, "key-legends")
    print("key-legends triangles:", sum(len(p.vertices) - 2 for p in legends.data.polygons))
    # The tower's green and blue rings read as a glitch; make them dark plastic.
    for o in tower:
        for slot in o.material_slots:
            if slot.material and slot.material.name.startswith(("Green", "Blue")):
                tree = slot.material.node_tree
                bsdf = tree.nodes["Principled BSDF"]
                for socket in ("Base Color", "Emission Color"):
                    for l in list(bsdf.inputs[socket].links):
                        tree.links.remove(l)
                bsdf.inputs["Base Color"].default_value = (*lin("#2a2826"), 1)
                bsdf.inputs["Emission Strength"].default_value = 0
    monitor_model = join(monitor, "monitor-model", work)
    monitor_model.data.materials.clear()
    monitor_model.data.materials.append(mat("monitor-finish", "#343638", 0.65))
    for face in monitor_model.data.polygons:
        face.material_index = 0
    decimate(join([o for o in desk_kit if o not in monitor], "keyboard-model"), 6000)
    tlo = np.min([bounds(o)[0] for o in tower], 0)
    thi = np.max([bounds(o)[1] for o in tower], 0)
    for o in tower:
        o.data.transform(Matrix.Translation((-0.45 - (tlo[0] + thi[0]) / 2, 0.05 - (tlo[1] + thi[1]) / 2, -tlo[2])))
    decimate(join(tower, "tower"), 3000)  # under the desk, mostly in shadow
    # The page paints the screen; this face sits just in front of the model's own display.
    remove("screen", "monitor", "monitor-back", "monitor-neck", "monitor-base", "keyboard", "mouse")
    bpy.data.objects.remove(display, do_unlink=True)
    sw, sh = (dhi[0] - dlo[0]), (dhi[2] - dlo[2])
    cx, cy, cz = (dlo[0] + dhi[0]) / 2, (dlo[2] + dhi[2]) / 2, -dlo[1] + 0.002
    box("display-backing", sw + 0.012, sh + 0.012, 0.012, (cx, cy, cz), black, bevel=0, parent=work)
    upright("screen", sw, sh, (cx, cy, cz + 0.007), glass_dark, parent=work)

    # Smaller textures for the web; only base colour is kept on export.
    for image in bpy.data.images:
        if image.size[0] > 1024:
            image.scale(1024, max(1, int(1024 * image.size[1] / image.size[0])))

# --- Lighting rigs -----------------------------------------------------------------------
def light(name, kind, at, **props):
    data = bpy.data.lights.new(name, kind)
    for k, v in props.items():
        setattr(data, k, v)
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = P(*at)
    return obj


def aim(obj, target):
    obj.rotation_euler = (P(*target) - obj.location).to_track_quat("-Z", "Y").to_euler()


world = bpy.data.worlds.new("world")
scene.world = world
world.use_nodes = True
background = world.node_tree.nodes["Background"]

WINDOW = (-1.38, (WY0 + WY1) / 2, (WZ0 + WZ1) / 2)
spot = light("lamp-light", "SPOT", LAMP_HEAD, spot_size=2.3, spot_blend=0.8, shadow_soft_size=0.09, color=(1, 0.78, 0.56))
aim(spot, (-0.15, 0.75, 0.1))
# The lamp's glow off the desk, helped along: a wide warm pool over the desk, the things on it and the wall behind.
wash = light("wash", "POINT", (-0.1, 1.4, 0.4), shadow_soft_size=0.4, color=(1, 0.8, 0.6))
# Moon and sun stand in the window and point at where their light lands.
moon = light("moon", "SUN", WINDOW, angle=0.03, color=(0.55, 0.68, 1))
aim(moon, (0.05, 0, 0.85))
ceiling = light("ceiling", "AREA", (0.1, 2.55, 0.5), size=2.2, color=(1, 0.95, 0.88))
aim(ceiling, (0.1, 0, 0.5))
sun = light("sun", "SUN", WINDOW, angle=0.14, color=(1, 0.9, 0.74))
aim(sun, (-0.6, 0.77, 0.25))
# Night only: a faint bounce from the room behind the camera, so the desk front and tower never sink to black.
fill = light("fill", "POINT", (0.7, 0.55, 1.7), shadow_soft_size=0.6, color=(0.58, 0.72, 1))
strip = light("strip-light", "AREA", (0.85, 1.34, -0.66), shape="RECTANGLE", size=0.5, size_y=0.02, color=(1, 0.82, 0.6))


def emit(material, strength):
    material.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = strength


def rig(theme):
    night = theme == "dark"
    background.inputs["Color"].default_value = (0.02, 0.025, 0.04, 1) if night else (0.5, 0.48, 0.46, 1)
    background.inputs["Strength"].default_value = 1.0 if night else 0.35
    spot.data.color = (1, .53, .24)
    sun.data.color = (1, .66, .36)
    sun.data.angle = .065
    aim(sun, (.7, .78, -.8))
    spot.data.energy = 38 if night else 24
    wash.data.energy = 3.5 if night else 0
    moon.data.energy = 1.8 if night else 0
    fill.data.energy = 5 if night else 4
    ceiling.data.energy = 0 if night else 10
    sun.data.energy = 0 if night else 9
    emit(bulb, 25 if night else 15)
    emit(glass_dark, 6 if night else 0.8)
    emit(phone_glass, 0.3)
    strip.data.energy = 0.15 if night else 0.4
    emit(strip_glow, 0.6 if night else 0.8)
    emit(sky_mat, 1.0 if night else 8)
    sky_mat.node_tree.nodes["Principled BSDF"].inputs["Emission Color"].default_value = (*lin("#1a2236" if night else "#dfe6ee"), 1)


# Pieces the page moves or hides (cards, badges, the folding newspaper) cast no baked shadow,
# or their old spot would stay dark once they move.
MOVABLE = ("cardslot-", "badgeslot-", "news")
for obj in scene.objects:
    chain, node = [], obj
    while node:
        chain.append(node.name)
        node = node.parent
    if obj.type == "MESH" and any(name.startswith(MOVABLE) for name in chain):
        obj.visible_shadow = False
        obj.visible_diffuse = False  # no soft occlusion "ghost" either


# --- Stills ------------------------------------------------------------------------------
def srgb(v):
    return np.where(v <= 0.0031308, v * 12.92, 1.055 * np.power(v, 1 / 2.4) - 0.055)


def save_png(rgb, size, path):
    """`rgb`: sRGB values 0..1, one row per pixel, bottom row first."""
    out = np.ones((len(rgb), 4), dtype=np.float32)
    out[:, :3] = rgb
    image = bpy.data.images.new("out", *size, alpha=False, float_buffer=False)
    image.colorspace_settings.name = "sRGB"
    image.pixels.foreach_set(out.ravel())
    image.filepath_raw = path
    image.file_format = "PNG"
    image.save()
    bpy.data.images.remove(image)


# The page's look (Scene.tsx): three.js ACES tone mapping at these exposures, room view and close-up.
EXPOSURE = {"dark": (2.2, 2.6), "light": (1.15, 1.25)}
ACES_IN = np.array([[0.59719, 0.35458, 0.04823], [0.07600, 0.90834, 0.01566], [0.02840, 0.13383, 0.83777]])
ACES_OUT = np.array([[1.60475, -0.53108, -0.07367], [-0.10208, 1.10813, -0.00605], [-0.00327, -0.07276, 1.07602]])


def page_tone(rgb, exposure):
    v = (rgb * exposure / 0.6) @ ACES_IN.T
    v = (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.4329510) + 0.238081)
    return srgb(np.clip(v @ ACES_OUT.T, 0, 1))


bpy.context.view_layer.update()
PHONE_POSTER_MATRIX = phone.matrix_world.copy()

ROOM_VIEW = ((0.1, 2.0, 2.8), (-0.02, 1.05, -0.2))
camera = bpy.data.objects.new("camera", bpy.data.cameras.new("camera"))
scene.collection.objects.link(camera)
camera.data.sensor_fit = "VERTICAL"
camera.data.angle = math.radians(38)
scene.camera = camera


def still(name, pos, look, exposure, size, samples):
    """Renders a view through the page's tone curve, so it shows what the page will."""
    camera.location = P(*pos)
    aim(camera, look)
    scene.render.resolution_x, scene.render.resolution_y = size
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.render.image_settings.file_format = "OPEN_EXR"
    exr = os.path.join(OUT, name + ".exr")
    scene.render.filepath = exr
    bpy.ops.render.render(write_still=True)
    image = bpy.data.images.load(exr)
    px = np.empty(size[0] * size[1] * 4, dtype=np.float32)
    image.pixels.foreach_get(px)
    bpy.data.images.remove(image)
    os.remove(exr)
    save_png(page_tone(px.reshape(-1, 4)[:, :3], exposure), size, os.path.join(OUT, name + ".png"))


def show_screen():
    """Stills only: the camera sees a stand-in for the page's Work screen while the room keeps the screen's glow."""
    phone_glass.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*lin("#121110"), 1)
    phone_glass.node_tree.nodes["Principled BSDF"].inputs["Emission Color"].default_value = (*lin("#121110"), 1)
    # Poster-only phone lettering follows drawPhone's 120 x 210 canvas.
    from datetime import datetime, timezone, timedelta
    clock = datetime.now(timezone(timedelta(hours=5))).strftime("%I:%M %p").lstrip("0")
    for label, baseline, size, color in [(clock, 52, 26, "#ece6dc"), ("Say hi", 122, 36, "#e0763a"), ("ali.37803990", 152, 12, "#ece6dc"), ("@gmail.com", 168, 12, "#ece6dc")]:
        curve = bpy.data.curves.new("phone-poster-text", "FONT")
        curve.body, curve.align_x, curve.size = label, "CENTER", size * 0.068 / 120
        font = "Courier New" if size == 12 else "Arial"
        curve.font = bpy.data.fonts.load("/System/Library/Fonts/Supplemental/" + font + ".ttf")
        text = bpy.data.objects.new("phone-poster-text", curve)
        scene.collection.objects.link(text)
        text.matrix_world = PHONE_POSTER_MATRIX @ Matrix.Translation((0, (105 - baseline) * 0.14 / 210, 0.0054))
        ink = mat("phone-poster-" + color, color, emit=color)
        ink.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 1
        curve.materials.append(ink)
    w, h = 640, 400
    px = np.ones((h, w, 4), dtype=np.float32)
    px[..., :3] = lin("#121110")
    bars = [(28, 28, 110, 12, "#e0763a"), (28, 56, 300, 30, "#ece6dc"), (28, 102, 420, 10, "#9a9286"), (28, 121, 330, 10, "#9a9286"), (28, 158, w - 56, h - 186, "#1c1a17")]
    for row in range(4):
        bars += [(50, 190 + row * 44, 6, 6, "#e0763a"), (68, 188 + row * 44, 380 - row * 50, 10, "#d9cfc1")]
    for x, y, bw, bh, color in bars:  # y from the top, like the page's canvas
        px[h - y - bh:h - y, x:x + bw, :3] = lin(color)
    image = bpy.data.images.new("screen-still", w, h, float_buffer=True)
    image.pixels.foreach_set(px.ravel())
    nodes, links = glass_dark.node_tree.nodes, glass_dark.node_tree.links
    texture, glow, path, mix = (nodes.new(kind) for kind in ("ShaderNodeTexImage", "ShaderNodeEmission", "ShaderNodeLightPath", "ShaderNodeMixShader"))
    texture.image = image
    links.new(texture.outputs["Color"], glow.inputs["Color"])
    links.new(path.outputs["Is Camera Ray"], mix.inputs["Fac"])
    links.new(nodes["Principled BSDF"].outputs["BSDF"], mix.inputs[1])
    links.new(glow.outputs["Emission"], mix.inputs[2])
    links.new(mix.outputs["Shader"], nodes["Material Output"].inputs["Surface"])


# Preserve curved silhouettes through the glTF export.
for name in ("chair-model", "lamp-model", "mug", "mug-handle", "plant"):
    obj = bpy.data.objects.get(name)
    if obj:
        for face in obj.data.polygons:
            face.use_smooth = True
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        # Imported UV/material splits must share normals before a smooth bake.
        bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=0.00001)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
        for edge in bm.edges:
            edge.smooth = len(edge.link_faces) == 2 and edge.calc_face_angle() < math.radians(50)
        bm.to_mesh(obj.data)
        bm.free()
        if obj.data.has_custom_normals:
            obj.data.normals_split_custom_set([(0, 0, 0)] * len(obj.data.loops))
        obj.cycles.shadow_terminator_offset = 0.1

# A restrained, deterministic oak grain, packed with the model.
wood = bpy.data.images.new("oak-grain", width=1024, height=1024)
y, x = np.mgrid[0:1024, 0:1024] / 1024
rng = np.random.default_rng(27)
# Unequal, wandering fibres avoid repeated bands at close range.
grain = np.ones_like(x)
for _ in range(45):
    frequency = rng.uniform(35, 1100)
    phase = rng.uniform(0, 2 * math.pi)
    bend = rng.uniform(1, 6) * np.sin(x * rng.uniform(2, 14) + phase)
    grain += rng.uniform(0.0005, 0.0025) * np.sin(y * frequency + bend + phase)
grain += 0.008 * np.sin(x * 9 + np.sin(y * 13))
pixels = np.ones((1024, 1024, 4), dtype=np.float32)
pixels[:, :, :3] = np.array([0.604, 0.416, 0.259]) * grain[:, :, None]
wood.pixels.foreach_set(pixels.ravel())
wood.pack()
node = oak.node_tree.nodes.new("ShaderNodeTexImage")
node.image = wood
oak.node_tree.links.new(node.outputs["Color"], oak.node_tree.nodes["Principled BSDF"].inputs["Base Color"])
for obj in scene.objects:
    if obj.type == "MESH" and any(slot.material == oak for slot in obj.material_slots):
        uv = obj.data.uv_layers.new(name="UVMap")
        for loop in obj.data.loops:
            co = obj.data.vertices[loop.vertex_index].co
            uv.data[loop.index].uv = (co.x / 1.6 + 0.5, co.y / 0.72 + 0.5)

def color(m, value):
    b=m.node_tree.nodes.get("Principled BSDF")
    for edge in list(b.inputs["Base Color"].links): m.node_tree.links.remove(edge)
    b.inputs["Base Color"].default_value=(*lin(value),1)

def surface(m, scale=95, rough=.65, amplitude=.08, bump=.00035, variation=.03):
    n,l=m.node_tree.nodes,m.node_tree.links
    b=n.get("Principled BSDF")
    noise=n.new("ShaderNodeTexNoise"); noise.inputs["Scale"].default_value=scale
    noise.inputs["Detail"].default_value=3
    tc=n.new("ShaderNodeTexCoord"); l.new(tc.outputs["Object"],noise.inputs["Vector"])
    r=n.new("ShaderNodeMapRange"); r.inputs["To Min"].default_value=rough-amplitude; r.inputs["To Max"].default_value=rough+amplitude
    l.new(noise.outputs["Fac"],r.inputs["Value"]); l.new(r.outputs["Result"],b.inputs["Roughness"])
    bn=n.new("ShaderNodeBump"); bn.inputs["Strength"].default_value=.22; bn.inputs["Distance"].default_value=bump
    l.new(noise.outputs["Fac"],bn.inputs["Height"]); l.new(bn.outputs["Normal"],b.inputs["Normal"])
    if variation:
        low=n.new("ShaderNodeTexNoise"); low.inputs["Scale"].default_value=2.1; low.inputs["Detail"].default_value=2
        l.new(tc.outputs["Object"],low.inputs["Vector"])
        ramp=n.new("ShaderNodeValToRGB"); base=b.inputs["Base Color"].default_value[:3]
        for e,f in zip(ramp.color_ramp.elements,(1-variation,1+variation)): e.color=(*(min(1,v*f) for v in base),1)
        l.new(low.outputs["Fac"],ramp.inputs["Fac"]); l.new(ramp.outputs["Color"],b.inputs["Base Color"])

def woodgrain(m, base):
    # Same deterministic wandering-fibre field as the production script, tinted per palette.
    color(m,base)
    y,x=np.mgrid[0:1024,0:1024]/1024
    rng=np.random.default_rng(27); grain=np.ones_like(x)
    for _ in range(45):
        frequency=rng.uniform(35,1100); phase=rng.uniform(0,2*math.pi)
        bend=rng.uniform(1,6)*np.sin(x*rng.uniform(2,14)+phase)
        grain+=rng.uniform(.0005,.0025)*np.sin(y*frequency+bend+phase)
    grain+=.008*np.sin(x*9+np.sin(y*13))
    pixels=np.ones((1024,1024,4),dtype=np.float32); pixels[:,:,:3]=np.array(lin(base))*grain[:,:,None]
    image=bpy.data.images.new("art-grain-"+m.name,1024,1024,float_buffer=True); image.pixels.foreach_set(pixels.ravel())
    n,l=m.node_tree.nodes,m.node_tree.links; bs=n["Principled BSDF"]
    tc=n.new("ShaderNodeTexCoord"); mapping=n.new("ShaderNodeVectorMath"); mapping.operation="MULTIPLY"; mapping.inputs[1].default_value=(.625,1.389,1)
    l.new(tc.outputs["Object"],mapping.inputs[0]); tex=n.new("ShaderNodeTexImage"); tex.image=image
    l.new(mapping.outputs[0],tex.inputs["Vector"]); l.new(tex.outputs["Color"],bs.inputs["Base Color"])
    bs.inputs["Roughness"].default_value=.43; bs.inputs["Coat Weight"].default_value=.18


# B walnut palette and surface finishes.
color(wall,"#D2C2AC"); surface(wall,rough=.86)
woodgrain(oak,"#795035")
woodgrain(oak_dark,"#60412E")
for m in (black,plastic,fabric): surface(m,rough=.55 if m!=fabric else .83,variation=0)
surface(bpy.data.materials["monitor-finish"],rough=.43,variation=0)
bpy.data.materials["monitor-finish"].node_tree.nodes["Principled BSDF"].inputs["Coat Weight"].default_value=.22
for o in (office,):
    for slot in o.material_slots:
        if slot.material: surface(slot.material,rough=.70,variation=0)
for m in bpy.data.materials:
    b=m.node_tree and m.node_tree.nodes.get("Principled BSDF")
    if b and m not in (key,keycap,legend_dark,legend_light) and max(b.inputs["Base Color"].default_value[:3])<.065:
        surface(m,rough=.5,variation=0)
for o in scene.objects:
    if o.name.startswith(("monitor-model", "corkboard-model")):
        mod=o.modifiers.new("art-edge", "BEVEL"); mod.width=.006; mod.segments=3; mod.use_clamp_overlap=True; mod.limit_method="ANGLE"
for m in (oak,oak_dark,plastic,frame_wood): m.node_tree.nodes["Principled BSDF"].inputs["Coat Weight"].default_value=.18
y,x=np.mgrid[0:1024,0:1024]/1024
# 18 cm boards along the room depth, with staggered 1.6 m end joints.
row=np.floor(x*5.4/.18)
across=np.mod(x*5.4,.18)
along=np.mod(y*4.84+np.mod(row*7,5)*.32,1.6)
seam=(across<.004)|(along<.004)
grain=.045*np.sin(y*1800+2*np.sin(x*140))+.025*np.sin(x*4600+y*45)
factor=np.where(seam,.48,1.02-.19*np.mod(row*7,5)/4+grain)
px=np.ones((1024,1024,4),dtype=np.float32)
px[:,:,:3]=np.array(lin("#896444"))*factor[:,:,None]
planks=bpy.data.images.new("walnut-planks",1024,1024,float_buffer=True)
planks.pixels.foreach_set(px.ravel()); planks.pack()
node=floor.node_tree.nodes.new("ShaderNodeTexImage"); node.image=planks
floor.node_tree.links.new(node.outputs["Color"],floor.node_tree.nodes["Principled BSDF"].inputs["Base Color"])
obj=bpy.data.objects["floor"]
uv=obj.data.uv_layers.new(name="UVMap")
for loop in obj.data.loops:
    co=obj.data.vertices[loop.vertex_index].co
    uv.data[loop.index].uv=(co.x/5.4+.5,co.y/4.84+.5)
surface(rug,scale=650,rough=.96,amplitude=.025,bump=.0007,variation=.06)

if PREVIEW:
    show_screen()
    views = [("room", *ROOM_VIEW, 0)]
    for theme in ("dark", "light"):
        rig(theme)
        for name, pos, look, close in views:
            still(f"preview-{theme}-{name}", pos, look, EXPOSURE[theme][close], (1440, 900), 48)
    print("done preview", OUT)
    sys.exit(0)

# --- Lightmap UVs ------------------------------------------------------------------------
UNLIT = {"screen", "phone-screen", "sky", "lamp-bulb", "shelf-strip", "roof"}
baked = [o for o in scene.objects if o.type == "MESH" and o.name not in UNLIT]
for obj in scene.objects:
    if obj.type == "MESH":
        if not obj.data.uv_layers:
            obj.data.uv_layers.new(name="UVMap")
        if obj.name.startswith("wall-"):
            uv = obj.data.uv_layers[0]
            for loop in obj.data.loops:
                co = obj.data.vertices[loop.vertex_index].co
                uv.data[loop.index].uv = (co.x if obj.name == "wall-back" else co.y, co.z)
        obj.data.uv_layers.new(name="lightmap")
        obj.data.uv_layers.active_index = 1
        # The page reads the lightmap from the second UV set, and the bake below joins meshes by layer name.
        assert len(obj.data.uv_layers) == 2, obj.name
        obj.data.uv_layers[0].name = "UVMap"

bpy.ops.object.select_all(action="DESELECT")
for obj in baked:
    obj.select_set(True)
bpy.context.view_layer.objects.active = baked[0]
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.008, area_weight=0, scale_to_bounds=False)
bpy.ops.uv.average_islands_scale()
bpy.ops.object.mode_set(mode="OBJECT")
# Small, busy models never fill the view; half the texel density leaves more for the walls and desk.
for obj in baked:
    if obj.name in ("tower",):
        uv = np.empty(len(obj.data.loops) * 2, dtype=np.float32)
        obj.data.uv_layers["lightmap"].data.foreach_get("uv", uv)
        obj.data.uv_layers["lightmap"].data.foreach_set("uv", uv * 0.5)
# Thin frames and keycaps need enough texels to survive bake denoising.
for obj in baked:
    if obj.name in ("corkboard-model", "mug", "mug-handle", "lamp-model", "keyboard-model", "chair-model"):
        for loop in obj.data.uv_layers["lightmap"].data:
            loop.uv *= 3
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.uv.pack_islands(margin=0.012, rotate=True, scale=True)  # room for the denoiser not to blur islands together
bpy.ops.object.mode_set(mode="OBJECT")

# --- Export ------------------------------------------------------------------------------
for material in bpy.data.materials:
    if not material.node_tree:
        continue
    for node in [n for n in material.node_tree.nodes if n.type == "TEX_IMAGE"]:
        # Drop any map that isn't base colour (normals, specular…): the page only uses colour.
        if not any(link.to_socket.name == "Base Color" for link in node.outputs["Color"].links):
            material.node_tree.nodes.remove(node)
bpy.ops.object.select_all(action="DESELECT")
for obj in scene.objects:
    obj.select_set(obj.type in {"MESH", "EMPTY"} and obj.name != "roof")
bpy.ops.export_scene.gltf(
    filepath=os.path.join(OUT, "room.glb"), export_format="GLB", use_selection=True,
    export_texcoords=True, export_normals=True, export_materials="EXPORT", export_lights=False, export_cameras=False, export_yup=True,
    export_image_format="WEBP", export_image_quality=80,
)

# --- Bake --------------------------------------------------------------------------------
# Baking object by object sets the scene up and denoises once per object; joined, that happens twice.
# The room is already exported, so nothing needs the separate objects any more.
movable = [o for o in baked if not o.visible_shadow]
baked = [join(group, name, group[0].parent) for group, name in ((movable, "bake-movable"), ([o for o in baked if o.visible_shadow], "bake-static"))]
bpy.ops.object.select_all(action="DESELECT")
for obj in baked:
    obj.select_set(True)

target = bpy.data.images.new("lightmap", SIZE, SIZE, alpha=True, float_buffer=True)
target.generated_color = (0, 0, 0, 0)
for material in {slot.material for obj in baked for slot in obj.material_slots}:
    node = material.node_tree.nodes.new("ShaderNodeTexImage")
    node.image = target
    material.node_tree.nodes.active = node

scene.render.bake.margin = 8
scene.render.bake.use_clear = True
scene.cycles.use_denoising = True
# Adaptive sampling stops early on the dim, bounce-lit walls, and the denoiser turns what is left into blotches.
scene.cycles.use_adaptive_sampling = False
scene.cycles.sample_clamp_indirect = 3.0  # stray bright bounces otherwise denoise into soft spots
scales = {}


def denoise(px):
    """Cycles never denoises a bake, so the bake goes through the compositor's denoiser in a scene of its own."""
    image = bpy.data.images.new("bake-copy", SIZE, SIZE, alpha=True, float_buffer=True)
    image.pixels.foreach_set(px.ravel())
    pass_scene = bpy.data.scenes.new("denoise")
    pass_scene.render.engine = "CYCLES"
    pass_scene.cycles.samples = 1
    pass_scene.render.resolution_x = pass_scene.render.resolution_y = SIZE
    pass_scene.render.resolution_percentage = 100
    tree = bpy.data.node_groups.new("denoise", "CompositorNodeTree")
    pass_scene.compositing_node_group = tree
    tree.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    source, filt, result = (tree.nodes.new(kind) for kind in ("CompositorNodeImage", "CompositorNodeDenoise", "NodeGroupOutput"))
    source.image = image
    tree.links.new(source.outputs["Image"], filt.inputs["Image"])
    tree.links.new(filt.outputs["Image"], result.inputs[0])
    pass_scene.render.image_settings.file_format = "OPEN_EXR"
    exr = os.path.join(OUT, "denoised.exr")
    pass_scene.render.filepath = exr
    bpy.ops.render.render(scene=pass_scene.name, write_still=True)
    loaded = bpy.data.images.load(exr)
    out = np.empty(SIZE * SIZE * 4, dtype=np.float32)
    loaded.pixels.foreach_get(out)
    for block in (loaded, image):
        bpy.data.images.remove(block)
    bpy.data.scenes.remove(pass_scene)
    bpy.data.node_groups.remove(tree)
    os.remove(exr)
    out = out.reshape(-1, 4)
    out[:, :3] = np.maximum(out[:, :3], 0)
    out[:, 3] = px[:, 3]
    return out

for theme in ("dark", "light"):
    rig(theme)
    started = time.time()
    bpy.ops.object.bake(type="DIFFUSE", pass_filter={"DIRECT", "INDIRECT"}, margin=8, use_clear=True)
    print(f"bake {theme}: {time.time() - started:.0f}s")
    px = np.empty(SIZE * SIZE * 4, dtype=np.float32)
    target.pixels.foreach_get(px)
    px = denoise(px.reshape(-1, 4))
    if RAW:
        np.save(os.path.join(OUT, f"light-{theme}.npy"), px.astype(np.float16))
    # 8 bits are few for walls the page multiplies back up, so the range is not set by the hottest texels:
    # above `knee` (where a pale surface already sits on the flat top of the page's tone curve) light is
    # eased into the top 30% of the range. That doubles the steps the walls get. No dither: the denoised
    # bake is smooth, and dither grain shows once a close-up magnifies each texel.
    knee = 5 / EXPOSURE[theme][0]
    scale = 0.7 / knee
    scales[theme] = scale
    value = px[:, :3] * scale
    level = value @ np.array([0.2126, 0.7152, 0.0722])
    eased = np.where(level > 0.7, 0.7 + 0.3 * np.tanh((level - 0.7) / 0.3), level)
    value *= (eased / np.maximum(level, 1e-6))[:, None]
    # Lossless, because lossy WebP halves the colour resolution and turns those walls into coloured blocks.
    png = os.path.join(OUT, f"light-{theme}.png")
    save_png(np.round(srgb(np.clip(value, 0, 1)) * 255) / 255, (SIZE, SIZE), png)
    subprocess.run(["cwebp", "-quiet", "-lossless", "-z", "9", png, "-o", os.path.join(OUT, f"light-{theme}.webp")], check=True)
    os.remove(png)
    print(f"baked {theme}: scale {scale:.3f}")

with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../src/components/desk/room.json"), "w") as f:
    json.dump({"scale": scales, "size": SIZE}, f)

# --- Posters: the room as the page shows it, one per theme ---------------------------------
show_screen()
for theme in ("dark", "light"):
    rig(theme)
    still(f"poster-{theme}", *ROOM_VIEW, EXPOSURE[theme][0], (1600, 1000), 160)
    png = os.path.join(OUT, f"poster-{theme}.png")
    subprocess.run(["cwebp", "-quiet", "-q", "80", png, "-o", os.path.join(OUT, f"poster-{theme}.webp")], check=True)
    os.remove(png)
print("done", OUT)

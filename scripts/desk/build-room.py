"""Builds the /desk room: models, bakes light for the dark and light rooms, exports for the web.

Run:  blender -b --factory-startup -P scripts/desk/build-room.py -- <out dir> [samples] [lightmap size]
Out:  room.glb, light-dark.webp, light-light.webp, room.json (lightmap scales), poster.webp
      (the page reads room.json from src/components/desk/, so copy it there after a rebuild)

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
PREVIEW = "preview" in args[4:]  # place models and render two quick stills, no bake
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
    if bevel:
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=min(bevel, w / 2.5, h / 2.5, d / 2.5), segments=2, profile=0.5, affect="EDGES", clamp_overlap=True)
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
content = {n: mat(f"content-{n}", c, 0.85) for n, c in [("paper", "#ebe4d6"), ("card", "#f3eee4"), ("badge", "#f3eee4"), ("calendar", "#ece6dc"), ("photo", "#7a5a40")]}

# --- Room shell --------------------------------------------------------------------------
X0, X1, Z0, Z1, H = -1.4, 1.75, -0.84, 2.2, 2.6
box("floor", X1 - X0, 0.04, Z1 - Z0, ((X0 + X1) / 2, -0.02, (Z0 + Z1) / 2), floor, bevel=0)
box("wall-back", X1 - X0, H, 0.04, ((X0 + X1) / 2, H / 2, -0.82), wall, bevel=0)
# Left wall, built around the window opening (z -0.42..0.52, y 0.96..1.74)
WZ0, WZ1, WY0, WY1 = -0.42, 0.52, 0.96, 1.74
box("wall-left-low", 0.04, WY0, Z1 - Z0, (-1.38, WY0 / 2, (Z0 + Z1) / 2), wall, bevel=0)
box("wall-left-high", 0.04, H - WY1, Z1 - Z0, (-1.38, (WY1 + H) / 2, (Z0 + Z1) / 2), wall, bevel=0)
box("wall-left-back", 0.04, WY1 - WY0, WZ0 - Z0, (-1.38, (WY0 + WY1) / 2, (Z0 + WZ0) / 2), wall, bevel=0)
box("wall-left-front", 0.04, WY1 - WY0, Z1 - WZ1, (-1.38, (WY0 + WY1) / 2, (WZ1 + Z1) / 2), wall, bevel=0)
box("skirting-back", X1 - X0, 0.08, 0.015, ((X0 + X1) / 2, 0.04, -0.795), skirting, bevel=0.002)
box("skirting-left", 0.015, 0.08, Z1 - Z0, (-1.355, 0.04, (Z0 + Z1) / 2), skirting, bevel=0.002)
for i, (w, h, d, y, z) in enumerate([(0.07, 0.05, 1.02, WY0, 0.05), (0.07, 0.05, 1.02, WY1, 0.05), (0.07, 0.83, 0.05, 1.35, WZ0), (0.07, 0.83, 0.05, 1.35, WZ1), (0.06, 0.78, 0.03, 1.35, 0.05)]):
    box(f"window-frame-{i}", w, h, d, (-1.36, y, z), frame_wood, bevel=0.004)
box("window-sill", 0.12, 0.025, 1.12, (-1.32, WY0 - 0.035, 0.05), skirting, bevel=0.003)
sky = quad("sky", [(-1.5, 0.75, 0.75), (-1.5, 0.75, -0.65), (-1.5, 1.95, -0.65), (-1.5, 1.95, 0.75)], sky_mat)
box("rug", 1.5, 0.008, 1.1, (-0.05, 0.004, 0.55), rug, bevel=0.003)

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
cyl("mug", 0.04, 0.036, 0.095, (0.12, 0.8175, -0.22), ceramic)
box("mug-handle", 0.012, 0.05, 0.035, (0.165, 0.82, -0.22), ceramic, bevel=0.005)
cyl("pot", 0.065, 0.048, 0.11, (0.66, 0.825, -0.22), terracotta)
cyl("soil", 0.06, 0.06, 0.005, (0.66, 0.875, -0.22), mat("soil", "#2a1d14", 1.0))
for i, (dx, dy, dz, rx, ry, rz) in enumerate([(0, 0.95, 0, 0.07, 0.05, 0.07), (0.06, 0.99, 0.02, 0.06, 0.045, 0.05), (-0.055, 0.98, -0.02, 0.06, 0.05, 0.05), (0.02, 1.04, -0.03, 0.055, 0.05, 0.05), (-0.03, 0.93, 0.045, 0.05, 0.04, 0.05), (0.04, 0.92, -0.05, 0.05, 0.04, 0.045), (-0.01, 1.08, 0.01, 0.04, 0.04, 0.04)]):
    ball(f"leaf-{i}", (rx, ry, rz), (0.66 + dx, dy, -0.22 + dz), leaf)

# Chair, by the window, angled towards the desk
chair = bpy.data.objects.new("chair", None)
scene.collection.objects.link(chair)
place(chair, -0.82, 0, 0.85, (0, -0.55, 0))
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
    # The pin stays in the cork when its card is picked.
    ball(f"pin-{i}", (0.008, 0.008, 0.008), (x - math.sin(rz) * 0.042, y + math.cos(rz) * 0.042, -0.762), pin, parent=notes)

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
    drop = 0.25 + i * 0.012
    strap = drop - 0.05
    cyl(f"lanyard-{i}", 0.003, 0.003, strap, (0, -strap / 2, 0), lanyards[i % len(lanyards)], segments=6, parent=slot)
    box(f"badgebody-{i}", 0.07, 0.1, 0.003, (0, -drop, 0.0035), card_body, bevel=0, rot=(0, 0, (i - mid) * 0.04), parent=slot)
    upright(f"badge-{i}", 0.068, 0.098, (0, -drop, 0.0052), content["badge"], rz=(i - mid) * 0.04, parent=slot)

about = hot("about")
photo_frame = box("photo-frame", 0.13, 0.16, 0.014, (0.28, 0.84, -0.22), frame_wood, bevel=0.003, rot=(-0.15, -0.35, 0), parent=about)
upright("photo", 0.1, 0.13, (0, 0, 0.0075), content["photo"], parent=photo_frame)
box("photo-stand", 0.03, 0.12, 0.01, (0, -0.02, -0.04), frame_wood, bevel=0.002, rot=(0.5, 0, 0), parent=photo_frame)

contact = hot("contact")
phone = box("phone", 0.075, 0.01, 0.15, (0.4, 0.776, 0.2), plastic, bevel=0.004, rot=(0, 0.35, 0), parent=contact)
flat("phone-screen", 0.068, 0.14, (0, 0.0052, 0), phone_glass, parent=phone)

activity = hot("activity")
box("calendar-board", 0.36, 0.21, 0.008, (0.3, 1.6, -0.796), card_body, bevel=0.002, parent=activity)
upright("calendar", 0.344, 0.196, (0.3, 1.6, -0.7915), content["calendar"], parent=activity)
ball("calendar-nail", (0.005, 0.005, 0.005), (0.3, 1.712, -0.792), steel, parent=activity)

lamp = hot("lamp")
cyl("lamp-base", 0.07, 0.08, 0.02, (-0.62, 0.78, -0.2), black, parent=lamp)
cyl("lamp-arm-low", 0.008, 0.008, 0.42, (-0.62, 0.99, -0.2), steel, rot=(0, 0, -0.25), segments=10, parent=lamp)
ball("lamp-joint", (0.014, 0.014, 0.014), (-0.57, 1.19, -0.2), black, parent=lamp)
cyl("lamp-arm-high", 0.008, 0.008, 0.3, (-0.48, 1.22, -0.14), steel, rot=(0, 0, 1.0), segments=10, parent=lamp)
cyl("lamp-shade", 0.03, 0.08, 0.12, (-0.38, 1.21, -0.08), shade, rot=(0, 0, -0.5), parent=lamp)
ball("lamp-bulb", (0.026, 0.026, 0.026), (-0.365, 1.18, -0.08), bulb, parent=lamp)

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

    # Chair (already licensed for the old desk): faces +z in three terms, so turn it to face the desk.
    parts = import_parts(A("chair.glb"))
    remove(*[n for n in parts if "construction" in n])
    for name in [n for n in list(bpy.data.objects.keys()) if n.startswith("chair-")]:
        remove(name)
    keep = [o for n, o in parts.items() if "construction" not in n]
    fit(keep, size=1.1, axis=2, at=(0, 0, 0), turn=math.pi)
    join(keep, "chair-model", chair)

    # Plant: authored lying down; stand it up and put it where the built one was.
    parts = list(import_parts(A("potted-anthurium", "Anthurium_andreanum_obj", "Anthurium_andreanum_obj.obj")).values())
    fit(parts, size=0.34, axis=2, at=(0.66, 0.77, -0.22), tilt=("X", -math.pi / 2))
    plant = join(parts, "plant")
    decimate(plant, 9000)
    remove("pot", "soil", *[f"leaf-{i}" for i in range(7)])

    # Lamp: base at the back-left corner of the desk, head reaching over the keyboard.
    parts = list(import_parts(A("articulating-desk-lamp", "[OBJ] Decor_Lamp_On", "Decor_Lamp_On.obj")).values())
    fit(parts, size=0.44, axis=2, at=(-0.5, 0.77, -0.16), turn=0.0)
    lamp_model = join(parts, "lamp-model", lamp)
    decimate(lamp_model, 12000)
    remove("lamp-base", "lamp-arm-low", "lamp-joint", "lamp-arm-high", "lamp-shade")
    # Its .mtl only has placeholder wire colours; the real bronze is the base-colour map in Extras.
    bronze = bpy.data.materials.new("lamp-bronze")
    bronze.use_nodes = True
    texture = bronze.node_tree.nodes.new("ShaderNodeTexImage")
    texture.image = bpy.data.images.load(A("articulating-desk-lamp", "Extras", "Clock_Lamp_Glasses_BaseColor.png"))
    bsdf = bronze.node_tree.nodes["Principled BSDF"]
    bronze.node_tree.links.new(texture.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.45
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
    join(monitor, "monitor-model", work)
    join([o for o in desk_kit if o not in monitor], "keyboard-model")
    tlo = np.min([bounds(o)[0] for o in tower], 0)
    thi = np.max([bounds(o)[1] for o in tower], 0)
    for o in tower:
        o.data.transform(Matrix.Translation((-0.45 - (tlo[0] + thi[0]) / 2, 0.05 - (tlo[1] + thi[1]) / 2, -tlo[2])))
    join(tower, "tower")
    # The page paints the screen; this face sits just in front of the model's own display.
    remove("screen", "monitor", "monitor-back", "monitor-neck", "monitor-base", "keyboard", "mouse")
    bpy.data.objects.remove(display, do_unlink=True)
    sw, sh = (dhi[0] - dlo[0]) * 0.96, (dhi[2] - dlo[2]) * 0.94
    cx, cy, cz = (dlo[0] + dhi[0]) / 2, (dlo[2] + dhi[2]) / 2, -dlo[1] + 0.002
    upright("screen", sw, sh, (cx, cy, cz), glass_dark, parent=work)

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

spot = light("lamp-light", "SPOT", LAMP_HEAD, spot_size=1.7, spot_blend=0.7, shadow_soft_size=0.02, color=(1, 0.78, 0.56))
aim(spot, (-0.2, 0.75, 0.12))
wash = light("wash", "POINT", (-0.1, 1.9, -0.3), shadow_soft_size=0.4, color=(1, 0.8, 0.6))
moon = light("moon", "SUN", (0, 3, 0), angle=0.02, color=(0.62, 0.7, 1))
aim(moon, (1.2, -0.9, 0.3))
moon.location = (0, 0, 0)
ceiling = light("ceiling", "AREA", (0.1, 2.55, 0.5), size=2.2, color=(1, 0.95, 0.88))
aim(ceiling, (0.1, 0, 0.5))
sun = light("sun", "SUN", (0, 3, 0), angle=0.05, color=(1, 0.92, 0.8))
strip = light("strip-light", "AREA", (0.85, 1.34, -0.66), shape="RECTANGLE", size=0.5, size_y=0.02, color=(1, 0.82, 0.6))
aim(sun, (1.4, -0.8, 0.5))


def emit(material, strength):
    material.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = strength


def rig(theme):
    night = theme == "dark"
    background.inputs["Color"].default_value = (0.004, 0.004, 0.006, 1) if night else (0.5, 0.48, 0.46, 1)
    background.inputs["Strength"].default_value = 1.0 if night else 0.6
    spot.data.energy = 110 if night else 14
    wash.data.energy = 2.4 if night else 0
    moon.data.energy = 0.08 if night else 0
    ceiling.data.energy = 0 if night else 140
    sun.data.energy = 0 if night else 2.2
    emit(bulb, 25 if night else 15)
    emit(glass_dark, 2.4 if night else 0.8)
    emit(phone_glass, 0.3)
    strip.data.energy = 0.55 if night else 0.4
    emit(strip_glow, 1.4 if night else 0.8)
    emit(sky_mat, 0.25 if night else 3.5)
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

if PREVIEW:
    rig("dark")
    camera = bpy.data.objects.new("camera", bpy.data.cameras.new("camera"))
    scene.collection.objects.link(camera)
    camera.data.sensor_fit = "VERTICAL"
    camera.data.angle = math.radians(38)
    scene.camera = camera
    scene.render.resolution_x, scene.render.resolution_y = 1200, 750
    scene.cycles.samples = 48
    scene.cycles.use_denoising = True
    scene.view_settings.exposure = 0.6
    for name, pos, look in [("room", (1.55, 1.6, 2.45), (-0.2, 1.05, -0.1)), ("desk", (0.4, 1.3, 1.3), (-0.1, 0.95, -0.2)), ("wall", (-0.2, 1.4, 0.9), (-0.5, 1.3, -0.8))]:
        camera.location = P(*pos)
        aim(camera, look)
        scene.render.filepath = os.path.join(OUT, f"preview-{name}.png")
        bpy.ops.render.render(write_still=True)
    print("done preview", OUT)
    sys.exit(0)

# --- Lightmap UVs ------------------------------------------------------------------------
UNLIT = {"screen", "phone-screen", "sky", "lamp-bulb", "shelf-strip"}
baked = [o for o in scene.objects if o.type == "MESH" and o.name not in UNLIT]
for obj in scene.objects:
    if obj.type == "MESH":
        if not obj.data.uv_layers:
            obj.data.uv_layers.new(name="UVMap")
        obj.data.uv_layers.new(name="lightmap")
        obj.data.uv_layers.active_index = 1

bpy.ops.object.select_all(action="DESELECT")
for obj in baked:
    obj.select_set(True)
bpy.context.view_layer.objects.active = baked[0]
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.003, area_weight=0, scale_to_bounds=False)
bpy.ops.uv.pack_islands(margin=0.004, rotate=True, scale=True)
bpy.ops.object.mode_set(mode="OBJECT")

# --- Bake --------------------------------------------------------------------------------
target = bpy.data.images.new("lightmap", SIZE, SIZE, alpha=True, float_buffer=True)
target.generated_color = (0, 0, 0, 0)
for material in {slot.material for obj in baked for slot in obj.material_slots}:
    node = material.node_tree.nodes.new("ShaderNodeTexImage")
    node.image = target
    material.node_tree.nodes.active = node

scene.render.bake.margin = 8
scene.render.bake.use_clear = True
scales = {}


def soften(rgb, used, r=3):
    """Masked box blur: takes the edge off bake noise without pulling in empty texels."""
    img, w = rgb * used[..., None], used.astype(np.float32)
    acc, wacc = np.zeros_like(img), np.zeros_like(w)
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            acc += np.roll(img, (dy, dx), (0, 1))
            wacc += np.roll(w, (dy, dx), (0, 1))
    return np.where(used[..., None], acc / np.maximum(wacc[..., None], 1e-6), rgb)


def srgb(v):
    return np.where(v <= 0.0031308, v * 12.92, 1.055 * np.power(v, 1 / 2.4) - 0.055)


for theme in ("dark", "light"):
    rig(theme)
    started = time.time()
    bpy.ops.object.bake(type="DIFFUSE", pass_filter={"DIRECT", "INDIRECT"}, margin=8, use_clear=True)
    print(f"bake {theme}: {time.time() - started:.0f}s")
    px = np.empty(SIZE * SIZE * 4, dtype=np.float32)
    target.pixels.foreach_get(px)
    px = px.reshape(-1, 4)
    used = px[:, 3] > 0.5
    lum = px[used, :3] @ np.array([0.2126, 0.7152, 0.0722])
    # Fit nearly the brightest texel into 8 bits; a lower cut clips the lamp pool and dulls the room.
    scale = 0.95 / max(float(np.percentile(lum, 99.95)), 1e-4)
    scales[theme] = scale
    rgb = soften(px[:, :3].reshape(SIZE, SIZE, 3), used.reshape(SIZE, SIZE)).reshape(-1, 3)
    out = np.ones_like(px)
    out[:, :3] = srgb(np.clip(rgb * scale, 0, 1))
    image = bpy.data.images.new(f"out-{theme}", SIZE, SIZE, alpha=False, float_buffer=False)
    image.colorspace_settings.name = "sRGB"
    image.pixels.foreach_set(out.ravel())
    png = os.path.join(OUT, f"light-{theme}.png")
    image.filepath_raw = png
    image.file_format = "PNG"
    image.save()
    subprocess.run(["cwebp", "-quiet", "-q", "92", png, "-o", os.path.join(OUT, f"light-{theme}.webp")], check=True)
    os.remove(png)
    print(f"baked {theme}: scale {scale:.3f}")

# --- Poster (night) ----------------------------------------------------------------------
rig("dark")
camera = bpy.data.objects.new("camera", bpy.data.cameras.new("camera"))
scene.collection.objects.link(camera)
camera.data.sensor_fit = "VERTICAL"
camera.data.angle = math.radians(38)
camera.location = P(1.55, 1.6, 2.45)
aim(camera, (-0.2, 1.05, -0.1))
scene.camera = camera
scene.render.resolution_x, scene.render.resolution_y = 1600, 1000
scene.cycles.samples = 160
scene.cycles.use_denoising = True
scene.view_settings.exposure = 0.6
poster = os.path.join(OUT, "poster.png")
scene.render.filepath = poster
bpy.ops.render.render(write_still=True)
subprocess.run(["cwebp", "-quiet", "-q", "80", poster, "-o", os.path.join(OUT, "poster.webp")], check=True)
os.remove(poster)

# --- Export ------------------------------------------------------------------------------
for material in bpy.data.materials:
    if not material.node_tree:
        continue
    for node in [n for n in material.node_tree.nodes if n.type == "TEX_IMAGE"]:
        # Drop the bake target and any map that isn't base colour (normals, specular…): the page only uses colour.
        if node.image == target or not any(link.to_socket.name == "Base Color" for link in node.outputs["Color"].links):
            material.node_tree.nodes.remove(node)
bpy.ops.object.select_all(action="DESELECT")
for obj in scene.objects:
    obj.select_set(obj.type in {"MESH", "EMPTY"})
bpy.ops.export_scene.gltf(
    filepath=os.path.join(OUT, "room.glb"), export_format="GLB", use_selection=True,
    export_texcoords=True, export_normals=False, export_materials="EXPORT", export_lights=False, export_cameras=False, export_yup=True,
    export_image_format="WEBP", export_image_quality=80,
)
with open(os.path.join(OUT, "room.json"), "w") as f:
    json.dump({"scale": scales, "size": SIZE}, f)
print("done", OUT)

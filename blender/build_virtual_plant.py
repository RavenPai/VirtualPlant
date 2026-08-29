"""
Virtual Plant — photorealistic procedural Blender asset
======================================================
Run inside Blender 3.6+ / 4.x:

    blender --background --python blender/build_virtual_plant.py

Or open Blender → Scripting → Open this file → Run Script.

Output (transparent PNG sequence by default):
    blender/output/plant_####.png
"""

from __future__ import annotations

import math
import os
from pathlib import Path

import bpy
from mathutils import Vector


# ---------------------------------------------------------------------------
# Palette & timeline
# ---------------------------------------------------------------------------

PALETTE = {
    "leaf_healthy": (0x52 / 255, 0xB7 / 255, 0x88 / 255, 1.0),  # #52B788 Soft Sage
    "leaf_dry": (0xE9 / 255, 0xC4 / 255, 0x6A / 255, 1.0),  # #E9C46A Dry Wheat
    "fruit_ripe": (0xF4 / 255, 0xA2 / 255, 0x61 / 255, 1.0),  # #F4A261 Warm Apricot
    "fruit_dead": (0x6C / 255, 0x75 / 255, 0x7D / 255, 1.0),  # #6C757D Muted Pewter
    "bark": (0.28, 0.17, 0.10, 1.0),
    "bark_moss": (0.22, 0.28, 0.16, 1.0),
}

GROWTH_KEYS = {
    1: "sprout",
    30: "sapling",
    70: "canopy",
    100: "fruited",
}
HEALTH_DECAY_START = 101
HEALTH_DECAY_PEAK = 150
HEALTH_RECOVER_END = 200
FRAME_START = 1
FRAME_END = 200

SCRIPT_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = SCRIPT_DIR / "output"

# "PNG" for a transparent sequence (web scrubbing). "WEBM" for VP9 + alpha.
OUTPUT_FORMAT = "PNG"


# ---------------------------------------------------------------------------
# Scene bootstrap
# ---------------------------------------------------------------------------

def hex_rgba(hex_str: str) -> tuple[float, float, float, float]:
    h = hex_str.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return (r / 255.0, g / 255.0, b / 255.0, 1.0)


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for item in list(block):
            block.remove(item)
    for coll in list(bpy.data.collections):
        if coll.name != "Collection":
            bpy.data.collections.remove(coll)


def setup_render(scene: bpy.types.Scene) -> None:
    scene.frame_start = FRAME_START
    scene.frame_end = FRAME_END
    scene.frame_current = FRAME_START
    scene.render.resolution_x = 1080
    scene.render.resolution_y = 1920
    scene.render.resolution_percentage = 100
    scene.render.fps = 24
    scene.render.film_transparent = True
    scene.render.filepath = str(OUTPUT_DIR / "plant_")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if OUTPUT_FORMAT == "WEBM":
        scene.render.image_settings.file_format = "FFMPEG"
        scene.render.ffmpeg.format = "WEBM"
        scene.render.ffmpeg.codec = "WEBM"
        scene.render.image_settings.color_mode = "RGBA"
        try:
            scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
        except TypeError:
            pass
    else:
        scene.render.image_settings.file_format = "PNG"
        scene.render.image_settings.color_mode = "RGBA"
        scene.render.image_settings.color_depth = "16"
        scene.render.image_settings.compression = 15

    # Cycles for photoreal shading; falls back if unavailable.
    if "CYCLES" in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items.keys():
        scene.render.engine = "CYCLES"
        scene.cycles.samples = 64
        scene.cycles.use_denoising = True
        scene.cycles.transparent_max_bounces = 8
    else:
        scene.render.engine = "BLENDER_EEVEE_NEXT" if hasattr(bpy.types.Scene, "eevee") else "BLENDER_EEVEE"

    world = bpy.data.worlds.new("PlantWorld") if "PlantWorld" not in bpy.data.worlds else bpy.data.worlds["PlantWorld"]
    scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.inputs["Color"].default_value = (0.04, 0.05, 0.04, 1.0)
    bg.inputs["Strength"].default_value = 0.35
    out = nt.nodes.new("ShaderNodeOutputWorld")
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])


def setup_camera(scene: bpy.types.Scene) -> bpy.types.Object:
    cam_data = bpy.data.cameras.new("PlantOrthoCam")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = 4.2
    cam_data.clip_start = 0.01
    cam_data.clip_end = 40.0
    cam = bpy.data.objects.new("PlantOrthoCam", cam_data)
    scene.collection.objects.link(cam)
    # Front view: camera on -Y looking toward +Y (plant grows +Z).
    cam.location = (0.0, -6.5, 1.55)
    cam.rotation_euler = (math.radians(90.0), 0.0, 0.0)
    scene.camera = cam
    return cam


def setup_lights(scene: bpy.types.Scene) -> None:
    def area(name, loc, rot, energy, size, color):
        data = bpy.data.lights.new(name, "AREA")
        data.energy = energy
        data.size = size
        data.color = color
        data.shadow_soft_size = 0.6
        obj = bpy.data.objects.new(name, data)
        scene.collection.objects.link(obj)
        obj.location = loc
        obj.rotation_euler = rot
        return obj

    # Key (soft sun from upper front-right)
    area("KeyLight", (2.4, -3.2, 4.0), (math.radians(50), 0, math.radians(25)), 450, 3.2, (1.0, 0.97, 0.92))
    # Cool fill
    area("FillLight", (-3.0, -2.4, 1.8), (math.radians(75), 0, math.radians(-35)), 120, 4.0, (0.78, 0.86, 1.0))
    # Rim / subsurface catch
    area("RimLight", (0.2, 3.4, 2.6), (math.radians(110), 0, math.radians(180)), 180, 2.4, (0.95, 1.0, 0.9))


# ---------------------------------------------------------------------------
# Materials (Principled BSDF + MixRGB, Fac keyframed)
# ---------------------------------------------------------------------------

def _link(nt, a, b):
    nt.links.new(a, b)


def _mix_rgb(nt):
    """Blender 3 MixRGB or Blender 4+ ShaderNodeMix (Color)."""
    if hasattr(bpy.types, "ShaderNodeMixRGB"):
        return nt.nodes.new("ShaderNodeMixRGB")
    node = nt.nodes.new("ShaderNodeMix")
    if "data_type" in node.bl_rna.properties:
        node.data_type = "RGBA"
    return node


def make_bark_material() -> bpy.types.Material:
    mat = bpy.data.materials.new("Bark")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    noise = nt.nodes.new("ShaderNodeTexNoise")
    bump = nt.nodes.new("ShaderNodeBump")
    mix = _mix_rgb(nt)
    texcoord = nt.nodes.new("ShaderNodeTexCoord")
    mapping = nt.nodes.new("ShaderNodeMapping")

    noise.inputs["Scale"].default_value = 18.0
    noise.inputs["Detail"].default_value = 12.0
    noise.inputs["Roughness"].default_value = 0.55
    bump.inputs["Strength"].default_value = 0.35
    mix.inputs["Fac"].default_value = 0.22
    if "Color1" in mix.inputs:
        mix.inputs["Color1"].default_value = PALETTE["bark"]
        mix.inputs["Color2"].default_value = PALETTE["bark_moss"]
    else:
        mix.inputs["A"].default_value = PALETTE["bark"]
        mix.inputs["B"].default_value = PALETTE["bark_moss"]

    bsdf.inputs["Roughness"].default_value = 0.82
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.18
    elif "Specular" in bsdf.inputs:
        bsdf.inputs["Specular"].default_value = 0.18

    _link(nt, texcoord.outputs["Object"], mapping.inputs["Vector"])
    _link(nt, mapping.outputs["Vector"], noise.inputs["Vector"])
    _link(nt, noise.outputs["Fac"], mix.inputs["Fac"])
    color_out = mix.outputs["Color"] if "Color" in mix.outputs else mix.outputs[2]
    _link(nt, color_out, bsdf.inputs["Base Color"])
    _link(nt, noise.outputs["Fac"], bump.inputs["Height"])
    _link(nt, bump.outputs["Normal"], bsdf.inputs["Normal"])
    _link(nt, bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def make_leaf_material() -> tuple[bpy.types.Material, bpy.types.Node]:
    """Soft Sage ↔ Dry Wheat via MixRGB Fac (0 healthy, 1 neglected)."""
    mat = bpy.data.materials.new("LeafHealth")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    mix = _mix_rgb(nt)
    mix.name = "LeafHealthMix"
    noise = nt.nodes.new("ShaderNodeTexNoise")
    bump = nt.nodes.new("ShaderNodeBump")
    ramp = nt.nodes.new("ShaderNodeValToRGB")

    mix.inputs["Fac"].default_value = 0.0
    c1 = mix.inputs.get("Color1") or mix.inputs.get("A")
    c2 = mix.inputs.get("Color2") or mix.inputs.get("B")
    c1.default_value = PALETTE["leaf_healthy"]
    c2.default_value = PALETTE["leaf_dry"]

    noise.inputs["Scale"].default_value = 42.0
    noise.inputs["Detail"].default_value = 8.0
    bump.inputs["Strength"].default_value = 0.12
    ramp.color_ramp.elements[0].position = 0.35
    ramp.color_ramp.elements[1].position = 0.85

    bsdf.inputs["Roughness"].default_value = 0.38
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.28
    if "Subsurface Weight" in bsdf.inputs:
        bsdf.inputs["Subsurface Weight"].default_value = 0.18
        if "Subsurface Radius" in bsdf.inputs:
            bsdf.inputs["Subsurface Radius"].default_value = (0.6, 0.9, 0.4)
    elif "Subsurface" in bsdf.inputs:
        bsdf.inputs["Subsurface"].default_value = 0.12

    color_out = mix.outputs.get("Color") or mix.outputs[2]
    _link(nt, color_out, bsdf.inputs["Base Color"])
    _link(nt, noise.outputs["Fac"], ramp.inputs["Fac"])
    _link(nt, ramp.outputs["Color"], bump.inputs["Height"])
    _link(nt, bump.outputs["Normal"], bsdf.inputs["Normal"])
    _link(nt, bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat, mix


def make_fruit_material() -> tuple[bpy.types.Material, bpy.types.Node]:
    """Warm Apricot ↔ Muted Pewter via MixRGB Fac."""
    mat = bpy.data.materials.new("FruitHealth")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    mix = _mix_rgb(nt)
    mix.name = "FruitHealthMix"

    mix.inputs["Fac"].default_value = 0.0
    c1 = mix.inputs.get("Color1") or mix.inputs.get("A")
    c2 = mix.inputs.get("Color2") or mix.inputs.get("B")
    c1.default_value = PALETTE["fruit_ripe"]
    c2.default_value = PALETTE["fruit_dead"]

    bsdf.inputs["Roughness"].default_value = 0.32
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.45
    if "Subsurface Weight" in bsdf.inputs:
        bsdf.inputs["Subsurface Weight"].default_value = 0.22
    elif "Subsurface" in bsdf.inputs:
        bsdf.inputs["Subsurface"].default_value = 0.15

    color_out = mix.outputs.get("Color") or mix.outputs[2]
    _link(nt, color_out, bsdf.inputs["Base Color"])
    _link(nt, bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat, mix


def assign_mat(obj: bpy.types.Object, mat: bpy.types.Material) -> None:
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)


# ---------------------------------------------------------------------------
# Geometry helpers
# ---------------------------------------------------------------------------

def _curve_object(name: str, points: list[Vector], depth: float, res=12) -> bpy.types.Object:
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 12
    curve.bevel_depth = depth
    curve.bevel_resolution = res
    curve.fill_mode = "FULL"
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for i, p in enumerate(points):
        bp = spline.bezier_points[i]
        bp.co = p
        bp.handle_left_type = "AUTO"
        bp.handle_right_type = "AUTO"
        radius = 1.0 - (i / max(1, len(points) - 1)) * 0.55
        bp.radius = max(0.22, radius)
    obj = bpy.data.objects.new(name, curve)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def _to_mesh(obj: bpy.types.Object) -> bpy.types.Object:
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    bpy.ops.object.shade_smooth()
    obj.select_set(False)
    return obj


def _leaf_mesh() -> bpy.types.Mesh:
    mesh = bpy.data.meshes.new("LeafMesh")
    # Tapered ovate leaf in XY, tip +Y, slight Z cup.
    rings = [
        (0.00, 0.00, 0.00, 0.04),
        (0.18, 0.22, 0.01, 0.16),
        (0.42, 0.28, 0.025, 0.22),
        (0.68, 0.18, 0.02, 0.14),
        (0.92, 0.06, 0.008, 0.05),
        (1.05, 0.00, 0.0, 0.0),
    ]
    verts = [(-0.01, 0.0, 0.0), (0.01, 0.0, 0.0)]
    for y, w, z, _ in rings[:-1]:
        verts.append((-w, y, z))
        verts.append((w, y, z + 0.002))
    verts.append((0.0, rings[-1][0], 0.0))
    faces = []
    # stem quad
    faces.append((0, 1, 3, 2))
    for i in range(1, len(rings) - 1):
        a = 2 * i
        b = 2 * i + 1
        c = 2 * i + 3
        d = 2 * i + 2
        if c < len(verts) - 1:
            faces.append((a, b, c, d))
    last_l = len(verts) - 3
    last_r = len(verts) - 2
    tip = len(verts) - 1
    faces.append((last_l, last_r, tip))
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    mesh.polygons.foreach_set("use_smooth", [True] * len(mesh.polygons))
    return mesh


def build_trunk(bark_mat: bpy.types.Material) -> dict:
    """Tapered trunk + branching laterals. Returns dict of mesh objects."""
    trunk = _curve_object(
        "Trunk",
        [
            Vector((0.0, 0.0, 0.0)),
            Vector((0.02, 0.01, 0.45)),
            Vector((-0.03, -0.02, 1.05)),
            Vector((0.04, 0.03, 1.75)),
            Vector((0.01, 0.0, 2.35)),
        ],
        depth=0.085,
    )
    trunk = _to_mesh(trunk)
    assign_mat(trunk, bark_mat)

    branch_defs = [
        ("Branch_L1", [Vector((0.0, 0.0, 0.95)), Vector((-0.35, 0.08, 1.15)), Vector((-0.72, 0.12, 1.42))], 0.034),
        ("Branch_R1", [Vector((0.0, 0.0, 1.05)), Vector((0.38, -0.06, 1.22)), Vector((0.78, -0.1, 1.55))], 0.032),
        ("Branch_L2", [Vector((0.0, 0.0, 1.45)), Vector((-0.28, -0.1, 1.7)), Vector((-0.55, -0.12, 2.05))], 0.026),
        ("Branch_R2", [Vector((0.0, 0.0, 1.55)), Vector((0.3, 0.14, 1.82)), Vector((0.58, 0.18, 2.18))], 0.025),
        ("Branch_C", [Vector((0.0, 0.0, 1.9)), Vector((0.05, 0.2, 2.2)), Vector((0.08, 0.28, 2.55))], 0.022),
    ]
    branches = []
    for name, pts, depth in branch_defs:
        br = _curve_object(name, pts, depth)
        br = _to_mesh(br)
        assign_mat(br, bark_mat)
        br.parent = trunk
        branches.append(br)

    return {"trunk": trunk, "branches": branches}


def spawn_leaves(parts: dict, leaf_mat: bpy.types.Material) -> list[bpy.types.Object]:
    """Two-leaf sprout plus later canopy clusters parented to trunk/branches."""
    mesh = _leaf_mesh()
    leaves: list[bpy.types.Object] = []

    def add_leaf(name, loc, rot, scale, parent, layer):
        obj = bpy.data.objects.new(name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        obj.location = loc
        obj.rotation_euler = rot
        obj.scale = (scale, scale, scale)
        obj.parent = parent
        assign_mat(obj, leaf_mat)
        obj["leaf_layer"] = layer
        leaves.append(obj)
        return obj

    trunk = parts["trunk"]
    # Axis A / Frame 1: two opposite cotyledon leaves
    add_leaf("Leaf_Sprout_L", (-0.08, 0.0, 0.22), (math.radians(55), 0, math.radians(18)), 0.55, trunk, "sprout")
    add_leaf("Leaf_Sprout_R", (0.08, 0.0, 0.22), (math.radians(55), 0, math.radians(-18)), 0.55, trunk, "sprout")

    # Sapling leaves (frame 30)
    sapling_poses = [
        ((-0.22, 0.04, 0.72), (0.9, 0.1, 0.4), 0.42),
        ((0.24, -0.03, 0.78), (0.85, -0.15, -0.35), 0.4),
        ((-0.12, 0.1, 1.05), (0.7, 0.2, 0.15), 0.38),
        ((0.14, -0.08, 1.12), (0.75, -0.1, -0.2), 0.36),
        ((0.0, 0.06, 1.28), (0.55, 0.0, 0.05), 0.34),
    ]
    for i, (loc, rot, sc) in enumerate(sapling_poses):
        add_leaf(f"Leaf_Sapling_{i}", loc, rot, sc, trunk, "sapling")

    # Mature canopy (frame 70) — dense clusters at branch tips
    import random

    rng = random.Random(42)
    branches = parts["branches"]
    idx = 0
    for br in branches:
        tip = Vector(br.location) + Vector((0, 0, max(0.15, br.dimensions.z * 0.35)))
        for _ in range(14):
            jitter = Vector(
                (
                    rng.uniform(-0.28, 0.28),
                    rng.uniform(-0.18, 0.18),
                    rng.uniform(-0.08, 0.32),
                )
            )
            rot = (
                rng.uniform(0.35, 1.15),
                rng.uniform(-0.5, 0.5),
                rng.uniform(-math.pi, math.pi),
            )
            sc = rng.uniform(0.28, 0.48)
            add_leaf(f"Leaf_Canopy_{idx}", tip + jitter, rot, sc, trunk, "canopy")
            idx += 1

    return leaves


def spawn_fruits(parts: dict, fruit_mat: bpy.types.Material) -> list[bpy.types.Object]:
    fruits = []
    rng_locs = [
        (-0.55, 0.08, 1.48),
        (0.62, -0.06, 1.58),
        (-0.38, -0.1, 1.92),
        (0.42, 0.16, 2.08),
        (0.06, 0.22, 2.38),
        (-0.18, 0.12, 2.18),
        (0.28, -0.14, 1.78),
        (-0.48, 0.18, 1.7),
    ]
    trunk = parts["trunk"]
    for i, loc in enumerate(rng_locs):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=0.07, location=loc)
        fruit = bpy.context.active_object
        fruit.name = f"Fruit_{i}"
        fruit.parent = trunk
        assign_mat(fruit, fruit_mat)
        bpy.ops.object.shade_smooth()
        fruits.append(fruit)
    return fruits


# ---------------------------------------------------------------------------
# Animation
# ---------------------------------------------------------------------------

def _kf_scale(obj: bpy.types.Object, frame: int, scale: float | tuple, interp="BEZIER") -> None:
    if isinstance(scale, (int, float)):
        obj.scale = (scale, scale, scale)
    else:
        obj.scale = scale
    obj.keyframe_insert(data_path="scale", frame=frame)
    ad = obj.animation_data
    action = getattr(ad, "action", None) if ad else None
    if action is None:
        return
    fcurves = getattr(action, "fcurves", None)
    if fcurves is None:
        return
    for fc in fcurves:
        if fc.data_path != "scale":
            continue
        for kp in fc.keyframe_points:
            if int(kp.co.x) == frame:
                kp.interpolation = interp


def _kf_mix(mix_node: bpy.types.Node, frame: int, fac: float) -> None:
    sock = mix_node.inputs["Fac"]
    sock.default_value = fac
    sock.keyframe_insert(data_path="default_value", frame=frame)


def animate_growth(parts: dict, leaves: list[bpy.types.Object], fruits: list[bpy.types.Object]) -> None:
    """
    Frames 1–100, health locked at 100%.
    1 sprout → 30 sapling → 70 canopy → 100 fruited full size.
    """
    trunk = parts["trunk"]
    branches = parts["branches"]

    # Whole-plant scale envelope (always healthy geometry, just growing)
    for frame, scale in ((1, 0.22), (30, 0.55), (70, 0.92), (100, 1.0)):
        _kf_scale(trunk, frame, scale)

    # Branches emerge at sapling
    for br in branches:
        _kf_scale(br, 1, 0.02)
        _kf_scale(br, 28, 0.08)
        _kf_scale(br, 30, 0.55)
        _kf_scale(br, 70, 1.0)
        _kf_scale(br, 100, 1.0)

    for leaf in leaves:
        layer = leaf.get("leaf_layer")
        if layer == "sprout":
            _kf_scale(leaf, 1, 1.0)
            _kf_scale(leaf, 100, 1.0)
        elif layer == "sapling":
            _kf_scale(leaf, 1, 0.0)
            _kf_scale(leaf, 28, 0.0)
            _kf_scale(leaf, 30, 1.0)
            _kf_scale(leaf, 100, 1.0)
        else:  # canopy
            _kf_scale(leaf, 1, 0.0)
            _kf_scale(leaf, 68, 0.0)
            _kf_scale(leaf, 70, 0.85)
            _kf_scale(leaf, 100, 1.0)

    for fruit in fruits:
        _kf_scale(fruit, 1, 0.0)
        _kf_scale(fruit, 90, 0.0)
        _kf_scale(fruit, 100, 1.0)


def animate_health(
    leaf_mix: bpy.types.Node,
    fruit_mix: bpy.types.Node,
    fruits: list[bpy.types.Object],
    parts: dict,
) -> None:
    """
    Frames 101–200, size locked at 100%.
    101–150 neglect (sage→wheat, apricot→pewter, slight shrivel)
    151–200 recovery back to healthy.
    """
    trunk = parts["trunk"]
    _kf_scale(trunk, 100, 1.0)
    _kf_scale(trunk, HEALTH_RECOVER_END, 1.0)

    for frame, fac in (
        (100, 0.0),
        (HEALTH_DECAY_START, 0.0),
        (HEALTH_DECAY_PEAK, 1.0),
        (HEALTH_RECOVER_END, 0.0),
    ):
        _kf_mix(leaf_mix, frame, fac)
        _kf_mix(fruit_mix, frame, fac)

    for fruit in fruits:
        _kf_scale(fruit, 100, 1.0)
        _kf_scale(fruit, HEALTH_DECAY_START, 1.0)
        _kf_scale(fruit, HEALTH_DECAY_PEAK, 0.72)  # shrivel
        _kf_scale(fruit, HEALTH_RECOVER_END, 1.0)


# ---------------------------------------------------------------------------
# Entry
# ---------------------------------------------------------------------------

def build_plant() -> None:
    scene = bpy.context.scene
    clear_scene()
    setup_render(scene)
    setup_camera(scene)
    setup_lights(scene)

    bark = make_bark_material()
    leaf_mat, leaf_mix = make_leaf_material()
    fruit_mat, fruit_mix = make_fruit_material()

    parts = build_trunk(bark)
    leaves = spawn_leaves(parts, leaf_mat)
    fruits = spawn_fruits(parts, fruit_mat)

    animate_growth(parts, leaves, fruits)
    animate_health(leaf_mix, fruit_mix, fruits, parts)

    scene.frame_set(1)
    print(f"Virtual Plant ready. Frames {FRAME_START}-{FRAME_END}. Output → {OUTPUT_DIR}")
    print("Render: F12 (still) or Ctrl+F12 (animation). Film transparent is ON.")


if __name__ == "__main__":
    build_plant()

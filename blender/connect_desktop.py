"""Enable BlenderMCP on the desktop app and build the Virtual Plant scene."""
from __future__ import annotations

import sys
from pathlib import Path

import addon_utils
import bpy

PLANT_SCRIPT = Path(__file__).with_name("build_virtual_plant.py")


def enable_mcp() -> None:
    # Sidecar file: AppData/.../scripts/addons/addon.py (ahujasid blender-mcp)
    for mod in ("addon", "blender_mcp"):
        try:
            addon_utils.enable(mod, default_set=True, persistent=True)
        except Exception as exc:
            print(f"Could not enable {mod}: {exc}")

    scene = bpy.context.scene
    if hasattr(scene, "blendermcp_port"):
        scene.blendermcp_port = 9876
    if hasattr(scene, "blendermcp_auto_start_server"):
        scene.blendermcp_auto_start_server = True

    try:
        bpy.ops.blendermcp.start_server()
        print("BlenderMCP listening on localhost:9876")
    except Exception as exc:
        print(f"blendermcp.start_server: {exc}")


def main() -> None:
    if PLANT_SCRIPT.exists():
        src = PLANT_SCRIPT.read_text(encoding="utf-8")
        namespace = {
            "__name__": "__main__",
            "__file__": str(PLANT_SCRIPT),
        }
        exec(compile(src, str(PLANT_SCRIPT), "exec"), namespace)
    else:
        print("Missing", PLANT_SCRIPT)
    enable_mcp()
    print("Desktop Blender is connected. Keep this window open for Cursor MCP.")


if __name__ == "__main__":
    main()

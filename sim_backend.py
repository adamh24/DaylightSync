"""
DaylightSync – Simulation Backend
Runs the full FastAPI server with a fake lux sensor instead of real MQTT/Zigbee.
No Mosquitto or Zigbee hardware required.

Run:
    .venv\\Scripts\\python.exe -m uvicorn sim_backend:app --reload --port 8000
"""

# ── Imports ───────────────────────────────────────────────────────────────────

import asyncio
import json
import math
import time
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="DaylightSync Simulation")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── State ─────────────────────────────────────────────────────────────────────

state = {
    "lux": 0,
    "brightness": 50,
    "mode": "auto",
    "zones": {
        "bar_counter": {"connected": True, "enabled": True, "brightness": 70},
        "seating": {"connected": True, "enabled": True, "brightness": 60},
        "accent": {"connected": True, "enabled": True, "brightness": 45},
        "window": {"connected": True, "enabled": True, "brightness": 55},
        "entry": {"connected": True, "enabled": True, "brightness": 50},
        "back_wall": {"connected": True, "enabled": True, "brightness": 40},
    },
    "sim_speed": 60,          # 1 sim-second = how many real seconds to skip
    "sim_time_of_day": 8.0,   # hours (0-24)
    "sim_lux_manual": None,   # None = auto day/night cycle; float = pinned lux
    "log": [],                # activity log for the dashboard
}

MAX_LOG = 40  # keep last 40 entries

# ── Helpers ───────────────────────────────────────────────────────────────────

def _log(msg: str):
    state["log"].append(msg)
    if len(state["log"]) > MAX_LOG:
        state["log"].pop(0)
    print(msg)


def lux_from_time(hour: float) -> float:
    """
    Smooth day/night lux curve using a sine function.
    Sunrise ~06:00, peak noon ~50 000 lux, sunset ~20:00, night 0.
    """
    if hour < 6 or hour > 20:
        return 0.0
    angle = math.pi * (hour - 6) / 14          # 0 → π over 14 h
    return round(50_000 * math.sin(angle), 1)


def lux_to_brightness(lux: float) -> int:
    """Maps outdoor lux to indoor brightness %."""
    if lux > 10_000: return 85
    if lux > 2_000:  return 60
    if lux > 200:    return 45
    return 30


def _active_zones() -> list[str]:
    active = []
    for name, zone in state["zones"].items():
        if isinstance(zone, dict):
            if zone.get("enabled", False):
                active.append(name)
        elif zone:
            # Backward compatibility for older boolean state shape.
            active.append(name)
    return active

# ── Simulated light control (replaces real Zigbee/MQTT publish) ───────────────

async def set_lights(brightness: int):
    zone_levels = []
    for name, zone in state["zones"].items():
        if isinstance(zone, dict):
            enabled = bool(zone.get("enabled", False))
            zone_brightness = int(zone.get("brightness", 0))
        else:
            # Backward compatibility for older boolean state shape.
            enabled = bool(zone)
            zone_brightness = brightness

        if not enabled:
            continue

        # Zone brightness acts as a trim/multiplier of the current global level.
        effective = round(max(0, min(brightness, 100)) * max(0, min(zone_brightness, 100)) / 100)
        zone_levels.append(f"{name}:{effective}%")

    if zone_levels:
        _log(f"[lights] Global {brightness}% | " + ", ".join(zone_levels))
    else:
        _log("[lights] All zones disabled – nothing to set")

# ── Simulated lux sensor loop (replaces real MQTT listener) ──────────────────

async def lux_simulator():
    """
    Advances a virtual clock and feeds fake lux readings into the system.
    sim_speed=60 means the full 24-h day plays out in 24 minutes.
    """
    _log("[sim] Lux simulator started")
    while True:
        if state["sim_lux_manual"] is not None:
            # pinned lux — clock still advances but lux is fixed
            lux = float(state["sim_lux_manual"])
            state["lux"] = lux
            state["sim_time_of_day"] = (state["sim_time_of_day"] + 1 / 3600) % 24
        else:
            tod = state["sim_time_of_day"]
            lux = lux_from_time(tod)
            state["lux"] = lux
            state["sim_time_of_day"] = (tod + 1 / 3600) % 24  # advance 1 sim-second

        if state["mode"] == "auto":
            brightness = lux_to_brightness(lux)
            if brightness != state["brightness"]:
                state["brightness"] = brightness
                await set_lights(brightness)

        # real sleep = 1 sim-second ÷ speed factor
        await asyncio.sleep(1 / max(state["sim_speed"], 1))

# ── REST endpoints ────────────────────────────────────────────────────────────

@app.get("/state")
async def get_state():
    return state


@app.post("/override")
async def manual_override(brightness: int):
    state["mode"] = "manual"
    state["brightness"] = brightness
    _log(f"[api] Manual override → {brightness}%")
    await set_lights(brightness)
    return {"ok": True}


@app.post("/auto")
async def set_auto():
    state["mode"] = "auto"
    _log("[api] Switched to auto mode")
    await set_lights(state["brightness"])
    return {"ok": True}


@app.post("/zone/{name}")
async def toggle_zone(name: str, enabled: bool):
    """UI power toggle: direct on/off control for a zone."""
    if name in state["zones"]:
        zone = state["zones"][name]
        if isinstance(zone, dict):
            zone["enabled"] = enabled
        else:
            state["zones"][name] = {
                "connected": True,
                "enabled": enabled,
                "brightness": state["brightness"],
            }
        _log(f"[api] Zone '{name}' power set → {'on' if enabled else 'off'}")
        await set_lights(state["brightness"])
    return state["zones"]


@app.post("/zone/{name}/brightness")
async def set_zone_brightness(name: str, brightness: int):
    if name in state["zones"]:
        zone = state["zones"][name]
        if isinstance(zone, dict):
            zone["brightness"] = max(0, min(brightness, 100))
        else:
            state["zones"][name] = {
                "connected": True,
                "enabled": bool(zone),
                "brightness": max(0, min(brightness, 100)),
            }
        _log(f"[api] Zone '{name}' brightness → {state['zones'][name]['brightness']}%")
        await set_lights(state["brightness"])
    return state["zones"]


@app.post("/sim/zone/{name}/connection")
async def set_sim_zone_connection(name: str, connected: bool):
    """Simulation-only control: update zone connection status (no power/output side effects)."""
    if name in state["zones"]:
        zone = state["zones"][name]
        if isinstance(zone, dict):
            zone["connected"] = connected
        else:
            state["zones"][name] = {
                "connected": connected,
                "enabled": bool(zone),
                "brightness": state["brightness"],
            }
        _log(f"[sim] Zone '{name}' connection → {'connected' if connected else 'disconnected'}")
    return state["zones"]


@app.post("/sim/speed")
async def set_sim_speed(speed: int):
    """Adjust simulation speed multiplier (1–3600)."""
    state["sim_speed"] = max(1, min(speed, 3600))
    _log(f"[sim] Speed set to {state['sim_speed']}×")
    return {"sim_speed": state["sim_speed"]}


@app.post("/sim/time")
async def set_sim_time(hour: float):
    """Jump the simulation to a specific hour (0–24)."""
    state["sim_time_of_day"] = hour % 24
    _log(f"[sim] Time jumped to {hour:.1f}h")
    return {"sim_time_of_day": state["sim_time_of_day"]}


@app.post("/sim/lux")
async def set_sim_lux(lux: float):
    """Pin lux to a fixed value. Pass lux=-1 to resume the auto day/night cycle."""
    if lux < 0:
        state["sim_lux_manual"] = None
        _log("[sim] Lux set back to auto day/night cycle")
    else:
        state["sim_lux_manual"] = max(0.0, min(lux, 50_000.0))
        _log(f"[sim] Lux pinned to {state['sim_lux_manual']:.0f} lux")
    return {"sim_lux_manual": state["sim_lux_manual"]}

# ── WebSocket ─────────────────────────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            # Send a snapshot without the log to keep it lean
            snapshot = {k: v for k, v in state.items() if k != "log"}
            snapshot["log"] = state["log"][-10:]   # last 10 entries
            await ws.send_json(snapshot)
            await asyncio.sleep(0.5)               # 2 Hz refresh
    except Exception:
        pass

# ── Serve the dashboard ───────────────────────────────────────────────────────

@app.get("/")
async def dashboard():
    return FileResponse("dashboard.html")

# ── Startup ───────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    asyncio.create_task(lux_simulator())
    _log("[server] DaylightSync simulation server started")

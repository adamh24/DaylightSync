# ── Imports ──────────────────────────────────────────────────────────────────

import asyncio          # Python's built-in async engine
import json             # for encoding/decoding MQTT payloads
import aiomqtt          # async MQTT client library
from fastapi import FastAPI, WebSocket   # web framework + WebSocket support
from apscheduler.schedulers.asyncio import AsyncIOScheduler  # task scheduler

# ── App and state ─────────────────────────────────────────────────────────────

app = FastAPI()         # creates the web server

state = {               # the single source of truth for your whole system
    "lux": 0,           # current outdoor brightness reading
    "brightness": 50,   # current light level being applied (%)
    "mode": "auto",     # "auto" = sensor-driven, "manual" = staff override
    "zones": {
        "bar_counter": True,
        "seating": True,
        "accent": True
    }
}

# ── Lux → brightness conversion ──────────────────────────────────────────────

def lux_to_brightness(lux: float) -> int:
    """Maps outdoor light level to an indoor brightness percentage."""
    if lux > 10000: return 85    # bright sunny day
    if lux > 2000:  return 60    # overcast
    if lux > 200:   return 45    # dusk / golden hour
    return 30                    # night / dark

# ── MQTT message handler ──────────────────────────────────────────────────────

async def on_message(topic: str, payload: str):
    """Called every time a message arrives on any subscribed MQTT topic."""

    if topic == "sensors/lux":
        lux = float(payload)
        state["lux"] = lux

        if state["mode"] == "auto":         # only act if not manually overridden
            brightness = lux_to_brightness(lux)
            state["brightness"] = brightness
            await set_lights(brightness)    # push to Zigbee dimmers

# ── Light control ─────────────────────────────────────────────────────────────

async def set_lights(brightness: int):
    """Publishes a brightness command to Zigbee2MQTT via MQTT."""
    async with aiomqtt.Client("localhost") as client:
        for zone, enabled in state["zones"].items():
            if enabled:
                payload = json.dumps({"brightness_percent": brightness})
                await client.publish(f"zigbee2mqtt/{zone}/set", payload)

# ── MQTT listener loop ────────────────────────────────────────────────────────

async def mqtt_listener():
    """Runs forever in the background, listening for sensor messages."""
    async with aiomqtt.Client("localhost") as client:
        await client.subscribe("sensors/#")   # subscribe to all sensor topics
        async for message in client.messages:
            topic = str(message.topic)
            payload = message.payload.decode()
            await on_message(topic, payload)

# ── REST API endpoints ────────────────────────────────────────────────────────

@app.get("/state")
async def get_state():
    """Returns the current system state — your dashboard reads this."""
    return state

@app.post("/override")
async def manual_override(brightness: int):
    """Staff can manually set brightness from the tablet."""
    state["mode"] = "manual"
    state["brightness"] = brightness
    await set_lights(brightness)
    return {"ok": True}

@app.post("/auto")
async def set_auto():
    """Switches back to automatic sensor-driven mode."""
    state["mode"] = "auto"
    return {"ok": True}

@app.post("/zone/{name}")
async def toggle_zone(name: str, enabled: bool):
    """Enables or disables a lighting zone from the dashboard."""
    if name in state["zones"]:
        state["zones"][name] = enabled
    return state["zones"]

# ── WebSocket endpoint ────────────────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    """
    Keeps a live connection open to the React dashboard.
    Pushes the current state every 2 seconds so the UI
    always reflects what's happening without polling.
    """
    await ws.accept()
    try:
        while True:
            await ws.send_json(state)
            await asyncio.sleep(2)
    except:
        pass   # client disconnected — just exit cleanly

# ── Startup ───────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    """Runs when the server starts — kicks off the MQTT listener."""
    asyncio.create_task(mqtt_listener())
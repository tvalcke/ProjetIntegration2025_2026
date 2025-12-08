from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from gpiozero import Button, OutputDevice
import uvicorn
import asyncio
from pydantic import BaseModel
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, db

# --- Firebase ---
cred = credentials.Certificate("/home/jemlo/projet/fontaine/backend/firebase-adminsdk.json")
firebase_admin.initialize_app(cred, {
    "databaseURL": "https://fontaine-intelligente-default-rtdb.europe-west1.firebasedatabase.app/"
})

# --- Identification fontaine ---
DEPARTMENT = "EPHEC01"
FOUNTAIN_SERIAL = "M02"

class BottleEvent(BaseModel):
    bottleNumber: int
    waterLiters: float
    plasticRecycledGrams: float

# --- FastAPI ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

clients = []

@app.get("/api/serial")
def get_serial():
    return {"serial": f"{DEPARTMENT}{FOUNTAIN_SERIAL}"}

@app.get("/api/read-machine/{date}")
def read_machine(date: str):
    ref = db.reference(f"/{date}/{DEPARTMENT}/{FOUNTAIN_SERIAL}")
    return ref.get() or {"waterLiters": 0, "plasticRecycledGrams": 0, "lastTransaction": {"waterLiters": 0, "plasticRecycledGrams": 0}}

@app.get("/api/read-department/{date}")
def read_department(date: str):
    dept_ref = db.reference(f"/{date}/{DEPARTMENT}")
    dept_data = dept_ref.get() or {}
    total_water = sum(f.get("waterLiters", 0) for f in dept_data.values())
    total_plastic = sum(f.get("plasticRecycledGrams", 0) for f in dept_data.values())
    return {"waterLiters": total_water, "plasticRecycledGrams": total_plastic}

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    clients.append(ws)

    # Envoi des données initiales
    machine_data, dept_data = await get_totals()
    await ws.send_text(f"init:{machine_data['waterLiters']}:{machine_data['plasticRecycledGrams']}:{dept_data['waterLiters']}:{dept_data['plasticRecycledGrams']}")

    try:
        while True:
            await ws.receive_text()
    except:
        clients.remove(ws)

async def broadcast(message: str):
    for ws in clients:
        try:
            await ws.send_text(message)
        except:
            clients.remove(ws)

# --- GPIO ---
button = Button(17)
pump = OutputDevice(27)

water_liters = 0.0
plastic_recycled = 0
fill_rate_per_sec = 0.008
last_press_time = None
save_task = None
lock = asyncio.Lock()

async def get_totals():
    today = datetime.today().strftime("%Y-%m-%d")
    dept_ref = db.reference(f"/{today}/{DEPARTMENT}")
    dept_data = dept_ref.get() or {}

    # Machine
    machine_data = dept_data.get(FOUNTAIN_SERIAL, {"waterLiters": 0.0, "plasticRecycledGrams": 0})
    # Calcul total département
    total_water = sum(f.get("waterLiters", 0) for f in dept_data.values())
    total_plastic = sum(f.get("plasticRecycledGrams", 0) for f in dept_data.values())
    return machine_data, {"waterLiters": total_water, "plasticRecycledGrams": total_plastic}

async def save_to_firebase():
    global water_liters, plastic_recycled
    async with lock:
        today = datetime.today().strftime("%Y-%m-%d")
        fountain_ref = db.reference(f"/{today}/{DEPARTMENT}/{FOUNTAIN_SERIAL}")

        old_data = fountain_ref.get() or {}
        previous_water = old_data.get("waterLiters", 0)
        previous_plastic = old_data.get("plasticRecycledGrams", 0)

        transaction_liters = water_liters
        transaction_plastic = int(transaction_liters * 42)  # calcul backend

        new_water = previous_water + transaction_liters
        new_plastic = previous_plastic + transaction_plastic

        fountain_ref.update({
            "lastTransaction": {"waterLiters": transaction_liters, "plasticRecycledGrams": transaction_plastic},
            "waterLiters": new_water,
            "plasticRecycledGrams": new_plastic
        })

        water_liters = 0
        plastic_recycled = 0

        # Recalcul total département et broadcast
        _, dept_totals = await get_totals()
        await broadcast(f"dept_update:{dept_totals['waterLiters']}:{dept_totals['plasticRecycledGrams']}")
        await broadcast("update_done")

async def monitor_button():
    global water_liters, plastic_recycled, last_press_time, save_task
    while True:
        if button.is_pressed:
            pump.on()
            await broadcast("start_fill")
            last_press_time = asyncio.get_event_loop().time()

            while button.is_pressed:
                water_liters += fill_rate_per_sec
                plastic_recycled = int(water_liters * 42)
                await broadcast(f"{water_liters:.3f}")
                await asyncio.sleep(1)

            pump.off()
            await broadcast("stop_fill")
            last_press_time = asyncio.get_event_loop().time()

            if save_task:
                save_task.cancel()
            save_task = asyncio.create_task(schedule_save())

        await asyncio.sleep(0.1)

async def schedule_save():
    global last_press_time
    try:
        await asyncio.sleep(3)
        now = asyncio.get_event_loop().time()
        if now - last_press_time >= 3:
            await save_to_firebase()
    except asyncio.CancelledError:
        pass

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(monitor_button())

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

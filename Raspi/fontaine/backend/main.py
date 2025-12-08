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

# Numero de serie de la fontaine
FOUNTAIN_SERIAL = "EPH01M01"


class BottleEvent(BaseModel):
    bottleNumber: int
    waterLiters: float
    plasticRecycledGrams: float

# FastAPI
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket clients
clients = []

@app.get("/api/serial")
def get_serial():
    """Renvoie le numero de serie de la fontaine"""
    return {"serial": FOUNTAIN_SERIAL}

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    clients.append(ws)
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

# GPIO
button = Button(17)
pump = OutputDevice(27)

# Simulation backend
water_liters = 0.0
plastic_recycled = 0
fill_rate_per_sec = 0.008  # litres par seconde
last_press_time = None
save_task = None
lock = asyncio.Lock()

async def save_to_firebase():
    global water_liters, plastic_recycled
    async with lock:
        current_day = datetime.today().strftime("%Y-%m-%d")
        event = BottleEvent(
            bottleNumber=int(water_liters),
            waterLiters=water_liters,
            plasticRecycledGrams=int(water_liters)*42
        )
        ref = db.reference(f'/{current_day}')
        ref.update(event.model_dump())
        print("✅ Firebase updated:", event)
        # Reset timeout task
        global save_task
        save_task = None

async def monitor_button():
    global water_liters, plastic_recycled, last_press_time, save_task
    print("En attente du bouton...")
    while True:
        if button.is_pressed:
            pump.on()
            await broadcast("start_fill")

            last_press_time = asyncio.get_event_loop().time()

            # Incremente eau si bouton
            while button.is_pressed:
                water_liters += fill_rate_per_sec
                plastic_recycled = int(water_liters)*42
                await broadcast(f"{water_liters:.3f}")  # front peut afficher
                await asyncio.sleep(1)

            pump.off()
            await broadcast("stop_fill")

            last_press_time = asyncio.get_event_loop().time()

            # Sauvegarde apres 3 secondes si aucune pression
            if save_task:
                save_task.cancel()
            save_task = asyncio.create_task(schedule_save())
        await asyncio.sleep(0.1)

async def schedule_save():
    global last_press_time
    try:
        await asyncio.sleep(3)
        # Si pas de nouvelle pression, sauvegarde
        now = asyncio.get_event_loop().time()
        if now - last_press_time >= 3:
            await save_to_firebase()
    except asyncio.CancelledError:
        pass
        
@app.get("/api/read-item/{item_id}")
def read_item(item_id: str):
    ref = db.reference(f'/{item_id}')
    item = ref.get()
    if not item:
        return {}
    return item


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(monitor_button())

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

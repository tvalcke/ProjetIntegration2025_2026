from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from gpiozero import Button
import threading
import asyncio
import uvicorn

app = FastAPI()
button = Button(17)  # ton bouton GPIO
clients = set()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.add(websocket)
    try:
        while True:
            await asyncio.sleep(1)
    except:
        pass
    finally:
        clients.remove(websocket)

def on_button_press():
    print("Bouton pressé !")
    asyncio.run(send_event_to_clients())

async def send_event_to_clients():
    disconnected = set()
    for ws in clients:
        try:
            await ws.send_text("button_pressed")
        except:
            disconnected.add(ws)
    clients.difference_update(disconnected)

def start_button_listener():
    button.when_pressed = on_button_press

listener_thread = threading.Thread(target=start_button_listener, daemon=True)
listener_thread.start()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

from fastapi import FastAPI
import firebase_admin
from firebase_admin import credentials, db
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

cred = credentials.Certificate("/firebase/firebase-adminsdk.json")
firebase_admin.initialize_app(cred, {
    "databaseURL": "https://fontaine-intelligente-default-rtdb.europe-west1.firebasedatabase.app/"  # Remplacer par l'URL réelle de votre base
})


app = FastAPI(title="FastAPI Docker Template")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BottleEvent(BaseModel):
    bottleNumber: int
    waterLiters: float
    plasticRecycledGrams: float

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI running in Docker!"}

@app.post("/api/create-item/")
def create_item(data: BottleEvent):
    try:
        current_day = str(datetime.today())[:10]
        print(current_day)
        ref = db.reference(f'/{current_day}')
        new_ref = ref.update(data.model_dump())
        return {"id": new_ref.key, "message": "Donnée créée avec succès"}
    except Exception as e:
        print(e)

@app.get("/api/read-item/{item_id}")
def read_item(item_id: str):
    try:
        print(item_id)
        ref = db.reference(f'/{item_id}')
        item = ref.get()
        return item
    except Exception as e:
        print(e)
from fastapi import FastAPI
import firebase_admin
from firebase_admin import credentials, db

cred = credentials.Certificate("/firebase/firebase-adminsdk.json")
firebase_admin.initialize_app(cred, {
    "databaseURL": "https://fontaine-intelligente-default-rtdb.europe-west1.firebasedatabase.app/"  # Remplacer par l'URL réelle de votre base
})


app = FastAPI(title="FastAPI Docker Template")

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI running in Docker!"}

@app.post("/create-item/")
def create_item(data: dict):
    try:
        ref = db.reference('/items')
        new_ref = ref.push(data)
        return {"id": new_ref.key, "message": "Donnée créée avec succès"}
    except Exception as e:
        print(e)

@app.get("/read-item/{item_id}")
def read_item(item_id: str):
    try:
        print(item_id)
        ref = db.reference(f'/{item_id}')
        item = ref.get()
        return item
    except Exception as e:
        print(e)

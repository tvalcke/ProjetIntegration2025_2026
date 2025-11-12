from fastapi import FastAPI, HTTPException, Depends, status
import firebase_admin
from firebase_admin import credentials, db
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from datetime import datetime, timedelta
from dotenv import load_dotenv
import jwt
import os

cred = credentials.Certificate("/firebase/firebase-adminsdk.json")
firebase_admin.initialize_app(cred, {
    "databaseURL": "https://fontaine-intelligente-default-rtdb.europe-west1.firebasedatabase.app/"  # Remplacer par l'URL réelle de votre base
})

load_dotenv()
#apperentlu I need to do this
ADMIN_EMAIL = os.getenv("Admin_Email")
ADMIN_PASSWORD = os.getenv("Admin_Password")


# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "IfNoneArefoundThisisthebackupHelloYouCanseemebutitdoesn'tmatter")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_MINUTES = 30

app = FastAPI(title="FastAPI Docker Template")

#Cors Security MiddleWare that will eventually need to be configured but i am lazy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
security = HTTPBearer()


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

# For Jwt admin login US Thomas
class AdminLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    Name: str
    access_token: str
    token_type: str
    expires_in: int

def create_access_token(data: dict):
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRY_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

@app.post("/api/admin/login", response_model=Token)
async def admin_login(login_data: AdminLogin):

    print("ADMIN_EMAIL: ", repr(ADMIN_EMAIL))
    print("ADMIN_PASSWORD: ", repr(ADMIN_PASSWORD))
    print("Login Email used: ", login_data.email)
    print("Login Password used: ", login_data.password)
    """Admin login endpoint - grants JWT token"""
    # Verify credentials against .env
    if login_data.email != ADMIN_EMAIL or login_data.password != ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Create access token
    access_token = create_access_token(
        data={"sub": login_data.email, "email": login_data.email}
    )

    return {
        "Name": "AdminToken",
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": JWT_EXPIRY_MINUTES * 60
    }

@app.get("/api/admin/verify")
async def verify_admin_token(admin: dict = Depends(verify_token)):
    """Verify admin token is valid - returns simple success"""
    return {
        "status": "success",
        "message": "Token is valid",
        "email": admin.get("email")
    }
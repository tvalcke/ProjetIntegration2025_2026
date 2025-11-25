from fastapi import FastAPI, HTTPException, Depends, status
import firebase_admin
from firebase_admin import credentials, db, auth
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
    allow_origins=["*"],
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

class CreateUserRequest(BaseModel):
    email: str
    password: str

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
    """Login endpoint - grants JWT token for admin or Firebase users"""
    
    print(f"🔍 Login attempt for: {login_data.email}")
    
    if login_data.email == ADMIN_EMAIL and login_data.password == ADMIN_PASSWORD:
        print("✅ Super admin login successful")
        access_token = create_access_token(
            data={"sub": login_data.email, "email": login_data.email, "role": "super_admin"}
        )
        return {
            "Name": "AdminToken",
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": JWT_EXPIRY_MINUTES * 60
        }
    

    try:
        print(f"🔍 Trying Firebase authentication for: {login_data.email}")
        

        user = auth.get_user_by_email(login_data.email)
        print(f"✅ User found in Firebase: {user.uid}")
        

        import requests
        
        firebase_api_key = os.getenv("FIREBASE_API_KEY")
        print(f"🔑 Using API Key: {firebase_api_key[:10]}..." if firebase_api_key else "❌ No API Key found!")
        
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={firebase_api_key}"
        
        response = requests.post(url, json={
            "email": login_data.email,
            "password": login_data.password,
            "returnSecureToken": True
        })
        
        print(f"📡 Firebase response status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Firebase error: {response.text}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        print("✅ Firebase authentication successful")
        

        user_ref = db.reference(f'/users/{user.uid}')
        user_data = user_ref.get()
        role = user_data.get('role', 'client') if user_data else 'client'
        

        access_token = create_access_token(
            data={
                "sub": login_data.email,
                "email": login_data.email,
                "uid": user.uid,
                "role": role
            }
        )
        
        print(f"✅ Token created for user: {login_data.email}")
        
        return {
            "Name": "UserToken",
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": JWT_EXPIRY_MINUTES * 60
        }
        
    except auth.UserNotFoundError:
        print(f"❌ User not found: {login_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    except Exception as e:
        print(f"❌ Login error: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

@app.get("/api/admin/verify")
async def verify_admin_token(admin: dict = Depends(verify_token)):
    """Verify admin token is valid - returns simple success"""
    return {
        "status": "success",
        "message": "Token is valid",
        "email": admin.get("email")
    }

@app.post("/api/admin/create-user")
async def create_user(
    user_data: CreateUserRequest,
    admin: dict = Depends(verify_token)
):
    """Create a new user account in Firebase Authentication"""
    try:
        # Créer le nouvel utilisateur dans Firebase Authentication
        user = auth.create_user(
            email=user_data.email,
            password=user_data.password,
            email_verified=False
        )
        
        # Optionnel : Stocker des infos supplémentaires dans Realtime Database
        user_ref = db.reference(f'/users/{user.uid}')
        user_ref.set({
            'email': user_data.email,
            'createdAt': datetime.now().isoformat(),
            'createdBy': admin.get('email'),
            'role': 'client'
        })
        
        return {
            "success": True,
            "message": "Utilisateur créé avec succès",
            "uid": user.uid,
            "email": user.email
        }
        
    except auth.EmailAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet email existe déjà"
        )
    except Exception as e:
        print(f"Error creating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création de l'utilisateur: {str(e)}"
        )
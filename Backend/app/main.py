from fastapi import FastAPI, HTTPException, Depends, status
import firebase_admin
from firebase_admin import credentials, db, auth
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Response, Request
from pydantic import BaseModel
from datetime import datetime, timedelta
from dotenv import load_dotenv
import jwt
import os
from datetime import datetime
# test
cred = credentials.Certificate("/etc/secrets/firebase-adminsdk.json")
firebase_admin.initialize_app(cred, {
    "databaseURL": "https://fontaine-intelligente-default-rtdb.europe-west1.firebasedatabase.app/"
})


load_dotenv()
#apperentlu I need to do this
ADMIN_EMAIL = os.getenv("Admin_Email")
ADMIN_PASSWORD = os.getenv("Admin_Password")

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "IfNoneArefoundThisisthebackupHelloYouCanseemebutitdoesn'tmatter")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_MINUTES = 30
JWT_ISSUER = "fontaine-intelligente-api"
JWT_AUDIENCE = "fontaine-intelligente-admins"

app = FastAPI(title="FastAPI Docker Template")
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

#Cors Security MiddleWare that will eventually need to be configured but i am lazy
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",   # For test enviroments
        "https://jemlofontaine.onrender.com",
        "https://tvalcke.github.io/Jemlo"
    ],
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
    role: str

class CreateUserRequest(BaseModel):
    email: str
    password: str

def create_access_token(data: dict):
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRY_MINUTES)
    to_encode.update({"exp": expire,"iss": JWT_ISSUER,"aud": JWT_AUDIENCE})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(request: Request):
    token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            audience=JWT_AUDIENCE,
            issuer=JWT_ISSUER
        )
        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def verify_admin_role(payload: dict = Depends(verify_token)):
    """
    Verify that the user's role is 'admin' or 'super_admin'.
    Raises 403 if the user does not have admin access.
    """
    role = payload.get("role")
    if role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access only"
        )
    return payload


@app.post("/api/admin/login", response_model=Token)
async def admin_login(login_data: AdminLogin, response: Response):
    print(f"🔍 Login attempt for: {login_data.email}")

    # ========== SUPER ADMIN ==========
    if login_data.email == ADMIN_EMAIL and login_data.password == ADMIN_PASSWORD:
        print("✅ Super admin login successful")

        access_token = create_access_token({
            "sub": login_data.email,
            "email": login_data.email,
            "role": "super_admin"
        })

        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=JWT_EXPIRY_MINUTES * 60
        )

        return {
            "Name": "SuperAdminSession",
            "access_token": "stored_in_cookie",
            "token_type": "cookie",
            "expires_in": JWT_EXPIRY_MINUTES * 60,
            "role": "super_admin"
        }

    # ========== FIREBASE USERS ==========
    is_jemlo_domain = login_data.email.endswith("@jemlo.be")
    user_role = "admin" if is_jemlo_domain else "client"

    try:
        print(f"🔍 Firebase login: {login_data.email}")

        user = auth.get_user_by_email(login_data.email)

        import requests
        firebase_api_key = os.getenv("FIREBASE_API_KEY")

        url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={firebase_api_key}"
        fb_response = requests.post(url, json={
            "email": login_data.email,
            "password": login_data.password,
            "returnSecureToken": True
        })

        if fb_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Save / update role
        user_ref = db.reference(f"/users/{user.uid}")
        user_ref.update({
            "email": login_data.email,
            "role": user_role,
            "updatedAt": datetime.now().isoformat()
        })

        access_token = create_access_token({
            "sub": login_data.email,
            "email": login_data.email,
            "uid": user.uid,
            "role": user_role
        })

        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,            # 🔴 True in prod
            samesite="lax",
            max_age=JWT_EXPIRY_MINUTES * 60
        )

        return {
            "Name": "UserSession",
            "access_token": "stored_in_cookie",
            "token_type": "cookie",
            "expires_in": JWT_EXPIRY_MINUTES * 60,
            "role": user_role
        }

    except auth.UserNotFoundError:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/api/admin/verify")
async def verify_admin_token(admin: dict = Depends(verify_token)):
    """Verify admin token is valid - returns simple success"""
    return {
        "status": "success",
        "message": "Token is valid",
        "email": admin.get("email"),
        "role": admin.get("role")
    }

# Endpoints protégés pour les admins uniquement (@jemlo.be)
@app.get("/api/admin/contact-requests")
async def get_contact_requests(admin: dict = Depends(verify_admin_role)):
    """Récupérer les demandes de contact - Accès réservé aux admins @jemlo.be"""
    try:
        ref = db.reference('/contact_requests')
        requests = ref.get()
        return {"success": True, "data": requests or {}}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur: {str(e)}"
        )

@app.get("/api/admin/content")
async def get_content(admin: dict = Depends(verify_admin_role)):
    """Récupérer le contenu - Accès réservé aux admins @jemlo.be"""
    try:
        ref = db.reference('/content')
        content = ref.get()
        return {"success": True, "data": content or {}}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur: {str(e)}"
        )

@app.post("/api/admin/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logged out successfully"}

@app.post("/api/admin/create-user")
async def create_user(
    user_data: CreateUserRequest,
    admin: dict = Depends(verify_admin_role)
):
    """Create a new user account in Firebase Authentication - Admin only"""
    try:
        # Déterminer le rôle basé sur le domaine email
        is_jemlo_domain = user_data.email.endswith("@jemlo.be")
        user_role = "admin" if is_jemlo_domain else "client"
        
        # Créer le nouvel utilisateur dans Firebase Authentication
        user = auth.create_user(
            email=user_data.email,
            password=user_data.password,
            email_verified=False
        )
        
        # Stocker des infos supplémentaires dans Realtime Database
        user_ref = db.reference(f'/users/{user.uid}')
        user_ref.set({
            'email': user_data.email,
            'createdAt': datetime.now().isoformat(),
            'createdBy': admin.get('email'),
            'role': user_role
        })
        
        return {
            "success": True,
            "message": "Utilisateur créé avec succès",
            "uid": user.uid,
            "email": user.email,
            "role": user_role
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


@app.get("/api/admin/stats_total")
async def get_dashboard_stats(admin: dict = Depends(verify_token)):
    """
    Récupère les statistiques globales pour le dashboard admin.
    Nécessite un token admin valide.
    """
    try:
        # Récupérer toutes les données à la racine
        ref = db.reference('/')
        all_data = ref.get()

        if not all_data:
            return {
                "active_fountains": 0,
                "total_water": 0,
                "total_plastic": 0,
                "growth": 0  # Valeur fictive pour l'instant
            }

        total_water = 0.0
        total_plastic = 0.0
        days_active = 0

        # On itère sur les clés (qui sont des dates ou 'users')
        for key, value in all_data.items():
            # On ignore le dossier des utilisateurs et les clés systèmes
            if key == 'users':
                continue

            # On suppose que chaque autre clé est une entrée de date contenant des données
            # Adapter selon la structure exacte créée par create_item
            if isinstance(value, dict):
                total_water += float(value.get('waterLiters', 0))
                total_plastic += float(value.get('plasticRecycledGrams', 0))
                days_active += 1

        return {
            "active_fountains": 1,  # Pour l'instant codé en dur, ou basé sur les IDs uniques trouvés
            "total_water": round(total_water, 2),
            "total_plastic": round(total_plastic, 2),  # En grammes
            "bottles_saved": int(total_plastic / 42)  # Estimation : 1 bouteille de 1L ~= 42g de plastique
        }

    except Exception as e:
        print(f"Error stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération des statistiques"
        )
@app.get("/api/admin/fountain_graph")
async def get_graph_stat(admin: dict = Depends(verify_token)):
    try:
        ref = db.reference('/')
        all_data = ref.get()

        if not all_data:
            return {"dates": [], "water_consumed": []}

        dates = []
        water_daily = []

        sorted_keys = sorted(
            [k for k in all_data.keys() if k != "users" and len(k) == 10]
        )

        for date_str in sorted_keys:
            day_total_water = 0.0
            day_data = all_data[date_str]

            # EPHEC01, EPHEC02, ...
            for fountain in day_data.values():
                if not isinstance(fountain, dict):
                    continue

                # M01, M02, ...
                for machine in fountain.values():
                    last_tx = machine.get("lastTransaction")
                    if last_tx:
                        day_total_water += float(last_tx.get("waterLiters", 0))

            # Format date
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
            formatted_date = date_obj.strftime("%d %b").lstrip("0")

            dates.append(formatted_date)
            water_daily.append(round(day_total_water, 2))

        return {
            "dates": dates,
            "water_consumed": water_daily
        }

    except Exception as e:
        print(f"Error graph data: {e}")
        raise HTTPException(status_code=500, detail="Erreur graphique")

@app.post("api/admin/logout")
def logout(response: Response):
    # Supprime le cookie "access_token" (ou ton nom de cookie)
    response.delete_cookie(
        key="access_token",
        path="/",
        domain=None  # si tu as un sous-domaine, mets-le ici
    )
    return {"msg": "Logged out"}

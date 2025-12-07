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
from datetime import datetime

cred = credentials.Certificate("/etc/secrets/firebase-adminsdk.json")
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
    role: str  # Ajouter le rôle dans la réponse

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


def verify_admin_role(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify user has admin role (@jemlo.be or super_admin)"""
    payload = verify_token(credentials)
    role = payload.get("role", "")
    
    if role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs @jemlo.be"
        )
    
    return payload

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
            "expires_in": JWT_EXPIRY_MINUTES * 60,
            "role": "super_admin"
        }
    
    # Déterminer le rôle basé sur le domaine email
    is_jemlo_domain = login_data.email.endswith("@jemlo.be")
    user_role = "admin" if is_jemlo_domain else "client"

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
        
        # Mettre à jour le rôle dans la base de données
        user_ref = db.reference(f'/users/{user.uid}')
        user_data = user_ref.get()
        
        # Mettre à jour ou créer les données utilisateur avec le rôle
        if user_data:
            user_ref.update({'role': user_role})
        else:
            user_ref.set({
                'email': login_data.email,
                'role': user_role,
                'createdAt': datetime.now().isoformat()
            })

        access_token = create_access_token(
            data={
                "sub": login_data.email,
                "email": login_data.email,
                "uid": user.uid,
                "role": user_role
            }
        )
        
        print(f"✅ Token created for user: {login_data.email} with role: {user_role}")
        
        return {
            "Name": "UserToken",
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": JWT_EXPIRY_MINUTES * 60,
            "role": user_role
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
"""
@app.get("/api/admin/fountain_graph")
async def get_graph_stats(admin: dict = Depends(verify_token)):
    #Récupère les statistiques globales pour le dashboard admin.
    #Nécessite un token admin valide.

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
            "dates": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            "active_fountains": 1,  # Pour l'instant codé en dur, ou basé sur les IDs uniques trouvés
            "water_consumed": round(total_water, 2),
            "total_plastic": round(total_plastic, 2),  # En grammes
            "bottles_saved": int(total_plastic / 42)  # Estimation : 1 bouteille de 1L ~= 42g de plastique
        }

    except Exception as e:
        print(f"Error stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération des statistiques"
        )
"""


@app.get("/api/admin/fountain_graph")  # Attention au nom de route qui doit matcher ton frontend
async def get_graph_stat(admin: dict = Depends(verify_token)):
    """
    Récupère les données pour le graphique : dates et consommation d'eau journalière.
    """
    try:
        ref = db.reference('/')
        all_data = ref.get()

        if not all_data:
            return {"dates": [], "water_consumed": []}

        # Listes pour stocker les données du graphique
        dates_formatted = []
        water_daily = []

        # 1. Récupérer et trier les clés
        # On ne garde que les clés qui ressemblent à des dates (YYYY-MM-DD)
        # On ignore 'users' et tout ce qui ne fait pas 10 caractères
        sorted_keys = sorted([k for k in all_data.keys() if k != 'users' and len(k) == 10])

        # 2. Boucler sur les dates triées
        for date_str in sorted_keys:
            data_value = all_data[date_str]

            if isinstance(data_value, dict):
                # Récupérer l'eau pour ce jour précis
                liters = float(data_value.get('waterLiters', 0))

                # Formater la date (YYYY-MM-DD -> 4 sep)
                try:
                    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
                    # %d = jour (04), %b = mois abrégé (sep)
                    formatted_date = date_obj.strftime("%d %b")
                    # Pour enlever le zéro devant le jour (04 -> 4), sur Linux/Mac c'est %-d, sur Windows %#d
                    # Une méthode universelle simple :
                    if formatted_date.startswith('0'):
                        formatted_date = formatted_date[1:]
                except ValueError:
                    # Si la clé n'est pas une date valide, on garde la clé telle quelle
                    formatted_date = date_str

                dates_formatted.append(formatted_date)
                water_daily.append(liters)

        return {
            "dates": dates_formatted,  # Ex: ["4 Sep", "5 Sep", ...]
            "water_consumed": water_daily,  # Ex: [12.5, 8.0, ...]
            # On peut retirer les totaux ici car ce endpoint sert juste au graphique
        }

    except Exception as e:
        print(f"Error graph data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération des données graphiques"
        )

from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.models import User
from app.database import db

router = APIRouter()

@router.get("/fountain-data")
async def get_fountain_data(
    months: int = 3,
    current_user: dict = Depends(get_current_user)
):
    """Récupère les données de consommation de la fontaine depuis Firebase pour les X derniers mois"""
    try:
        from datetime import datetime, timedelta
        
        # Récupérer les données Firebase
        ref = db.reference('fountain_data')
        all_data = ref.get()
        
        if not all_data:
            # Données par défaut si Firebase est vide - générer des données de test
            dates = []
            water_consumed = []
            today = datetime.now()
            for i in range(90, -1, -1):
                date = today - timedelta(days=i)
                if i % 7 == 0 or i == 0:
                    dates.append(date.strftime("%d %b"))
                else:
                    dates.append("")
                # Données aléatoires pour test
                import random
                water_consumed.append(round(random.uniform(50, 200), 1))
            
            return {
                "dates": dates,
                "water_consumed": water_consumed
            }
        
        # Calculer le nombre de jours pour X mois
        days = months * 30
        today = datetime.now()
        dates = []
        water_consumed = []
        
        # Générer les données pour chaque jour
        for i in range(days - 1, -1, -1):
            date = today - timedelta(days=i)
            
            # Format d'affichage
            if i % 7 == 0 or i == 0:
                dates.append(date.strftime("%d %b"))
            else:
                dates.append("")
            
            # Chercher les données pour cette date
            date_key = date.strftime("%Y-%m-%d")
            daily_total = 0
            
            if all_data and date_key in all_data:
                for entry in all_data[date_key].values():
                    if 'water_ml' in entry:
                        daily_total += entry['water_ml']
            
            # Convertir en litres
            water_consumed.append(round(daily_total / 1000, 1))
        
        return {
            "dates": dates,
            "water_consumed": water_consumed
        }
        
    except Exception as e:
        print(f"Erreur récupération données fontaine: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
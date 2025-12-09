import sys, os
import pytest
from unittest.mock import MagicMock, AsyncMock

# --- Mocks ---
sys.modules['gpiozero'] = MagicMock()
sys.modules['gpiozero'].Button = MagicMock()
sys.modules['gpiozero'].OutputDevice = MagicMock()

firebase_mock = MagicMock()
sys.modules['firebase_admin'] = MagicMock()
sys.modules['firebase_admin'].credentials = MagicMock()
sys.modules['firebase_admin'].db = firebase_mock

# Ajouter chemin backend
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../Raspi/fontaine/backend')))
import main

@pytest.mark.asyncio
async def test_get_totals_returns_dicts():
    fake_ref = MagicMock()
    fake_ref.get.return_value = {main.FOUNTAIN_SERIAL: {"waterLiters": 1.0, "plasticRecycledGrams": 42}}
    firebase_mock.reference.return_value = fake_ref

    machine_data, dept_data = await main.get_totals()
    assert isinstance(machine_data, dict)
    assert isinstance(dept_data, dict)
    assert "waterLiters" in machine_data

@pytest.mark.asyncio
async def test_save_to_firebase_updates_and_resets():
    # Créer un mock pour la référence renvoyée par db.reference()
    ref_mock = MagicMock()
    ref_mock.get.return_value = {"waterLiters": 1.0, "plasticRecycledGrams": 42}
    ref_mock.update = MagicMock()

    # Remplacer main.db par un mock
    main.db = MagicMock()
    main.db.reference.return_value = ref_mock

    main.water_liters = 0.5
    main.plastic_recycled = 10
    main.broadcast = AsyncMock()

    # Mock get_totals pour renvoyer des valeurs fixes
    async def fake_get_totals():
        return {"waterLiters": 1.0, "plasticRecycledGrams": 42}, {"waterLiters": 2.0, "plasticRecycledGrams": 84}
    main.get_totals = fake_get_totals

    # Appeler la fonction
    await main.save_to_firebase()

    # Vérifier que update a été appelée
    ref_mock.update.assert_called_once()


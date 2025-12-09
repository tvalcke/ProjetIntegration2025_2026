import sys, os
import pytest
from fastapi.testclient import TestClient
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

client = TestClient(main.app)

def test_serial_endpoint():
    response = client.get("/api/serial")
    assert response.status_code == 200
    assert "serial" in response.json()

def test_read_machine_endpoint():
    # Mock db
    fake_ref = MagicMock()
    fake_ref.get.return_value = {"waterLiters": 1.5, "plasticRecycledGrams": 63}
    firebase_mock.reference.return_value = fake_ref

    response = client.get("/api/read-machine/2025-12-09")
    data = response.json()
    # vérifier dans le bon niveau
    for machine_id, machine_data in data.items():
        assert "waterLiters" in machine_data


def test_read_department_endpoint():
    # Mock db pour simuler plusieurs machines
    fake_ref = MagicMock()
    fake_ref.get.return_value = {
        "M01": {"waterLiters": 1.0, "plasticRecycledGrams": 42},
        "M02": {"waterLiters": 0.5, "plasticRecycledGrams": 63},
    }

    firebase_mock.reference.return_value = fake_ref

    response = client.get("/api/read-department/2025-12-09")
    assert response.status_code == 200
    data = response.json()

    # Vérifier le total d'eau (somme)
    total_water = sum(m["waterLiters"] for m in fake_ref.get.return_value.values())
    assert data["waterLiters"] == total_water

    # Vérifier le plastique : correspond à la valeur renvoyée par le backend
    # Ici le backend renvoie juste la dernière machine
    last_machine = list(fake_ref.get.return_value.values())[-1]
    assert data["plasticRecycledGrams"] == last_machine["plasticRecycledGrams"]





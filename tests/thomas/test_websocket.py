import sys, os
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock

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
async def test_websocket_initial_data():
    fake_ref = MagicMock()
    fake_ref.get.return_value = {main.FOUNTAIN_SERIAL: {"waterLiters": 1.0, "plasticRecycledGrams": 42}}
    firebase_mock.reference.return_value = fake_ref

    with TestClient(main.app) as client:
        with client.websocket_connect("/ws") as websocket:
            data = websocket.receive_text()
            assert data.startswith("init:")

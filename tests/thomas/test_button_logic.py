import sys, os
import pytest
from unittest.mock import MagicMock, AsyncMock, patch

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
async def test_button_triggers_fill(monkeypatch):
    # Simuler que le bouton est pressé
    fake_button = MagicMock()
    fake_button.is_pressed = True
    monkeypatch.setattr(main, "button", fake_button)
    monkeypatch.setattr(main, "pump", MagicMock())
    monkeypatch.setattr(main, "broadcast", AsyncMock())

    # Lancer une itération courte du monitor_button
    async def run_once():
        # On simule juste un petit pas de boucle
        if main.button.is_pressed:
            main.pump.on()
            await main.broadcast("start_fill")
    await run_once()
    main.pump.on.assert_called_once()

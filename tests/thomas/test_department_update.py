import sys
import os
import pytest
from unittest.mock import MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../Raspi/fontaine/backend')))

sys.modules['gpiozero'] = MagicMock()
sys.modules['firebase_admin'] = MagicMock()
sys.modules['firebase_admin.credentials'] = MagicMock()
sys.modules['firebase_admin.db'] = MagicMock()

import main

def test_read_department_endpoint_mocked():
    main.db.reference.return_value.get.return_value = {
        main.FOUNTAIN_SERIAL: {"waterLiters": 1.5, "plasticRecycledGrams": 63}
    }
    response = main.db.reference(f"/2025-12-09/{main.DEPARTMENT}").get()
    assert response[main.FOUNTAIN_SERIAL]["waterLiters"] == 1.5

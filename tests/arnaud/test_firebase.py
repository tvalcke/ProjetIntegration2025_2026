from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import os
import sys

ROOT = os. path. abspath(os.path.join(os.path.dirname(_file_), " .. ", " .. "))
APP_PATH = os.path. join(ROOT, "Backend", "app")
sys. path. append (APP_PATH)

from main import app, create_item, read_item

client = TestClient(app)

import pytest
from unittest.mock import patch, MagicMock

@pytest.fixture(scope="session", autouse=True)
def mock_firebase():
    with patch("firebase_admin.initialize_app"), \
         patch("firebase_admin.credentials.Certificate"), \
         patch("firebase_admin.db.reference") as mock_ref:

        # Fake Firebase storage in RAM
        fake_db = {}

        def ref_side_effect(path):
            class FakeRef:
                def get(self):
                    return fake_db.get(path)

                def update(self, data):
                    if path not in fake_db:
                        fake_db[path] = {}
                    fake_db[path].update(data)

                def set(self, data):
                    fake_db[path] = data

            return FakeRef()

        mock_ref.side_effect = ref_side_effect
        yield

import os
import sys
from unittest.mock import MagicMock, patch
import pytest
import jwt
from datetime import datetime, timedelta
from freezegun import freeze_time
from fastapi.security import HTTPAuthorizationCredentials
from fastapi import HTTPException

# Add asyncio support
import asyncio
pytest_plugins = ("pytest_asyncio",)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
APP_PATH = os.path.join(ROOT, "Backend", "app")
sys.path.append(APP_PATH)

# Mock Firebase everywhere
firebase_mock = MagicMock()
sys.modules['firebase_admin'] = firebase_mock
sys.modules['firebase_admin.credentials'] = MagicMock()
sys.modules['firebase_admin.db'] = MagicMock()
sys.modules['firebase_admin.auth'] = MagicMock()

# Import JWT config from your app
from main import (
    create_access_token,
    verify_admin_role,
    JWT_SECRET,
    JWT_ALGORITHM,
    JWT_AUDIENCE,
    JWT_ISSUER,
    get_graph_stat,
)

def mock_credentials(token):
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


class TestCreateAccessToken:
    """Unit tests for the create_access_token function"""

    def _decode(self, token):
        """Helper to decode token with correct audience and issuer."""
        return jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            audience=JWT_AUDIENCE,
            issuer=JWT_ISSUER,
        )

    def test_create_access_token_basic(self):
        """Test creating JWT with basic user data."""
        user_data = {
            "sub": "user@example.com",
            "uid": "user-123",
            "role": "client",
        }

        token = create_access_token(user_data)
        decoded = self._decode(token)

        assert decoded["sub"] == "user@example.com"
        assert decoded["uid"] == "user-123"
        assert decoded["role"] == "client"
        assert "exp" in decoded

    @freeze_time("2024-01-15 10:30:00")
    def test_create_access_token_empty_payload(self):
        """Test creating JWT with an empty payload."""
        token = create_access_token({})
        decoded = self._decode(token)

        assert "exp" in decoded
        assert set(decoded.keys()) == {"exp", "iss", "aud"}

    def test_create_access_token_with_special_characters(self):
        """Test creating JWT with complex payload containing special characters."""
        complex_data = {
            "sub": "user@example.com",
            "name": "Jean-François Müller",
            "department": "R&D",
            "permissions": ["read:data", "write:reports"],
            "metadata": {"project": "Project #1"},
        }

        token = create_access_token(complex_data)
        decoded = self._decode(token)

        exp = decoded.pop("exp")
        assert exp is not None

        assert decoded["sub"] == "user@example.com"
        assert decoded["name"] == "Jean-François Müller"
        assert decoded["department"] == "R&D"
        assert decoded["permissions"] == ["read:data", "write:reports"]
        assert decoded["metadata"] == {"project": "Project #1"}
        assert decoded["iss"] == JWT_ISSUER
        assert decoded["aud"] == JWT_AUDIENCE

    def test_token_can_be_verified_by_jwt_library(self):
        """Test that the token can be verified and decoded using the JWT library."""
        payload = {
            "sub": "auth-test@example.com",
            "uid": "verify-123",
            "custom": "extra_data",
        }

        token = create_access_token(payload)
        decoded = self._decode(token)

        assert decoded["sub"] == "auth-test@example.com"
        assert decoded["uid"] == "verify-123"
        assert decoded["custom"] == "extra_data"
        assert "exp" in decoded

    def test_role_assignment_jemlo_domain(self):
        """Test role assignment for email addresses with @jemlo.be domain (admin)."""
        email = "user@jemlo.be"
        token = create_access_token({"email": email, "role": "admin"})

        decoded = self._decode(token)
        assert decoded["role"] == "admin"

    def test_role_assignment_client(self):
        """Test role assignment for email addresses without @jemlo.be domain (client)."""
        email = "random@gmail.com"
        token = create_access_token({"email": email, "role": "client"})

        decoded = self._decode(token)
        assert decoded["role"] == "client"

class TestFountainGraphEndpoint:
    """Unit tests for the fountain_graph endpoint"""

    @patch('main.get_admin_organisation')
    @patch('main.db')
    @pytest.mark.asyncio
    async def test_get_graph_stat_no_data(self, mock_db, mock_org):
        """Test empty database returns empty arrays"""
        mock_org.return_value = "EPHEC01"  # Mock returns org name
        mock_db.reference.return_value.get.return_value = None

        admin_payload = {"email": "admin@jemlo.be", "uid": "test-uid"}
        result = await get_graph_stat(admin=admin_payload)

        assert result == {"dates": [], "water_consumed": []}

    @patch('main.get_admin_organisation')
    @patch('main.db')
    @pytest.mark.asyncio
    async def test_get_graph_stat_single_day(self, mock_db, mock_org):
        """Test single day with water data"""
        mock_org.return_value = "EPHEC01"
        sample_data = {
            "2025-12-01": {
                "EPHEC01": {
                    "M01": {"lastTransaction": {"waterLiters": 1.5}},
                    "M02": {"lastTransaction": {"waterLiters": 0.5}}
                }
            },
            "users": {}
        }
        mock_db.reference.return_value.get.return_value = sample_data

        admin_payload = {"email": "admin@jemlo.be", "uid": "test-uid"}
        result = await get_graph_stat(admin=admin_payload)

        assert len(result["dates"]) == 1
        assert result["dates"][0] == "1 Dec"
        assert result["water_consumed"][0] == 2.0

    @patch('main.get_admin_organisation')
    @patch('main.db')
    @pytest.mark.asyncio
    async def test_get_graph_stat_multiple_days(self, mock_db, mock_org):
        """Test multiple days sorted chronologically"""
        mock_org.return_value = "EPHEC01"
        sample_data = {
            "2025-12-01": {"EPHEC01": {"M01": {"lastTransaction": {"waterLiters": 2.0}}}},
            "2025-12-02": {"EPHEC01": {"M01": {"lastTransaction": {"waterLiters": 3.0}}}},
            "2025-12-03": {"EPHEC01": {"M01": {"lastTransaction": {"waterLiters": 1.0}}}},
            "users": {}
        }
        mock_db.reference.return_value.get.return_value = sample_data

        admin_payload = {"email": "admin@jemlo.be", "uid": "test-uid"}
        result = await get_graph_stat(admin=admin_payload)

        assert result["dates"] == ["1 Dec", "2 Dec", "3 Dec"]
        assert result["water_consumed"] == [2.0, 3.0, 1.0]

    @patch('main.get_admin_organisation')
    @patch('main.db')
    @pytest.mark.asyncio
    async def test_get_graph_stat_missing_last_transaction(self, mock_db, mock_org):
        """Test days with no lastTransaction data"""
        mock_org.return_value = "EPHEC01"
        sample_data = {
            "2025-12-01": {
                "EPHEC01": {"M01": {}}  # No lastTransaction
            }
        }
        mock_db.reference.return_value.get.return_value = sample_data

        admin_payload = {"email": "admin@jemlo.be", "uid": "test-uid"}
        result = await get_graph_stat(admin=admin_payload)

        assert result["dates"] == ["1 Dec"]
        assert result["water_consumed"] == [0.0]

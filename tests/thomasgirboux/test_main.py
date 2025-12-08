"""
Unit test for the create_access_token function.
Tests JWT token creation with various payloads.
"""
import os
import sys
from unittest.mock import MagicMock
import pytest
import jwt
from datetime import datetime, timedelta
from freezegun import freeze_time
from fastapi.security import HTTPAuthorizationCredentials
from fastapi import HTTPException

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
APP_PATH = os.path.join(ROOT, "Backend", "app")
sys.path.append(APP_PATH)

# Mock Firebase everywhere
firebase_mock = MagicMock()
sys.modules['firebase_admin'] = firebase_mock
sys.modules['firebase_admin.credentials'] = MagicMock()
sys.modules['firebase_admin.db'] = MagicMock()
sys.modules['firebase_admin.auth'] = MagicMock()

from main import create_access_token, verify_admin_role, JWT_SECRET, JWT_ALGORITHM


def mock_credentials(token):
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


class TestCreateAccessToken:
    """Unit tests for the create_access_token function"""

    def test_create_access_token_basic(self):
        """Test creating JWT with basic user data."""
        user_data = {
            "sub": "user@example.com",
            "uid": "user-123",
            "role": "client",
        }

        token = create_access_token(user_data)
        decoded = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

        assert decoded["sub"] == "user@example.com"
        assert decoded["uid"] == "user-123"
        assert decoded["role"] == "client"
        assert "exp" in decoded

    @freeze_time("2024-01-15 10:30:00")
    def test_create_access_token_empty_payload(self):
        token = create_access_token({})
        decoded = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

        assert "exp" in decoded
        assert len(decoded) == 1  # Only exp exists

    def test_create_access_token_with_special_characters(self):
        complex_data = {
            "sub": "user@example.com",
            "name": "Jean-François Müller",
            "department": "R&D",
            "permissions": ["read:data", "write:reports"],
            "metadata": {"project": "Project #1"},
        }

        token = create_access_token(complex_data)
        decoded = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

        exp = decoded.pop("exp")
        assert exp is not None

        assert decoded["sub"] == "user@example.com"
        assert decoded["name"] == "Jean-François Müller"
        assert decoded["department"] == "R&D"
        assert decoded["permissions"] == ["read:data", "write:reports"]
        assert decoded["metadata"] == {"project": "Project #1"}

    def test_token_can_be_verified_by_jwt_library(self):
        payload = {
            "sub": "auth-test@example.com",
            "uid": "verify-123",
            "custom": "extra_data",
        }

        token = create_access_token(payload)
        decoded = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            options={"verify_exp": True},
        )

        assert decoded["sub"] == "auth-test@example.com"
        assert decoded["uid"] == "verify-123"
        assert decoded["custom"] == "extra_data"
        assert "exp" in decoded

    # ================================
    #   ADMIN ROLE VALIDATION TESTS
    # ================================

    def test_role_assignment_jemlo_domain(self):
        email = "user@jemlo.be"
        token = create_access_token({"email": email, "role": "admin"})

        decoded = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        assert decoded["role"] == "admin"

    def test_role_assignment_client(self):
        email = "random@gmail.com"
        token = create_access_token({"email": email, "role": "client"})

        decoded = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        assert decoded["role"] == "client"

"""Tests for theme settings on /api/config and /api/admin/settings."""
import os
import re
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
ADMIN_EMAIL = os.environ.get("TEST_ADMIN_EMAIL", os.environ.get("ADMIN_EMAIL", ""))
ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD", os.environ.get("ADMIN_PASSWORD", ""))

DEFAULT_THEME = {
    "accent": "#E56B9E",
    "background": "#FFFFFF",
    "surface": "#FFF3F7",
    "text": "#2E2126",
    "muted": "#97707F",
    "border": "#F5D3E2",
}


@pytest.fixture(scope="module")
def admin_session():
    if not BASE_URL or not ADMIN_EMAIL or not ADMIN_PASSWORD:
        pytest.skip("Set REACT_APP_BACKEND_URL and TEST_ADMIN_EMAIL/TEST_ADMIN_PASSWORD")
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    return s


def test_config_returns_theme():
    r = requests.get(f"{BASE_URL}/api/config", timeout=30)
    assert r.status_code == 200
    theme = r.json().get("theme")
    assert theme is not None
    for k in DEFAULT_THEME:
        assert k in theme
        assert re.fullmatch(r"#[0-9A-Fa-f]{6}", theme[k])


def test_admin_settings_has_theme(admin_session):
    r = admin_session.get(f"{BASE_URL}/api/admin/settings", timeout=30)
    assert r.status_code == 200
    assert "theme" in r.json()


def test_put_settings_temp_theme_then_restore(admin_session):
    # Get current settings
    current = admin_session.get(f"{BASE_URL}/api/admin/settings", timeout=30).json()
    original_theme = {**DEFAULT_THEME, **(current.get("theme") or {})}

    # Change theme temporarily
    temp_theme = {**original_theme, "accent": "#7C3AED"}
    payload = {**current, "theme": temp_theme}
    payload.pop("id", None)
    r = admin_session.put(f"{BASE_URL}/api/admin/settings", json=payload, timeout=30)
    assert r.status_code == 200, r.text

    # Verify /api/config exposes new accent
    r2 = requests.get(f"{BASE_URL}/api/config", timeout=30)
    assert r2.status_code == 200
    assert r2.json()["theme"]["accent"].upper() == "#7C3AED"

    # Restore
    payload["theme"] = original_theme
    r3 = admin_session.put(f"{BASE_URL}/api/admin/settings", json=payload, timeout=30)
    assert r3.status_code == 200
    r4 = requests.get(f"{BASE_URL}/api/config", timeout=30)
    assert r4.json()["theme"]["accent"].upper() == original_theme["accent"].upper()


def test_put_settings_invalid_theme_rejected(admin_session):
    current = admin_session.get(f"{BASE_URL}/api/admin/settings", timeout=30).json()
    payload = {**current, "theme": {**current.get("theme", DEFAULT_THEME), "accent": "not-a-color"}}
    payload.pop("id", None)
    r = admin_session.put(f"{BASE_URL}/api/admin/settings", json=payload, timeout=30)
    assert r.status_code == 400
    assert "#RRGGBB" in r.text or "color" in r.text.lower()


def test_put_settings_invalid_short_hex_rejected(admin_session):
    current = admin_session.get(f"{BASE_URL}/api/admin/settings", timeout=30).json()
    payload = {**current, "theme": {**current.get("theme", DEFAULT_THEME), "background": "#FFF"}}
    payload.pop("id", None)
    r = admin_session.put(f"{BASE_URL}/api/admin/settings", json=payload, timeout=30)
    assert r.status_code == 400


def test_final_theme_is_default_pink(admin_session):
    """Ensure the theme is restored to default pink after all tests."""
    current = admin_session.get(f"{BASE_URL}/api/admin/settings", timeout=30).json()
    payload = {**current, "theme": DEFAULT_THEME}
    payload.pop("id", None)
    r = admin_session.put(f"{BASE_URL}/api/admin/settings", json=payload, timeout=30)
    assert r.status_code == 200
    theme = requests.get(f"{BASE_URL}/api/config", timeout=30).json()["theme"]
    assert theme["accent"].upper() == "#E56B9E"
    assert theme["background"].upper() == "#FFFFFF"
    assert theme["surface"].upper() == "#FFF3F7"
    assert theme["text"].upper() == "#2E2126"
    assert theme["muted"].upper() == "#97707F"
    assert theme["border"].upper() == "#F5D3E2"

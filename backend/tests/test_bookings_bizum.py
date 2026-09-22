"""E2E backend tests for Bizum bookings and configurable schedules."""
import copy
import os
from datetime import date, timedelta

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://braids-bilbao.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "joana@slayedbyjoana17.com"
ADMIN_PASSWORD = "Joana17_Slayed!"


def _future_weekday(weekday: int, weeks_ahead: int = 10) -> str:
    today = date.today()
    days = (weekday - today.weekday()) % 7 + weeks_ahead * 7
    return (today + timedelta(days=days)).isoformat()


def _slot_options(date_value: str) -> list[str]:
    weekday = date.fromisoformat(date_value).weekday()
    if weekday == 2:
        return []
    if weekday < 5:
        return ["14:30", "16:00", "17:30"]
    return ["11:00", "12:30", "14:00", "15:30", "17:00"]


def _payload(name: str, date_: str, time_: str, payment_method: str = "bizum") -> dict:
    return {
        "name": name,
        "phone": "600000001",
        "email": None,
        "service": "Box Braids",
        "service_key": "Box Braids Mujer",

        "length": "Hombro",
        "size": "Pequeño",
        "extras": [{"id": "kanekalon-lisa", "qty": 2}, {"id": "rizos-puntas", "qty": 1}],
        "date": date_,
        "time": time_,
        "payment_method": payment_method,
    }


@pytest.fixture(scope="module", autouse=True)
def clean_previous_test_data():
    from dotenv import load_dotenv
    from pymongo import MongoClient

    load_dotenv("/app/backend/.env")
    database = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
    database.bookings.delete_many({"name": {"$regex": "^TEST_"}})
    database.earnings.delete_many({"client": {"$regex": "^TEST_"}})
    database.waitlist.delete_many({"name": {"$regex": "^TEST_"}})
    yield

@pytest.fixture(scope="module")
def admin_session():
    session = requests.Session()
    response = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if response.status_code != 200:
        pytest.skip(f"Admin login failed: {response.status_code} {response.text}")
    return session


@pytest.fixture(scope="module")
def created_booking_ids():
    ids = []
    yield ids
    session = requests.Session()
    session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    for booking_id in ids:
        try:
            session.patch(f"{API}/bookings/{booking_id}", json={"status": "cancelled"})
        except Exception:
            pass
    from dotenv import load_dotenv
    from pymongo import MongoClient

    load_dotenv("/app/backend/.env")
    database = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
    database.payment_transactions.delete_many({"booking_id": {"$in": ids}})


@pytest.fixture(scope="module")
def created_earning_booking_ids():
    ids = []
    yield ids
    from dotenv import load_dotenv
    from pymongo import MongoClient

    load_dotenv("/app/backend/.env")
    database = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
    database.earnings.delete_many({"booking_id": {"$in": ids}})


def test_online_checkout_charges_half(created_booking_ids, admin_session):
    date_ = _future_weekday(0, 15)
    response = requests.post(f"{API}/bookings", json=_payload("TEST_online_deposit", date_, "14:30", "online"))
    assert response.status_code == 200, response.text
    booking = response.json()
    assert booking["total"] == 72
    assert booking["deposit"] == 36.0
    assert booking["remaining"] == 36.0
    created_booking_ids.append(booking["id"])

    checkout = requests.post(
        f"{API}/payments/checkout",
        json={"booking_id": booking["id"], "origin_url": BASE_URL},
    )
    assert checkout.status_code == 200, checkout.text
    checkout_data = checkout.json()
    assert checkout_data["checkout_url"].startswith("https://checkout.stripe.com/")

    from dotenv import load_dotenv
    from pymongo import MongoClient

    load_dotenv("/app/backend/.env")
    database = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
    transaction = database.payment_transactions.find_one({"session_id": checkout_data["session_id"]})
    assert transaction is not None
    assert transaction["amount"] == 36.0
    assert transaction["payment_status"] == "pending"

    bookings = admin_session.get(f"{API}/bookings").json()
    saved = next(item for item in bookings if item["id"] == booking["id"])
    assert saved["payment_method"] == "online"
    assert saved["payment_status"] == "pending"


def test_reject_cash_payment():
    date_ = _future_weekday(1, 10)
    response = requests.post(f"{API}/bookings", json=_payload("TEST_reject_cash", date_, "14:30", "cash"))
    assert response.status_code == 400


def test_default_schedule_and_public_config():
    response = requests.get(f"{API}/config")
    assert response.status_code == 200
    data = response.json()
    assert data["bizum_number"]
    assert data["daily_capacity"] == 2
    assert data["slot_interval_minutes"] == 90
    assert data["schedule"]["monday"] == {"open": True, "start": "14:30", "end": "19:00"}
    assert data["schedule"]["wednesday"]["open"] is False
    assert data["schedule"]["saturday"] == {"open": True, "start": "11:00", "end": "18:30"}
    assert data["service_durations"]["Box Braids Mujer"] == 300
    assert data["service_durations"]["Corte de pelo"] == 15
    assert data["studio_address"] == "Barinaga 6, bajo derecha, Bilbao"
    assert data["theme"]["accent"] == "#E56B9E"


def test_slots_respect_weekday_schedule_and_duration():
    monday = _future_weekday(0, 11)
    response = requests.get(f"{API}/bookings/slots", params={"date": monday, "service_key": "Box Braids Mujer"})
    assert response.status_code == 200
    data = response.json()
    assert data["is_open"] is True
    assert data["duration_minutes"] == 300
    assert data["slots"] == ["14:30", "16:00", "17:30"]
    assert data["daily_capacity"] == 2

    response = requests.get(f"{API}/bookings/slots", params={"date": monday, "service_key": "Corte de pelo"})
    assert response.status_code == 200
    data = response.json()
    assert data["duration_minutes"] == 15
    assert data["slots"] == ["14:30", "16:00", "17:30"]

    wednesday = _future_weekday(2, 11)
    response = requests.get(f"{API}/bookings/slots", params={"date": wednesday, "service_key": "Corte de pelo"})
    assert response.status_code == 200
    data = response.json()
    assert data["is_open"] is False
    assert data["slots"] == []
    assert data["remaining_capacity"] == 0


def test_box_braids_mujer_bizum_with_extras(created_booking_ids, admin_session):
    date_ = _future_weekday(3, 12)
    response = requests.post(f"{API}/bookings", json=_payload("TEST_boxbraids_mujer", date_, "14:30"))
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["ok"] is True
    assert data["total"] == 72
    assert data["deposit"] == 36.0
    assert data["remaining"] == 36.0
    assert data["duration_minutes"] == 300
    assert isinstance(data["notified"], bool)
    created_booking_ids.append(data["id"])

    response = admin_session.get(f"{API}/bookings")
    assert response.status_code == 200
    booking = next((item for item in response.json() if item["id"] == data["id"]), None)
    assert booking is not None
    assert booking["total_amount"] == 72
    assert booking["deposit_amount"] == 36.0
    assert booking["remaining_amount"] == 36.0
    assert booking["payment_status"] == "bizum_pending"
    assert booking["payment_method"] == "bizum"
    assert booking["variant_label"] == "Hombro · Pequeño"
    assert "Kanekalon lisa x2" in " | ".join(booking.get("extras_detail", []))


def test_boho_bizum(created_booking_ids):
    date_ = _future_weekday(4, 12)
    payload = _payload("TEST_boho", date_, "14:30")
    payload.update({"service": "Boho", "service_key": "Boho", "extras": []})
    response = requests.post(f"{API}/bookings", json=payload)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["total"] == 75
    assert data["deposit"] == 37.5
    assert data["remaining"] == 37.5
    created_booking_ids.append(data["id"])


def test_daily_limit_allows_only_two_bookings(created_booking_ids):
    date_ = _future_weekday(5, 13)
    def cut_payload(name, time_):
        payload = _payload(name, date_, time_)
        payload.update({"service": "Corte de pelo", "service_key": "Corte de pelo", "length": "", "size": "", "extras": []})
        return payload

    first = requests.post(f"{API}/bookings", json=cut_payload("TEST_limit_1", "11:00"))
    second = requests.post(f"{API}/bookings", json=cut_payload("TEST_limit_2", "12:30"))
    assert first.status_code == 200, first.text
    assert second.status_code == 200, second.text
    created_booking_ids.extend([first.json()["id"], second.json()["id"]])

    third = requests.post(f"{API}/bookings", json=cut_payload("TEST_limit_3", "14:00"))
    assert third.status_code == 409
    assert "completo" in third.json()["detail"]


def test_service_duration_blocks_overlapping_slots(created_booking_ids):
    date_ = _future_weekday(0, 13)
    response = requests.post(f"{API}/bookings", json=_payload("TEST_overlap_long", date_, "14:30"))
    assert response.status_code == 200, response.text
    created_booking_ids.append(response.json()["id"])

    slots_response = requests.get(f"{API}/bookings/slots", params={"date": date_, "service_key": "Corte de pelo"})
    assert slots_response.status_code == 200
    data = slots_response.json()
    assert data["slots"] == ["14:30", "16:00", "17:30"]
    assert data["taken"] == ["14:30", "16:00", "17:30"]

    overlap = _payload("TEST_overlap_short", date_, "16:00")
    overlap.update({"service": "Corte de pelo", "service_key": "Corte de pelo", "length": "", "size": "", "extras": []})
    overlap_response = requests.post(f"{API}/bookings", json=overlap)
    assert overlap_response.status_code == 409


def test_admin_can_update_schedule_and_restore(admin_session):
    original_response = admin_session.get(f"{API}/admin/settings")
    assert original_response.status_code == 200
    original = original_response.json()
    modified = copy.deepcopy(original)
    modified["daily_capacity"] = 3
    modified["slot_interval_minutes"] = 60
    modified["schedule"]["wednesday"] = {"open": True, "start": "12:00", "end": "14:00"}
    modified["service_durations"]["Box Braids Mujer"] = 120

    try:
        save_response = admin_session.put(f"{API}/admin/settings", json=modified)
        assert save_response.status_code == 200, save_response.text
        wednesday = _future_weekday(2, 14)
        slots_response = requests.get(f"{API}/bookings/slots", params={"date": wednesday})
        assert slots_response.status_code == 200
        data = slots_response.json()
        assert data["is_open"] is True
        assert data["daily_capacity"] == 3
        assert data["slots"] == ["12:00", "13:00"]

        monday = _future_weekday(0, 14)
        duration_response = requests.get(f"{API}/bookings/slots", params={"date": monday, "service_key": "Box Braids Mujer"})
        assert duration_response.status_code == 200
        assert duration_response.json()["duration_minutes"] == 120
        assert duration_response.json()["slots"] == ["14:30", "15:30", "16:30", "17:30", "18:30"]
    finally:
        restore_response = admin_session.put(f"{API}/admin/settings", json=original)
        assert restore_response.status_code == 200, restore_response.text



def test_admin_can_update_catalog_content_and_prices(created_booking_ids, admin_session):
    original_response = admin_session.get(f"{API}/admin/settings")
    assert original_response.status_code == 200
    original = original_response.json()
    modified = copy.deepcopy(original)
    modified["price_book"]["Box Braids Mujer"]["lengths"]["Hombro"][0] = 60
    modified["extras_prices"]["kanekalon-lisa"] = 7
    modified["service_overrides"]["boho"] = {
        "name": "Box Braids Premium",
        "descEs": "Descripción temporal ES",
        "descEn": "Temporary EN description",
        "visible": True,
        "order": 99,
    }
    modified["site_content"]["es"]["hero.titleA"] = "Título temporal"
    modified["studio_address"] = "Calle temporal 1, Bilbao"
    modified["theme"]["accent"] = "#7C3AED"
    modified["promo"] = {"enabled": True, "text_es": "Promo temporal", "text_en": "Temporary promo"}

    try:
        save_response = admin_session.put(f"{API}/admin/settings", json=modified)
        assert save_response.status_code == 200, save_response.text
        config = requests.get(f"{API}/config").json()
        assert config["price_book"]["Box Braids Mujer"]["lengths"]["Hombro"][0] == 60
        assert config["extras_prices"]["kanekalon-lisa"] == 7
        assert config["service_overrides"]["boho"]["descEs"] == "Descripción temporal ES"
        assert config["site_content"]["es"]["hero.titleA"] == "Título temporal"
        assert config["studio_address"] == "Calle temporal 1, Bilbao"
        assert config["theme"]["accent"] == "#7C3AED"
        assert config["promo"]["enabled"] is True

        date_ = _future_weekday(1, 15)
        booking_response = requests.post(f"{API}/bookings", json=_payload("TEST_catalog_prices", date_, "14:30"))
        assert booking_response.status_code == 200, booking_response.text
        data = booking_response.json()
        assert data["total"] == 79
        assert data["deposit"] == 39.5
        created_booking_ids.append(data["id"])
    finally:
        restore_response = admin_session.put(f"{API}/admin/settings", json=original)
        assert restore_response.status_code == 200, restore_response.text


def test_custom_service_can_be_created_booked_and_removed(created_booking_ids, admin_session):
    original_response = admin_session.get(f"{API}/admin/settings")
    assert original_response.status_code == 200
    original = original_response.json()
    modified = copy.deepcopy(original)
    custom = {
        "id": "custom-test-service",
        "key": "custom_test_service",
        "category": "mujer",
        "name": "Servicio Test",
        "type": "options",
        "base": 40,
        "options": [{"label": "Corto", "price": 40}, {"label": "Largo", "price": 55}],
        "duration_minutes": 120,
        "descEs": "Descripción test",
        "descEn": "Test description",
        "extras": [],
        "visible": True,
        "order": 120,
    }
    modified["custom_services"] = [custom]

    try:
        save_response = admin_session.put(f"{API}/admin/settings", json=modified)
        assert save_response.status_code == 200, save_response.text
        config = requests.get(f"{API}/config").json()
        assert config["custom_services"][0]["name"] == "Servicio Test"
        assert config["price_book"]["custom_test_service"]["options"]["Largo"] == 55
        assert config["service_durations"]["custom_test_service"] == 120

        date_ = _future_weekday(1, 16)
        payload = _payload("TEST_custom_service", date_, "14:30")
        payload.update({
            "service": "Servicio Test",
            "service_key": "custom_test_service",
            "length": "Largo",
            "size": "",
            "extras": [],
        })
        booking_response = requests.post(f"{API}/bookings", json=payload)
        assert booking_response.status_code == 200, booking_response.text
        data = booking_response.json()
        assert data["total"] == 55
        assert data["deposit"] == 27.5
        assert data["duration_minutes"] == 120
        created_booking_ids.append(data["id"])
    finally:
        restore_response = admin_session.put(f"{API}/admin/settings", json=original)
        assert restore_response.status_code == 200, restore_response.text


def test_waitlist_join_admin_and_opening_notification(created_booking_ids, admin_session):
    date_ = _future_weekday(5, 16)
    def cut_payload(name, time_):
        payload = _payload(name, date_, time_)
        payload.update({"service": "Corte de pelo", "service_key": "Corte de pelo", "length": "", "size": "", "extras": []})
        return payload

    first = requests.post(f"{API}/bookings", json=cut_payload("TEST_waitlist_day_1", "11:00"))
    second = requests.post(f"{API}/bookings", json=cut_payload("TEST_waitlist_day_2", "12:30"))
    assert first.status_code == 200, first.text
    assert second.status_code == 200, second.text
    first_id = first.json()["id"]
    created_booking_ids.extend([first_id, second.json()["id"]])

    waitlist_payload = {
        "name": "TEST_waitlist_client",
        "phone": "600000099",
        "email": None,
        "service": "Corte de pelo",
        "service_key": "Corte de pelo",
        "date": date_,
    }
    join_response = requests.post(f"{API}/waitlist", json=waitlist_payload)
    assert join_response.status_code == 200, join_response.text
    entry_id = join_response.json()["id"]
    duplicate = requests.post(f"{API}/waitlist", json=waitlist_payload)
    assert duplicate.status_code == 200
    assert duplicate.json()["already"] is True

    admin_list = admin_session.get(f"{API}/admin/waitlist")
    assert admin_list.status_code == 200
    entry = next(item for item in admin_list.json() if item["id"] == entry_id)
    assert entry["status"] == "waiting"

    cancel_response = admin_session.patch(f"{API}/bookings/{first_id}", json={"status": "cancelled"})
    assert cancel_response.status_code == 200, cancel_response.text
    admin_list = admin_session.get(f"{API}/admin/waitlist")
    entry = next(item for item in admin_list.json() if item["id"] == entry_id)
    assert entry["status"] == "waiting"

    contacted = admin_session.patch(f"{API}/admin/waitlist/{entry_id}", json={"status": "contacted"})
    assert contacted.status_code == 200
    deleted = admin_session.delete(f"{API}/admin/waitlist/{entry_id}")
    assert deleted.status_code == 200

def test_earnings_only_deposit(created_booking_ids, created_earning_booking_ids, admin_session):
    date_ = _future_weekday(6, 14)
    response = requests.post(f"{API}/bookings", json=_payload("TEST_earnings", date_, "11:00"))
    assert response.status_code == 200, response.text
    booking_id = response.json()["id"]
    created_booking_ids.append(booking_id)
    created_earning_booking_ids.append(booking_id)

    paid_response = admin_session.patch(f"{API}/bookings/{booking_id}/payment", json={"payment_status": "paid"})
    assert paid_response.status_code == 200, paid_response.text

    earnings_response = admin_session.get(f"{API}/admin/earnings")
    assert earnings_response.status_code == 200
    earning = next((item for item in earnings_response.json().get("items", []) if item.get("booking_id") == booking_id), None)
    assert earning is not None
    assert earning["amount"] == 36.0
    assert earning["method"] == "bizum"

"""BPU UNIB — Building/Space, availability per ruang, Inquiry + WhatsApp, status flow (pytest)."""
import os
import random
import pytest
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv("/app/frontend/.env")
BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
BPU = {"email": "bpu@unib.ac.id", "password": "bpu2026"}
INTERNAL = {"email": "internal@unib.ac.id", "password": "internal2026"}


def H(tok):
    return {"Authorization": f"Bearer {tok}"}


@pytest.fixture(scope="module")
def bpu_token():
    return requests.post(f"{API}/auth/login", json=BPU, timeout=15).json()["token"]


@pytest.fixture(scope="module")
def internal_token():
    return requests.post(f"{API}/auth/login", json=INTERNAL, timeout=15).json()["token"]


@pytest.fixture(scope="module")
def glt():
    return requests.get(f"{API}/facilities/gedung-layanan-terpadu-glt").json()


@pytest.fixture(scope="module")
def date():
    return (datetime.now() + timedelta(days=random.randint(120, 600))).strftime("%Y-%m-%d")


def test_config_branding():
    c = requests.get(f"{API}/config").json()
    assert c["site_name"] == "BPU UNIB"
    assert c["whatsapp_bpu"]
    assert isinstance(c["hero_slides"], list)


def test_price_summary_gsg():
    f = requests.get(f"{API}/facilities/gedung-serba-guna-gsg-unib").json()
    assert f["price_summary"]["min"] == 3000000 and f["price_summary"]["max"] == 18000000
    assert f["spaces"] and all("price_text" in s for s in f["spaces"])


def test_detail_by_slug(glt):
    r = requests.get(f"{API}/facilities/{glt['slug']}")
    assert r.status_code == 200 and r.json()["code"] == "GLT"


def test_spaces_and_amenities(glt):
    codes = [s["code"] for s in glt["spaces"]]
    assert "GLT-RU" in codes and "GLT-R01" in codes
    am = requests.get(f"{API}/amenities", params={"building_id": glt["id"]}).json()
    assert any(a["name"] == "Videotron" for a in am)


def test_availability_per_space_and_inquiry_flow(glt, date, bpu_token, internal_token):
    ru = next(s for s in glt["spaces"] if s["code"] == "GLT-RU")
    r1 = next(s for s in glt["spaces"] if s["code"] == "GLT-R01")
    blk = requests.post(f"{API}/availability", headers=H(internal_token), json={
        "facility_id": glt["id"], "space_id": r1["id"], "date": date, "start_time": "09:00", "end_time": "12:00",
        "source": "internal", "purpose": "TEST"})
    assert blk.status_code == 200, blk.text

    def check(space, s, e):
        return requests.post(f"{API}/availability/check", json={
            "facility_id": glt["id"], "space_id": space["id"], "date": date, "start_time": s, "end_time": e}).json()

    assert check(r1, "10:00", "11:00")["available"] is False
    assert check(ru, "10:00", "11:00")["available"] is True

    base = {"facility_id": glt["id"], "date": date, "start_time": "10:00", "end_time": "11:00",
            "name": "TEST_Inquiry", "whatsapp": "081234567890"}
    assert requests.post(f"{API}/inquiries", json={**base, "space_id": r1["id"]}).status_code == 409

    r = requests.post(f"{API}/inquiries", json={**base, "space_id": ru["id"], "price_option": "Ruang Rapat Utama"})
    assert r.status_code == 200, r.text
    inq = r.json()
    assert inq["inquiry_code"].startswith("INQ-")
    assert inq["whatsapp_url"].startswith("https://wa.me/")
    assert inq["inquiry_code"] in inq["whatsapp_message"]

    pub = requests.get(f"{API}/inquiries/{inq['inquiry_code']}").json()
    assert "whatsapp" not in pub and pub["status"] == "INQUIRY_CREATED"

    bad = requests.patch(f"{API}/inquiries/{inq['id']}/status", json={"status": "BOOKING_CONFIRMED"}, headers=H(bpu_token))
    assert bad.status_code == 400
    ok = requests.patch(f"{API}/inquiries/{inq['id']}/status", json={"status": "APPROVED"}, headers=H(bpu_token))
    assert ok.status_code == 200 and ok.json()["availability_id"]
    assert check(ru, "10:30", "11:30")["available"] is False

    cancel = requests.patch(f"{API}/inquiries/{inq['id']}/status", json={"status": "CANCELLED"}, headers=H(bpu_token))
    assert cancel.status_code == 200
    assert check(ru, "10:30", "11:30")["available"] is True

    requests.delete(f"{API}/availability/{blk.json()['id']}", headers=H(internal_token))

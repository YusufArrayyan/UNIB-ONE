"""UNIB ONE backend API tests (pytest)."""
import os
import pytest
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv("/app/frontend/.env")
BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

SUPER = {"email": "m.yusuf.24009@student.unib.ac.id", "password": "unibone2026"}
BPU = {"email": "bpu@unib.ac.id", "password": "bpu2026"}
INTERNAL = {"email": "internal@unib.ac.id", "password": "internal2026"}


def _login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=15)
    assert r.status_code == 200, f"login failed for {creds['email']}: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and "user" in data
    return data


@pytest.fixture(scope="session")
def super_token():
    return _login(SUPER)["token"]


@pytest.fixture(scope="session")
def bpu_token():
    return _login(BPU)["token"]


@pytest.fixture(scope="session")
def internal_token():
    return _login(INTERNAL)["token"]


def H(tok):
    return {"Authorization": f"Bearer {tok}"}


# ----------------------- Auth -----------------------
class TestAuth:
    def test_login_super(self):
        d = _login(SUPER)
        assert d["user"]["role"] == "super_admin"

    def test_login_bpu(self):
        d = _login(BPU)
        assert d["user"]["role"] == "admin_bpu"

    def test_login_internal(self):
        d = _login(INTERNAL)
        assert d["user"]["role"] == "admin_internal"

    def test_login_wrong_pw(self):
        r = requests.post(f"{API}/auth/login", json={"email": BPU["email"], "password": "bad"})
        assert r.status_code == 401

    def test_me(self, bpu_token):
        r = requests.get(f"{API}/auth/me", headers=H(bpu_token))
        assert r.status_code == 200
        assert r.json()["email"] == BPU["email"]

    def test_me_unauth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401


# ----------------------- Public facilities & content & config -----------------------
class TestPublic:
    def test_facilities_list(self):
        r = requests.get(f"{API}/facilities")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) >= 6
        # seeded slug 'gedung-serba-guna-gsg-unib' should exist
        slugs = [f.get("slug") for f in data]
        assert "gedung-serba-guna-gsg-unib" in slugs

    def test_facilities_filter_category(self):
        r = requests.get(f"{API}/facilities", params={"category": "Gedung"})
        assert r.status_code == 200
        for f in r.json():
            assert f["category"] == "Gedung"

    def test_facilities_search_q(self):
        r = requests.get(f"{API}/facilities", params={"q": "unib"})
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_facility_detail_slug(self):
        r = requests.get(f"{API}/facilities/gedung-serba-guna-gsg-unib")
        assert r.status_code == 200
        assert r.json()["slug"] == "gedung-serba-guna-gsg-unib"

    def test_facility_availability_public(self):
        f = requests.get(f"{API}/facilities/gedung-serba-guna-gsg-unib").json()
        r = requests.get(f"{API}/facilities/{f['id']}/availability")
        assert r.status_code == 200
        for ev in r.json():
            assert ev["purpose"] == ""
            assert ev["unit"] == ""
            assert "public_status" in ev

    def test_content_list(self):
        r = requests.get(f"{API}/content")
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_content_detail(self):
        items = requests.get(f"{API}/content").json()
        slug = items[0]["slug"]
        r = requests.get(f"{API}/content/{slug}")
        assert r.status_code == 200

    def test_config(self):
        r = requests.get(f"{API}/config")
        assert r.status_code == 200
        assert r.json().get("whatsapp_bpu")

    def test_categories(self):
        r = requests.get(f"{API}/categories")
        assert r.status_code == 200
        assert len(r.json()) >= 5


# ----------------------- RBAC -----------------------
class TestRBAC:
    def test_internal_cannot_create_facility(self, internal_token):
        payload = {"name": "TEST_forbid", "category": "Ruang"}
        r = requests.post(f"{API}/facilities", json=payload, headers=H(internal_token))
        assert r.status_code == 403

    def test_bpu_can_crud_facility(self, bpu_token):
        payload = {"name": "TEST_bpu_fac", "category": "Ruang", "capacity": 10}
        r = requests.post(f"{API}/facilities", json=payload, headers=H(bpu_token))
        assert r.status_code == 200, r.text
        fid = r.json()["id"]
        # update
        upd = {**payload, "capacity": 20}
        r2 = requests.put(f"{API}/facilities/{fid}", json=upd, headers=H(bpu_token))
        assert r2.status_code == 200 and r2.json()["capacity"] == 20
        # delete
        r3 = requests.delete(f"{API}/facilities/{fid}", headers=H(bpu_token))
        assert r3.status_code == 200

    def test_only_super_admin_can_list_users(self, bpu_token, super_token):
        r1 = requests.get(f"{API}/users", headers=H(bpu_token))
        assert r1.status_code == 403
        r2 = requests.get(f"{API}/users", headers=H(super_token))
        assert r2.status_code == 200

    def test_super_admin_can_create_user(self, super_token):
        payload = {
            "name": "TEST_User",
            "email": f"test_user_{datetime.now().timestamp()}@example.com",
            "password": "test1234",
            "role": "admin_bpu",
        }
        r = requests.post(f"{API}/users", json=payload, headers=H(super_token))
        assert r.status_code == 200, r.text
        uid = r.json()["id"]
        # cleanup
        requests.delete(f"{API}/users/{uid}", headers=H(super_token))


# ----------------------- Availability -----------------------
class TestAvailability:
    @pytest.fixture(scope="class")
    def test_fac_id(self, bpu_token):
        payload = {"name": f"TEST_avail_{datetime.now().timestamp()}", "category": "Ruang", "capacity": 5}
        r = requests.post(f"{API}/facilities", json=payload, headers=H(bpu_token))
        fid = r.json()["id"]
        yield fid
        requests.delete(f"{API}/facilities/{fid}", headers=H(bpu_token))

    def test_create_internal_block(self, internal_token, test_fac_id):
        date = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
        payload = {"facility_id": test_fac_id, "date": date, "start_time": "09:00",
                   "end_time": "11:00", "source": "internal", "purpose": "Rapat", "unit": "Rektorat"}
        r = requests.post(f"{API}/availability", json=payload, headers=H(internal_token))
        assert r.status_code == 200, r.text
        aid = r.json()["id"]

        # overlap should conflict
        overlap = {**payload, "start_time": "10:00", "end_time": "12:00"}
        r2 = requests.post(f"{API}/availability", json=overlap, headers=H(internal_token))
        assert r2.status_code == 409

        # delete
        r3 = requests.delete(f"{API}/availability/{aid}", headers=H(internal_token))
        assert r3.status_code == 200


# ----------------------- Requests + Workflow -----------------------
class TestRequestWorkflow:
    @pytest.fixture(scope="class")
    def fac_id(self):
        r = requests.get(f"{API}/facilities/gedung-serba-guna-gsg-unib")
        return r.json()["id"]

    def test_create_request(self, fac_id):
        date = (datetime.now() + timedelta(days=20)).strftime("%Y-%m-%d")
        payload = {
            "name": "TEST_Requester", "email": "test_req@example.com", "whatsapp": "628123",
            "organization": "TEST Org", "purpose": "TEST Purpose", "participants": 50,
            "activity_type": "Seminar", "facility_id": fac_id, "date": date,
            "start_time": "13:00", "end_time": "15:00", "package": "Custom",
        }
        r = requests.post(f"{API}/requests", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["request_id"].startswith("REQ-")
        assert d["slot_available"] is True
        req_id = d["request_id"]

        # track
        r2 = requests.get(f"{API}/requests/{req_id}")
        assert r2.status_code == 200 and r2.json()["request_id"] == req_id

    def test_full_workflow_and_slot_lock(self, bpu_token, fac_id):
        date = (datetime.now() + timedelta(days=25)).strftime("%Y-%m-%d")
        # create request A
        payload = {
            "name": "TEST_A", "email": "a@example.com", "whatsapp": "628",
            "purpose": "A", "facility_id": fac_id, "date": date,
            "start_time": "10:00", "end_time": "12:00",
        }
        r = requests.post(f"{API}/requests", json=payload)
        assert r.status_code == 200
        a = r.json()
        assert a["slot_available"] is True
        a_internal_id = a["id"]

        # transition request -> review -> approved -> confirmed
        for st in ["review", "approved", "confirmed"]:
            rr = requests.patch(f"{API}/requests/{a_internal_id}/status",
                                json={"status": st, "note": st}, headers=H(bpu_token))
            assert rr.status_code == 200, f"{st}: {rr.text}"
            assert rr.json()["status"] == st

        # now new overlapping request should show slot_available=False
        payload2 = {**payload, "name": "TEST_B", "start_time": "11:00", "end_time": "13:00"}
        r2 = requests.post(f"{API}/requests", json=payload2)
        assert r2.status_code == 200
        b = r2.json()
        assert b["slot_available"] is False

        # confirming B should conflict (409)
        rr = requests.patch(f"{API}/requests/{b['id']}/status",
                            json={"status": "review"}, headers=H(bpu_token))
        assert rr.status_code == 200
        rr2 = requests.patch(f"{API}/requests/{b['id']}/status",
                             json={"status": "confirmed"}, headers=H(bpu_token))
        assert rr2.status_code == 409

    def test_admin_list_requests(self, bpu_token):
        r = requests.get(f"{API}/requests", headers=H(bpu_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ----------------------- Anti double-booking with internal block -----------------------
class TestAntiDoubleBook:
    def test_internal_block_then_external_request(self, internal_token, bpu_token):
        # get a facility
        fid = requests.get(f"{API}/facilities/gedung-serba-guna-gsg-unib").json()["id"]
        date = (datetime.now() + timedelta(days=40)).strftime("%Y-%m-%d")
        # internal block 14:00-16:00
        block = {"facility_id": fid, "date": date, "start_time": "14:00", "end_time": "16:00",
                 "source": "internal", "purpose": "Rapat"}
        r = requests.post(f"{API}/availability", json=block, headers=H(internal_token))
        assert r.status_code == 200
        block_id = r.json()["id"]

        # external request overlapping
        payload = {"name": "TEST_C", "email": "c@example.com", "whatsapp": "628",
                   "purpose": "P", "facility_id": fid, "date": date,
                   "start_time": "15:00", "end_time": "17:00"}
        r2 = requests.post(f"{API}/requests", json=payload)
        assert r2.status_code == 200
        assert r2.json()["slot_available"] is False

        # confirm should 409
        req_int_id = r2.json()["id"]
        requests.patch(f"{API}/requests/{req_int_id}/status",
                       json={"status": "review"}, headers=H(bpu_token))
        rr = requests.patch(f"{API}/requests/{req_int_id}/status",
                            json={"status": "confirmed"}, headers=H(bpu_token))
        assert rr.status_code == 409

        # cleanup
        requests.delete(f"{API}/availability/{block_id}", headers=H(internal_token))


# ----------------------- Dashboard -----------------------
class TestDashboard:
    def test_admin_stats(self, bpu_token):
        r = requests.get(f"{API}/admin/stats", headers=H(bpu_token))
        assert r.status_code == 200
        d = r.json()
        for k in ["total_facilities", "new_requests", "utilization", "recent_requests", "weekly_usage"]:
            assert k in d
        assert len(d["weekly_usage"]) == 7


# ----------------------- Content CRUD -----------------------
class TestContentCRUD:
    def test_content_crud(self, bpu_token):
        payload = {"title": f"TEST_content_{datetime.now().timestamp()}", "category": "news",
                   "excerpt": "e", "body": "b", "published": True}
        r = requests.post(f"{API}/content", json=payload, headers=H(bpu_token))
        assert r.status_code == 200
        cid = r.json()["id"]
        # update
        upd = {**payload, "excerpt": "e2"}
        r2 = requests.put(f"{API}/content/{cid}", json=upd, headers=H(bpu_token))
        assert r2.status_code == 200 and r2.json()["excerpt"] == "e2"
        # delete
        r3 = requests.delete(f"{API}/content/{cid}", headers=H(bpu_token))
        assert r3.status_code == 200

from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Query, UploadFile, File
from fastapi.responses import StreamingResponse, JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from pymongo import ReturnDocument
from bson import ObjectId
from bson.errors import InvalidId
from gridfs.errors import NoFile
import logging
import re
from urllib.parse import quote
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta

from seed_data import DEFAULT_SETTINGS

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
WIB = timezone(timedelta(hours=7))

app = FastAPI(title="BPU UNIB API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bpu-unib")


# ----------------------- Helpers -----------------------
def now_iso():
    return datetime.now(timezone.utc).isoformat()


MONTHS_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus",
             "September", "Oktober", "November", "Desember"]


def rupiah(n) -> str:
    return "Rp" + f"{int(n):,}".replace(",", ".")


def date_id(d: str) -> str:
    """'2026-10-10' -> '10 Oktober 2026'"""
    try:
        dt = datetime.strptime(d, "%Y-%m-%d")
        return f"{dt.day} {MONTHS_ID[dt.month - 1]} {dt.year}"
    except ValueError:
        return d


def time_id(t: str) -> str:
    return t.replace(":", ".")


def normalize_wa(number: str) -> str:
    digits = re.sub(r"[^0-9]", "", number or "")
    if digits.startswith("0"):
        digits = "62" + digits[1:]
    return digits


def price_text(rule: Optional[dict]) -> str:
    """Tampilan harga publik sesuai prinsip: tunggal / rentang / mulai dari / perlu konfirmasi BPU."""
    rule = rule or {}
    opts = [o for o in rule.get("options", []) if o.get("price")]
    if rule.get("mode") == "confirm" or not opts:
        return "Perlu konfirmasi BPU"
    unit_of = lambda o: o.get("unit") or rule.get("unit", "")
    suffix = lambda u: f" / {u}" if u else ""
    opts = sorted(opts, key=lambda o: o["price"])
    lo, hi = opts[0], opts[-1]
    if rule.get("mode") == "starting" or len({unit_of(o) for o in opts}) > 1:
        return f"Mulai dari {rupiah(lo['price'])}{suffix(unit_of(lo))}"
    if lo["price"] == hi["price"]:
        return f"{rupiah(lo['price'])}{suffix(unit_of(lo))}"
    return f"{rupiah(lo['price'])} s.d. {rupiah(hi['price'])}{suffix(unit_of(lo))}"


def summarize_pricing(spaces: list) -> dict:
    """Ringkasan tarif gedung dari seluruh ruang/unit aktif."""
    opts = []
    for s in spaces:
        rule = s.get("pricing_rule") or {}
        if rule.get("mode") == "confirm":
            continue
        for o in rule.get("options", []):
            if o.get("price"):
                opts.append({"price": o["price"], "unit": o.get("unit") or rule.get("unit", "")})
    if not opts:
        return {"mode": "confirm", "min": None, "max": None, "unit": "", "text": "Perlu konfirmasi BPU"}
    if len(spaces) == 1:
        text = price_text(spaces[0].get("pricing_rule"))
    else:
        text = price_text({"mode": "auto", "options": opts})
    lo = min(opts, key=lambda o: o["price"])
    hi = max(opts, key=lambda o: o["price"])
    mode = "starting" if text.startswith("Mulai") else ("single" if lo["price"] == hi["price"] else "range")
    return {"mode": mode, "min": lo["price"], "max": hi["price"], "unit": lo["unit"], "text": text}


def with_price(space: dict) -> dict:
    space["price_text"] = price_text(space.get("pricing_rule"))
    return space


async def get_settings() -> dict:
    doc = await db.settings.find_one({"key": "site"}, {"_id": 0}) or {}
    merged = {**DEFAULT_SETTINGS, **{k: v for k, v in doc.items() if k != "key"}}
    if os.environ.get("WHATSAPP_BPU") and not doc.get("whatsapp_bpu"):
        merged["whatsapp_bpu"] = normalize_wa(os.environ["WHATSAPP_BPU"])
    return merged


def wa_link(number: str, message: str) -> str:
    return f"https://wa.me/{normalize_wa(number)}?text={quote(message)}"


TIME_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def validate_slot(date: str, start_time: str, end_time: str, allow_past: bool = False):
    if not DATE_RE.match(date or ""):
        raise HTTPException(status_code=422, detail="Format tanggal tidak valid (YYYY-MM-DD)")
    try:
        datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=422, detail="Tanggal tidak valid")
    if not TIME_RE.match(start_time or "") or not TIME_RE.match(end_time or ""):
        raise HTTPException(status_code=422, detail="Format waktu tidak valid (HH:MM)")
    if start_time >= end_time:
        raise HTTPException(status_code=422, detail="Waktu selesai harus setelah waktu mulai")
    if not allow_past and date < datetime.now(WIB).strftime("%Y-%m-%d"):
        raise HTTPException(status_code=422, detail="Tanggal sudah lewat")


def new_id():
    return str(uuid.uuid4())


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_token(user: dict) -> str:
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def require_roles(*roles):
    async def checker(user: dict = Depends(get_current_user)):
        if roles and user["role"] not in roles and user["role"] != "super_admin":
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return checker


# ----------------------- Models -----------------------
class LoginInput(BaseModel):
    email: EmailStr
    password: str


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "admin_bpu"  # super_admin | admin_bpu | admin_internal


class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None
    status: Optional[str] = None


class FacilityInput(BaseModel):
    """BUILDING / FACILITY (parent)."""
    name: str
    code: str = ""
    category: str
    description: str = ""
    location: str = ""
    address: str = ""
    latitude: float = -3.7586
    longitude: float = 102.2716
    capacity: int = 0
    capacity_label: str = ""
    area: str = ""
    operating_hours: str = "08.00 s.d. 21.00"
    rules: List[str] = []
    features: List[str] = []
    not_included: List[str] = []
    services: List[str] = []
    images: List[str] = []
    videos: List[str] = []
    suitable_for: List[str] = []
    pic_name: str = ""
    pic_contact: str = ""
    status: str = "active"
    featured: bool = False


class PriceOption(BaseModel):
    label: str
    price: int = 0
    price_incl_tax: Optional[int] = None
    unit: str = ""


class PricingRule(BaseModel):
    mode: str = "auto"  # auto (tunggal/rentang) | starting (mulai dari) | confirm (perlu konfirmasi BPU)
    unit: str = ""
    note: str = ""
    options: List[PriceOption] = []


class SpaceInput(BaseModel):
    """SPACE / UNIT (child) — unit yang dipilih & dicek ketersediaannya."""
    building_id: str
    code: str
    name: str
    description: str = ""
    capacity: int = 0
    capacity_label: str = ""
    amenities: List[str] = []
    images: List[str] = []
    pricing_rule: PricingRule = PricingRule()
    is_full_building: bool = False
    group: str = ""  # kategori unit, mis. "Sewa Full Gedung", "Ruang Terpisah", "Ruang Rapat"
    sort_order: int = 0
    status: str = "active"


class AmenityInput(BaseModel):
    """Fasilitas tambahan (entitas tersendiri, bukan ruang)."""
    name: str
    description: str = ""
    unit: str = ""
    price: Optional[int] = None
    price_information: str = ""
    building_ids: List[str] = []  # kosong = berlaku untuk semua gedung
    max_qty: int = 1
    status: str = "active"


class AvailabilityInput(BaseModel):
    facility_id: str
    space_id: Optional[str] = None  # kosong = seluruh gedung
    date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    end_time: str  # HH:MM
    source: str  # internal | maintenance | external
    purpose: str = ""
    unit: str = ""
    notes: str = ""


class AvailabilityCheck(BaseModel):
    facility_id: str
    space_id: str
    date: str
    start_time: str
    end_time: str


class InquiryAmenity(BaseModel):
    amenity_id: str
    qty: int = 1


class InquiryInput(BaseModel):
    facility_id: str
    space_id: str
    date: str
    start_time: str
    end_time: str
    price_option: str = ""  # kategori tarif yang dipilih penyewa (label)
    amenities: List[InquiryAmenity] = []
    name: str
    whatsapp: str
    email: Optional[EmailStr] = None
    organization: str = ""
    activity_type: str = ""
    purpose: str = ""
    participants: int = 0
    notes: str = ""


class InquiryStatusUpdate(BaseModel):
    status: str
    note: str = ""
    final_price: Optional[int] = None


class SettingsInput(BaseModel):
    whatsapp_bpu: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    hero_slides: Optional[List[dict]] = None


class RequestInput(BaseModel):
    name: str
    email: EmailStr
    whatsapp: str
    organization: str = ""
    purpose: str
    participants: int = 0
    activity_type: str = ""
    facility_id: str
    date: str
    start_time: str
    end_time: str
    package: str = "Custom"
    services: List[str] = []
    description: str = ""


class RequestStatusUpdate(BaseModel):
    status: str  # review | revision | rejected | approved | confirmed | completed | cancelled
    note: str = ""


class ContentInput(BaseModel):
    title: str
    category: str  # news | event | spotlight | activity
    excerpt: str = ""
    body: str = ""
    image: str = ""
    date: str = ""
    related_facility_id: Optional[str] = None
    published: bool = True


def slugify(text: str) -> str:
    s = "".join(c.lower() if c.isalnum() else "-" for c in text)
    while "--" in s:
        s = s.replace("--", "-")
    return s.strip("-")


# ----------------------- Auth Routes -----------------------
@api_router.post("/auth/login")
async def login(body: LoginInput):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Email atau password salah")
    if user.get("status") == "inactive":
        raise HTTPException(status_code=403, detail="Akun dinonaktifkan")
    clean = {k: v for k, v in user.items() if k not in ("_id", "password_hash")}
    token = create_token(clean)
    return {"token": token, "user": clean}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# ----------------------- User Management -----------------------
@api_router.get("/users")
async def list_users(user: dict = Depends(require_roles("super_admin"))):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(500)
    return users


@api_router.post("/users")
async def create_user(body: UserCreate, user: dict = Depends(require_roles("super_admin"))):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    doc = {
        "id": new_id(), "name": body.name, "email": email,
        "password_hash": hash_password(body.password), "role": body.role,
        "status": "active", "created_at": now_iso(),
    }
    await db.users.insert_one(doc)
    return {k: v for k, v in doc.items() if k not in ("_id", "password_hash")}


@api_router.put("/users/{user_id}")
async def update_user(user_id: str, body: UserUpdate, user: dict = Depends(require_roles("super_admin"))):
    updates = {}
    if body.name is not None:
        updates["name"] = body.name
    if body.role is not None:
        updates["role"] = body.role
    if body.status is not None:
        updates["status"] = body.status
    if body.password:
        updates["password_hash"] = hash_password(body.password)
    if updates:
        await db.users.update_one({"id": user_id}, {"$set": updates})
    doc = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return doc


@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, user: dict = Depends(require_roles("super_admin"))):
    await db.users.delete_one({"id": user_id})
    return {"ok": True}


# ----------------------- Facilities -----------------------
@api_router.get("/categories")
async def categories():
    return [
        {"key": "Gedung", "label": "Gedung"},
        {"key": "Ruang", "label": "Ruang"},
        {"key": "Aula", "label": "Aula"},
        {"key": "Lapangan", "label": "Lapangan"},
        {"key": "Laboratorium", "label": "Laboratorium"},
        {"key": "Hunian", "label": "Hunian"},
        {"key": "Lainnya", "label": "Lainnya"},
    ]


@api_router.get("/facilities")
async def list_facilities(
    q: Optional[str] = None,
    category: Optional[str] = None,
    min_capacity: Optional[int] = None,
    featured: Optional[bool] = None,
    include_inactive: bool = False,
    sort: str = "popular",
):
    query = {}
    if not include_inactive:
        query["status"] = "active"
    if category and category != "Semua":
        query["category"] = category
    if featured is not None:
        query["featured"] = featured
    if min_capacity:
        query["capacity"] = {"$gte": min_capacity}
    if q:
        rq = re.escape(q)
        query["$or"] = [
            {"name": {"$regex": rq, "$options": "i"}},
            {"code": {"$regex": rq, "$options": "i"}},
            {"description": {"$regex": rq, "$options": "i"}},
            {"location": {"$regex": rq, "$options": "i"}},
            {"category": {"$regex": rq, "$options": "i"}},
        ]
    facilities = await db.facilities.find(query, {"_id": 0}).to_list(500)
    spaces = await db.spaces.find(
        {"building_id": {"$in": [f["id"] for f in facilities]}, "status": "active"}, {"_id": 0}
    ).to_list(2000)
    by_building = {}
    for s in spaces:
        by_building.setdefault(s["building_id"], []).append(s)
    for f in facilities:
        f["space_count"] = len(by_building.get(f["id"], []))
        f["price_summary"] = summarize_pricing(by_building.get(f["id"], []))
    if sort == "capacity":
        facilities.sort(key=lambda f: f.get("capacity", 0), reverse=True)
    elif sort == "newest":
        facilities.sort(key=lambda f: f.get("created_at", ""), reverse=True)
    else:
        facilities.sort(key=lambda f: (not f.get("featured", False), f.get("name", "")))
    return facilities


async def find_facility(slug_or_id: str) -> Optional[dict]:
    fac = await db.facilities.find_one({"slug": slug_or_id}, {"_id": 0})
    if not fac:
        fac = await db.facilities.find_one({"id": slug_or_id}, {"_id": 0})
    if not fac:
        fac = await db.facilities.find_one({"slug_aliases": slug_or_id}, {"_id": 0})
    return fac


@api_router.get("/facilities/{slug}")
async def get_facility(slug: str):
    fac = await find_facility(slug)
    if not fac:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan")
    spaces = await db.spaces.find({"building_id": fac["id"], "status": "active"}, {"_id": 0}).to_list(500)
    spaces.sort(key=lambda s: (not s.get("is_full_building", False), s.get("sort_order", 0), s.get("code", "")))
    fac["spaces"] = [with_price(s) for s in spaces]
    fac["space_count"] = len(spaces)
    fac["price_summary"] = summarize_pricing(spaces)
    return fac


@api_router.post("/facilities")
async def create_facility(body: FacilityInput, user: dict = Depends(require_roles("admin_bpu"))):
    doc = body.model_dump()
    doc["id"] = new_id()
    base_slug = slugify(body.name)
    slug = base_slug
    i = 1
    while await db.facilities.find_one({"slug": slug}):
        i += 1
        slug = f"{base_slug}-{i}"
    doc["slug"] = slug
    doc["slug_aliases"] = []
    doc["created_at"] = now_iso()
    await db.facilities.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


@api_router.put("/facilities/{fid}")
async def update_facility(fid: str, body: FacilityInput, user: dict = Depends(require_roles("admin_bpu"))):
    doc = body.model_dump()
    await db.facilities.update_one({"id": fid}, {"$set": doc})
    updated = await db.facilities.find_one({"id": fid}, {"_id": 0})
    if not updated:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan")
    return updated


@api_router.delete("/facilities/{fid}")
async def delete_facility(fid: str, user: dict = Depends(require_roles("admin_bpu"))):
    await db.facilities.delete_one({"id": fid})
    await db.spaces.delete_many({"building_id": fid})
    return {"ok": True}


# ----------------------- Spaces / Units -----------------------
@api_router.get("/facilities/{fid}/spaces")
async def facility_spaces(fid: str):
    spaces = await db.spaces.find({"building_id": fid, "status": "active"}, {"_id": 0}).to_list(500)
    spaces.sort(key=lambda s: (not s.get("is_full_building", False), s.get("sort_order", 0), s.get("code", "")))
    return [with_price(s) for s in spaces]


@api_router.get("/spaces")
async def list_spaces(building_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {"building_id": building_id} if building_id else {}
    spaces = await db.spaces.find(query, {"_id": 0}).to_list(2000)
    spaces.sort(key=lambda s: (s.get("building_id", ""), not s.get("is_full_building", False), s.get("sort_order", 0), s.get("code", "")))
    return [with_price(s) for s in spaces]


async def _check_space_code(body: SpaceInput, exclude_id: Optional[str] = None):
    if not await db.facilities.find_one({"id": body.building_id}):
        raise HTTPException(status_code=404, detail="Gedung tidak ditemukan")
    dup = await db.spaces.find_one({"building_id": body.building_id, "code": body.code})
    if dup and dup["id"] != exclude_id:
        raise HTTPException(status_code=400, detail=f"Kode ruang {body.code} sudah dipakai di gedung ini")


@api_router.post("/spaces")
async def create_space(body: SpaceInput, user: dict = Depends(require_roles("admin_bpu"))):
    await _check_space_code(body)
    doc = body.model_dump()
    doc["id"] = new_id()
    doc["created_at"] = now_iso()
    await db.spaces.insert_one(doc)
    return with_price({k: v for k, v in doc.items() if k != "_id"})


@api_router.put("/spaces/{sid}")
async def update_space(sid: str, body: SpaceInput, user: dict = Depends(require_roles("admin_bpu"))):
    await _check_space_code(body, exclude_id=sid)
    await db.spaces.update_one({"id": sid}, {"$set": {**body.model_dump(), "updated_at": now_iso()}})
    updated = await db.spaces.find_one({"id": sid}, {"_id": 0})
    if not updated:
        raise HTTPException(status_code=404, detail="Ruang tidak ditemukan")
    return with_price(updated)


@api_router.delete("/spaces/{sid}")
async def delete_space(sid: str, user: dict = Depends(require_roles("admin_bpu"))):
    await db.spaces.delete_one({"id": sid})
    return {"ok": True}


# ----------------------- Amenities (Fasilitas Tambahan) -----------------------
@api_router.get("/amenities")
async def list_amenities(building_id: Optional[str] = None, include_inactive: bool = False):
    query = {} if include_inactive else {"status": "active"}
    items = await db.amenities.find(query, {"_id": 0}).to_list(500)
    if building_id:
        items = [a for a in items if not a.get("building_ids") or building_id in a["building_ids"]]
    items.sort(key=lambda a: a.get("name", ""))
    return items


@api_router.post("/amenities")
async def create_amenity(body: AmenityInput, user: dict = Depends(require_roles("admin_bpu"))):
    doc = body.model_dump()
    doc["id"] = new_id()
    doc["created_at"] = now_iso()
    await db.amenities.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


@api_router.put("/amenities/{aid}")
async def update_amenity(aid: str, body: AmenityInput, user: dict = Depends(require_roles("admin_bpu"))):
    await db.amenities.update_one({"id": aid}, {"$set": body.model_dump()})
    updated = await db.amenities.find_one({"id": aid}, {"_id": 0})
    if not updated:
        raise HTTPException(status_code=404, detail="Fasilitas tambahan tidak ditemukan")
    return updated


@api_router.delete("/amenities/{aid}")
async def delete_amenity(aid: str, user: dict = Depends(require_roles("admin_bpu"))):
    await db.amenities.delete_one({"id": aid})
    return {"ok": True}


# ----------------------- Availability -----------------------
def overlaps(s1, e1, s2, e2):
    return s1 < e2 and e1 > s2


async def relevant_events(facility_id, space_id=None, query_extra=None):
    """Event yang memengaruhi ketersediaan sebuah ruang.
    - Event tanpa space_id / pada ruang Full Building memblokir seluruh gedung.
    - Memilih Full Building (atau space_id kosong) memeriksa seluruh child space.
    - Memilih satu ruang hanya memeriksa ruang itu (plus blok seluruh gedung)."""
    query = {"facility_id": facility_id, "status": "active", **(query_extra or {})}
    events = await db.availability.find(query, {"_id": 0}).to_list(2000)
    full_ids = {s["id"] async for s in db.spaces.find(
        {"building_id": facility_id, "is_full_building": True}, {"_id": 0, "id": 1})}
    target_full = not space_id or space_id in full_ids
    out = []
    for ev in events:
        ev_space = ev.get("space_id")
        ev_full = not ev_space or ev_space in full_ids
        if target_full or ev_full or ev_space == space_id:
            out.append(ev)
    return out


async def find_conflicts(facility_id, date, start_time, end_time, exclude_id=None, space_id=None):
    events = await relevant_events(facility_id, space_id, {"date": date})
    return [ev for ev in events
            if not (exclude_id and ev["id"] == exclude_id)
            and overlaps(start_time, end_time, ev["start_time"], ev["end_time"])]


def public_event(ev: dict) -> dict:
    return {
        "id": ev["id"], "date": ev["date"], "start_time": ev["start_time"], "end_time": ev["end_time"],
        "source": ev["source"], "space_id": ev.get("space_id"), "purpose": "", "unit": "",
        "public_status": "maintenance" if ev["source"] == "maintenance" else "unavailable",
    }


@api_router.get("/facilities/{fid}/availability")
async def facility_availability(fid: str, month: Optional[str] = None, space_id: Optional[str] = None,
                                public: bool = True):
    extra = {"date": {"$regex": f"^{re.escape(month)}"}} if month else {}
    if space_id:
        events = await relevant_events(fid, space_id, extra)
    else:
        events = await db.availability.find({"facility_id": fid, "status": "active", **extra}, {"_id": 0}).to_list(2000)
    # Endpoint publik: identitas & tujuan penggunaan tidak pernah diekspos.
    return [public_event(ev) for ev in events]


@api_router.post("/availability/check")
async def check_availability(body: AvailabilityCheck):
    validate_slot(body.date, body.start_time, body.end_time)
    space = await db.spaces.find_one({"id": body.space_id, "building_id": body.facility_id, "status": "active"})
    if not space:
        raise HTTPException(status_code=404, detail="Ruang/unit tidak ditemukan")
    day = await relevant_events(body.facility_id, body.space_id, {"date": body.date})
    conflicts = [ev for ev in day if overlaps(body.start_time, body.end_time, ev["start_time"], ev["end_time"])]
    return {
        "available": not conflicts,
        "conflicts": [public_event(c) for c in conflicts],
        "day_events": sorted([public_event(e) for e in day], key=lambda e: e["start_time"]),
    }


@api_router.get("/availability")
async def all_availability(month: Optional[str] = None, facility_id: Optional[str] = None,
                           space_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    extra = {"date": {"$regex": f"^{re.escape(month)}"}} if month else {}
    if facility_id and space_id:
        return await relevant_events(facility_id, space_id, extra)
    query = {"status": "active", **extra}
    if facility_id:
        query["facility_id"] = facility_id
    events = await db.availability.find(query, {"_id": 0}).to_list(2000)
    return events


@api_router.post("/availability")
async def create_availability(body: AvailabilityInput,
                              user: dict = Depends(require_roles("admin_internal", "admin_bpu"))):
    validate_slot(body.date, body.start_time, body.end_time, allow_past=True)
    body.space_id = body.space_id or None
    conflicts = await find_conflicts(body.facility_id, body.date, body.start_time, body.end_time,
                                     space_id=body.space_id)
    if conflicts:
        raise HTTPException(status_code=409, detail={
            "message": "Jadwal bentrok dengan penggunaan lain",
            "conflicts": conflicts,
        })
    doc = body.model_dump()
    doc["id"] = new_id()
    doc["status"] = "active"
    doc["created_by"] = user["name"]
    doc["created_at"] = now_iso()
    await db.availability.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


@api_router.delete("/availability/{aid}")
async def delete_availability(aid: str, user: dict = Depends(require_roles("admin_internal", "admin_bpu"))):
    await db.availability.update_one({"id": aid}, {"$set": {"status": "cancelled"}})
    return {"ok": True}


# ----------------------- External Requests -----------------------
@api_router.post("/requests")
async def create_request(body: RequestInput):
    fac = await db.facilities.find_one({"id": body.facility_id}, {"_id": 0})
    if not fac:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan")
    conflicts = await find_conflicts(body.facility_id, body.date, body.start_time, body.end_time)
    slot_available = len(conflicts) == 0
    seq = await db.requests.count_documents({}) + 1
    request_id = f"REQ-{datetime.now().year}-{seq:04d}"
    doc = body.model_dump()
    doc["id"] = new_id()
    doc["request_id"] = request_id
    doc["facility_name"] = fac["name"]
    doc["status"] = "request"
    doc["slot_available"] = slot_available
    doc["history"] = [{"status": "request", "note": "Permintaan dibuat", "at": now_iso()}]
    doc["created_at"] = now_iso()
    await db.requests.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


@api_router.get("/requests/{request_id}")
async def get_request(request_id: str):
    r = await db.requests.find_one({"request_id": request_id}, {"_id": 0})
    if not r:
        raise HTTPException(status_code=404, detail="Permintaan tidak ditemukan")
    return r


@api_router.get("/requests")
async def list_requests(status: Optional[str] = None,
                        user: dict = Depends(require_roles("admin_bpu"))):
    query = {}
    if status and status != "all":
        query["status"] = status
    reqs = await db.requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return reqs


@api_router.patch("/requests/{rid}/status")
async def update_request_status(rid: str, body: RequestStatusUpdate,
                                user: dict = Depends(require_roles("admin_bpu"))):
    r = await db.requests.find_one({"id": rid})
    if not r:
        r = await db.requests.find_one({"request_id": rid})
    if not r:
        raise HTTPException(status_code=404, detail="Permintaan tidak ditemukan")

    # On confirm, lock the slot in availability calendar
    if body.status == "confirmed":
        conflicts = await find_conflicts(r["facility_id"], r["date"], r["start_time"], r["end_time"])
        if conflicts:
            raise HTTPException(status_code=409, detail={
                "message": "Tidak dapat konfirmasi: slot sudah terisi",
                "conflicts": conflicts,
            })
        await db.availability.insert_one({
            "id": new_id(), "facility_id": r["facility_id"], "date": r["date"],
            "start_time": r["start_time"], "end_time": r["end_time"], "source": "external",
            "purpose": r.get("purpose", ""), "unit": r.get("organization", ""),
            "status": "active", "created_by": user["name"], "created_at": now_iso(),
            "request_id": r["request_id"],
        })

    history = r.get("history", [])
    history.append({"status": body.status, "note": body.note, "at": now_iso(), "by": user["name"]})
    await db.requests.update_one({"id": r["id"]}, {"$set": {"status": body.status, "history": history}})
    updated = await db.requests.find_one({"id": r["id"]}, {"_id": 0})
    return updated


# ----------------------- Inquiry (Permintaan Penyewaan) -----------------------
INQUIRY_STATUSES = [
    {"key": "INQUIRY_CREATED", "label": "Inquiry Dibuat",
     "next": ["INQUIRY_SENT", "PENDING_BPU_CONFIRMATION", "APPROVED", "REJECTED", "CANCELLED"]},
    {"key": "INQUIRY_SENT", "label": "Inquiry Terkirim",
     "next": ["PENDING_BPU_CONFIRMATION", "APPROVED", "REJECTED", "CANCELLED"]},
    {"key": "PENDING_BPU_CONFIRMATION", "label": "Menunggu Konfirmasi BPU",
     "next": ["APPROVED", "REJECTED", "CANCELLED"]},
    {"key": "APPROVED", "label": "Disetujui", "next": ["FINAL_TARIFF_CONFIRMED", "CANCELLED"]},
    {"key": "REJECTED", "label": "Ditolak", "next": []},
    {"key": "FINAL_TARIFF_CONFIRMED", "label": "Tarif Final Dikonfirmasi",
     "next": ["REQUIREMENTS_PENDING", "PAYMENT_PENDING", "CANCELLED"]},
    {"key": "REQUIREMENTS_PENDING", "label": "Menunggu Persyaratan", "next": ["PAYMENT_PENDING", "CANCELLED"]},
    {"key": "PAYMENT_PENDING", "label": "Menunggu Pembayaran", "next": ["PAYMENT_VERIFICATION", "CANCELLED"]},
    {"key": "PAYMENT_VERIFICATION", "label": "Verifikasi Pembayaran",
     "next": ["BOOKING_CONFIRMED", "PAYMENT_PENDING", "CANCELLED"]},
    {"key": "BOOKING_CONFIRMED", "label": "Booking Terkonfirmasi", "next": ["CANCELLED"]},
    {"key": "CANCELLED", "label": "Dibatalkan", "next": []},
]
STATUS_MAP = {s["key"]: s for s in INQUIRY_STATUSES}
# Slot dikunci di kalender sejak BPU menyetujui, dan dilepas kembali saat ditolak/dibatalkan.
LOCK_STATUSES = {"APPROVED", "FINAL_TARIFF_CONFIRMED", "REQUIREMENTS_PENDING", "PAYMENT_PENDING",
                 "PAYMENT_VERIFICATION", "BOOKING_CONFIRMED"}
RELEASE_STATUSES = {"REJECTED", "CANCELLED"}


async def next_seq(name: str) -> int:
    doc = await db.counters.find_one_and_update(
        {"_id": name}, {"$inc": {"seq": 1}}, upsert=True, return_document=ReturnDocument.AFTER)
    return doc["seq"]


def build_wa_message(inq: dict) -> str:
    lines = [
        "Halo Admin BPU UNIB,",
        "Saya ingin mengajukan permintaan penyewaan fasilitas.",
        "",
        f"Inquiry ID: {inq['inquiry_code']}",
        f"Fasilitas: {inq['building_name']}",
        f"Ruang: {inq['space_name']} ({inq['space_code']})",
        f"Tanggal: {date_id(inq['date'])}",
        f"Waktu: {time_id(inq['start_time'])} s.d. {time_id(inq['end_time'])}",
    ]
    if inq.get("price_option"):
        lines.append(f"Kategori Tarif: {inq['price_option']}")
    lines.append(f"Tarif: {inq['displayed_price']}")
    if inq.get("selected_amenities"):
        lines.append("Fasilitas Tambahan: " + ", ".join(
            f"{a['name']} x{a['qty']}" for a in inq["selected_amenities"]))
    lines += ["", f"Nama: {inq['name']}"]
    if inq.get("email"):
        lines.append(f"Email: {inq['email']}")
    if inq.get("organization"):
        lines.append(f"Instansi/Organisasi: {inq['organization']}")
    if inq.get("activity_type") or inq.get("purpose"):
        lines.append(f"Kegiatan: {', '.join(x for x in [inq.get('activity_type'), inq.get('purpose')] if x)}")
    if inq.get("participants"):
        lines.append(f"Perkiraan Peserta: {inq['participants']} orang")
    lines += [
        "",
        "Mohon konfirmasi ketersediaan, tarif yang berlaku,",
        "serta persyaratan penyewaan dan pembayaran.",
        "Terima kasih.",
    ]
    return "\n".join(lines)


def public_inquiry(inq: dict) -> dict:
    """Data yang aman ditampilkan pada halaman lacak publik (tanpa kontak pemohon)."""
    keys = ["inquiry_code", "building_name", "space_code", "space_name", "date", "start_time", "end_time",
            "displayed_price", "price_option", "selected_amenities", "status", "status_label", "created_at"]
    out = {k: inq.get(k) for k in keys}
    out["history"] = [{k: h.get(k) for k in ("status", "label", "note", "at")} for h in inq.get("history", [])]
    return out


@api_router.get("/inquiry-statuses")
async def inquiry_statuses():
    return INQUIRY_STATUSES


@api_router.post("/inquiries")
async def create_inquiry(body: InquiryInput):
    validate_slot(body.date, body.start_time, body.end_time)
    if not body.name.strip() or not normalize_wa(body.whatsapp):
        raise HTTPException(status_code=422, detail="Nama dan nomor WhatsApp wajib diisi")
    fac = await db.facilities.find_one({"id": body.facility_id, "status": "active"}, {"_id": 0})
    if not fac:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan")
    space = await db.spaces.find_one({"id": body.space_id, "building_id": fac["id"], "status": "active"}, {"_id": 0})
    if not space:
        raise HTTPException(status_code=404, detail="Ruang/unit tidak ditemukan")

    # Validasi ulang di backend — UI bukan satu-satunya lapisan pencegah bentrok.
    conflicts = await find_conflicts(fac["id"], body.date, body.start_time, body.end_time, space_id=space["id"])
    if conflicts:
        raise HTTPException(status_code=409, detail={
            "message": "Ruang sudah terpakai pada waktu yang dipilih. Silakan pilih waktu lain.",
            "conflicts": [public_event(c) for c in conflicts],
        })

    rule = space.get("pricing_rule") or {}
    option_labels = [o.get("label") for o in rule.get("options", [])]
    price_option = body.price_option if body.price_option in option_labels else ""

    amenity_docs = {a["id"]: a async for a in db.amenities.find({"status": "active"}, {"_id": 0})}
    selected = []
    for item in body.amenities:
        a = amenity_docs.get(item.amenity_id)
        if not a or item.qty < 1:
            continue
        if a.get("building_ids") and fac["id"] not in a["building_ids"]:
            continue
        qty = min(item.qty, max(a.get("max_qty") or 1, 1))
        selected.append({"amenity_id": a["id"], "name": a["name"], "qty": qty, "unit": a.get("unit", ""),
                         "price": a.get("price"), "price_information": a.get("price_information", "")})

    year = datetime.now(WIB).year
    code = f"INQ-{year}-{await next_seq(f'inquiry-{year}'):04d}"
    created = now_iso()
    doc = {
        "id": new_id(), "inquiry_code": code,
        "building_id": fac["id"], "building_code": fac.get("code", ""), "building_name": fac["name"],
        "space_id": space["id"], "space_code": space["code"], "space_name": space["name"],
        "date": body.date, "start_time": body.start_time, "end_time": body.end_time,
        "displayed_price": price_text(rule), "price_option": price_option,
        "selected_amenities": selected,
        "name": body.name.strip(), "whatsapp": body.whatsapp, "email": body.email or "",
        "organization": body.organization, "activity_type": body.activity_type, "purpose": body.purpose,
        "participants": body.participants, "notes": body.notes,
        "status": "INQUIRY_CREATED", "status_label": STATUS_MAP["INQUIRY_CREATED"]["label"],
        "final_price": None, "availability_id": None,
        "history": [{"status": "INQUIRY_CREATED", "label": STATUS_MAP["INQUIRY_CREATED"]["label"],
                     "note": "Inquiry dibuat oleh pemohon", "at": created}],
        "created_at": created,
    }
    await db.inquiries.insert_one(doc)
    settings = await get_settings()
    message = build_wa_message(doc)
    out = {k: v for k, v in doc.items() if k != "_id"}
    out["whatsapp_message"] = message
    out["whatsapp_url"] = wa_link(settings["whatsapp_bpu"], message)
    return out


@api_router.post("/inquiries/{code}/sent")
async def mark_inquiry_sent(code: str):
    """Dipanggil saat pemohon diarahkan ke WhatsApp BPU (INQUIRY_CREATED -> INQUIRY_SENT)."""
    inq = await db.inquiries.find_one({"inquiry_code": code})
    if not inq:
        raise HTTPException(status_code=404, detail="Inquiry tidak ditemukan")
    if inq["status"] == "INQUIRY_CREATED":
        label = STATUS_MAP["INQUIRY_SENT"]["label"]
        await db.inquiries.update_one({"id": inq["id"]}, {
            "$set": {"status": "INQUIRY_SENT", "status_label": label},
            "$push": {"history": {"status": "INQUIRY_SENT", "label": label,
                                  "note": "Pemohon diarahkan ke WhatsApp BPU", "at": now_iso()}},
        })
    return {"ok": True}


@api_router.get("/inquiries/{code}")
async def get_inquiry(code: str):
    inq = await db.inquiries.find_one({"inquiry_code": code.upper()}, {"_id": 0})
    if not inq:
        raise HTTPException(status_code=404, detail="Inquiry tidak ditemukan")
    return public_inquiry(inq)


@api_router.get("/inquiries")
async def list_inquiries(status: Optional[str] = None, user: dict = Depends(require_roles("admin_bpu"))):
    query = {}
    if status and status != "all":
        query["status"] = {"$in": status.split(",")}
    return await db.inquiries.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)


@api_router.patch("/inquiries/{iid}/status")
async def update_inquiry_status(iid: str, body: InquiryStatusUpdate,
                                user: dict = Depends(require_roles("admin_bpu"))):
    inq = await db.inquiries.find_one({"id": iid}) or await db.inquiries.find_one({"inquiry_code": iid})
    if not inq:
        raise HTTPException(status_code=404, detail="Inquiry tidak ditemukan")
    if body.status not in STATUS_MAP:
        raise HTTPException(status_code=422, detail="Status tidak dikenal")
    if body.status not in STATUS_MAP[inq["status"]]["next"]:
        raise HTTPException(status_code=400, detail=(
            f"Status tidak dapat diubah dari {STATUS_MAP[inq['status']]['label']} "
            f"ke {STATUS_MAP[body.status]['label']}"))
    if body.status == "FINAL_TARIFF_CONFIRMED" and not (body.final_price or inq.get("final_price")):
        raise HTTPException(status_code=422, detail="Isi tarif final terlebih dahulu")

    updates = {"status": body.status, "status_label": STATUS_MAP[body.status]["label"]}
    if body.final_price:
        updates["final_price"] = body.final_price

    if body.status in LOCK_STATUSES and not inq.get("availability_id"):
        conflicts = await find_conflicts(inq["building_id"], inq["date"], inq["start_time"], inq["end_time"],
                                         space_id=inq["space_id"])
        if conflicts:
            raise HTTPException(status_code=409, detail={
                "message": "Tidak dapat menyetujui: slot ruang sudah terpakai",
                "conflicts": conflicts,
            })
        aid = new_id()
        await db.availability.insert_one({
            "id": aid, "facility_id": inq["building_id"], "space_id": inq["space_id"], "date": inq["date"],
            "start_time": inq["start_time"], "end_time": inq["end_time"], "source": "external",
            "purpose": inq.get("purpose") or inq.get("activity_type", ""), "unit": inq.get("organization", ""),
            "notes": "", "status": "active", "created_by": user["name"], "created_at": now_iso(),
            "request_id": inq["inquiry_code"],
        })
        updates["availability_id"] = aid
        await db.bookings.insert_one({
            "id": new_id(), "inquiry_id": inq["id"], "inquiry_code": inq["inquiry_code"],
            "building_id": inq["building_id"], "building_name": inq["building_name"],
            "space_id": inq["space_id"], "space_code": inq["space_code"], "space_name": inq["space_name"],
            "confirmed_date": inq["date"], "start_time": inq["start_time"], "end_time": inq["end_time"],
            "name": inq["name"], "organization": inq.get("organization", ""),
            "final_price": body.final_price or inq.get("final_price"), "status": "pending",
            "created_at": now_iso(),
        })

    if body.status in RELEASE_STATUSES and inq.get("availability_id"):
        await db.availability.update_one({"id": inq["availability_id"]}, {"$set": {"status": "cancelled"}})
        updates["availability_id"] = None
        await db.bookings.update_many({"inquiry_id": inq["id"]}, {"$set": {"status": "cancelled"}})

    booking_set = {}
    if body.final_price:
        booking_set["final_price"] = body.final_price
    if body.status == "BOOKING_CONFIRMED":
        booking_set["status"] = "confirmed"
        booking_set["confirmed_at"] = now_iso()
    if booking_set:
        await db.bookings.update_many({"inquiry_id": inq["id"], "status": {"$ne": "cancelled"}}, {"$set": booking_set})

    entry = {"status": body.status, "label": STATUS_MAP[body.status]["label"], "note": body.note,
             "at": now_iso(), "by": user["name"]}
    await db.inquiries.update_one({"id": inq["id"]}, {"$set": updates, "$push": {"history": entry}})
    return await db.inquiries.find_one({"id": inq["id"]}, {"_id": 0})


@api_router.get("/bookings")
async def list_bookings(status: Optional[str] = None, user: dict = Depends(require_roles("admin_bpu"))):
    query = {"status": status} if status and status != "all" else {}
    return await db.bookings.find(query, {"_id": 0}).sort("confirmed_date", 1).to_list(1000)


# ----------------------- Content (Stories/News/Events) -----------------------
@api_router.get("/content")
async def list_content(category: Optional[str] = None, include_unpublished: bool = False):
    query = {}
    if not include_unpublished:
        query["published"] = True
    if category and category != "all":
        query["category"] = category
    items = await db.content.find(query, {"_id": 0}).sort("date", -1).to_list(200)
    return items


@api_router.get("/content/{slug}")
async def get_content(slug: str):
    item = await db.content.find_one({"slug": slug}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Konten tidak ditemukan")
    return item


@api_router.post("/content")
async def create_content(body: ContentInput, user: dict = Depends(require_roles("admin_bpu"))):
    doc = body.model_dump()
    doc["id"] = new_id()
    base_slug = slugify(body.title)
    slug = base_slug
    i = 1
    while await db.content.find_one({"slug": slug}):
        i += 1
        slug = f"{base_slug}-{i}"
    doc["slug"] = slug
    if not doc.get("date"):
        doc["date"] = datetime.now().strftime("%Y-%m-%d")
    doc["created_at"] = now_iso()
    await db.content.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


@api_router.put("/content/{cid}")
async def update_content(cid: str, body: ContentInput, user: dict = Depends(require_roles("admin_bpu"))):
    await db.content.update_one({"id": cid}, {"$set": body.model_dump()})
    updated = await db.content.find_one({"id": cid}, {"_id": 0})
    if not updated:
        raise HTTPException(status_code=404, detail="Konten tidak ditemukan")
    return updated


@api_router.delete("/content/{cid}")
async def delete_content(cid: str, user: dict = Depends(require_roles("admin_bpu"))):
    await db.content.delete_one({"id": cid})
    return {"ok": True}


# ----------------------- Dashboard / Config -----------------------
@api_router.get("/config")
async def config():
    s = await get_settings()
    return {k: s.get(k) for k in ("site_name", "whatsapp_bpu", "contact_phone", "contact_email", "address", "hero_slides")}


@api_router.put("/settings")
async def update_settings(body: SettingsInput, user: dict = Depends(require_roles("admin_bpu"))):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if "whatsapp_bpu" in updates:
        updates["whatsapp_bpu"] = normalize_wa(updates["whatsapp_bpu"])
        if len(updates["whatsapp_bpu"]) < 9:
            raise HTTPException(status_code=422, detail="Nomor WhatsApp tidak valid")
    if "hero_slides" in updates:
        updates["hero_slides"] = [
            {"image": str(s.get("image", "")).strip(), "caption": str(s.get("caption", "")).strip(),
             "link": str(s.get("link", "")).strip()}
            for s in updates["hero_slides"] if str(s.get("image", "")).strip()
        ]
    updates["updated_at"] = now_iso()
    updates["updated_by"] = user["name"]
    await db.settings.update_one({"key": "site"}, {"$set": updates}, upsert=True)
    return await config()


# ----------------------- Media Upload (foto & video, disimpan di MongoDB GridFS) -----------------------
MB = 1024 * 1024
MAX_IMAGE_MB = float(os.environ.get("MAX_IMAGE_MB", 5))
MAX_VIDEO_MB = float(os.environ.get("MAX_VIDEO_MB", 50))
CHUNK = MB


def sniff_media(head: bytes) -> Optional[str]:
    """Tentukan tipe file dari isi (magic bytes), bukan dari nama/ekstensi."""
    if head[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if head[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "image/webp"
    if head[4:8] == b"ftyp":
        return "video/quicktime" if head[8:12] == b"qt  " else "video/mp4"
    if head[:4] == b"\x1a\x45\xdf\xa3":
        return "video/webm"
    return None


def media_bucket():
    return AsyncIOMotorGridFSBucket(db, bucket_name="media")


@api_router.get("/uploads/limits")
async def upload_limits():
    return {"image_mb": MAX_IMAGE_MB, "video_mb": MAX_VIDEO_MB,
            "image_types": ["JPG", "PNG", "WEBP"], "video_types": ["MP4", "WEBM", "MOV"]}


@api_router.post("/uploads")
async def upload_media(file: UploadFile = File(...), user: dict = Depends(require_roles("admin_bpu"))):
    head = await file.read(16)
    mime = sniff_media(head)
    if not mime:
        raise HTTPException(status_code=415, detail="Format tidak didukung. Foto: JPG/PNG/WEBP, Video: MP4/WEBM/MOV")
    kind = "image" if mime.startswith("image/") else "video"
    limit_mb = MAX_IMAGE_MB if kind == "image" else MAX_VIDEO_MB
    limit = int(limit_mb * MB)

    grid_in = media_bucket().open_upload_stream(
        os.path.basename(file.filename or f"{kind}"),
        metadata={"content_type": mime, "kind": kind, "uploaded_by": user["name"], "uploaded_at": now_iso()},
    )
    size = len(head)
    await grid_in.write(head)
    while True:
        chunk = await file.read(CHUNK)
        if not chunk:
            break
        size += len(chunk)
        if size > limit:
            await grid_in.abort()
            raise HTTPException(status_code=413, detail=f"Ukuran {'foto' if kind == 'image' else 'video'} maksimal {limit_mb:g} MB")
        await grid_in.write(chunk)
    await grid_in.close()
    fid = str(grid_in._id)
    return {"id": fid, "url": f"/api/media/{fid}", "kind": kind, "content_type": mime, "size": size}


@api_router.get("/media/{fid}")
async def get_media(fid: str, request: Request):
    try:
        grid_out = await media_bucket().open_download_stream(ObjectId(fid))
    except (InvalidId, NoFile):
        raise HTTPException(status_code=404, detail="File tidak ditemukan")
    total = grid_out.length
    ctype = (grid_out.metadata or {}).get("content_type", "application/octet-stream")
    headers = {"Accept-Ranges": "bytes", "Cache-Control": "public, max-age=31536000, immutable"}

    start, end, status = 0, total - 1, 200
    m = re.match(r"bytes=(\d*)-(\d*)", request.headers.get("range", ""))
    if m and (m.group(1) or m.group(2)):
        if m.group(1):
            start = int(m.group(1))
            end = min(int(m.group(2)), total - 1) if m.group(2) else total - 1
        else:  # suffix range: bytes=-N
            start = max(total - int(m.group(2)), 0)
        if start > end or start >= total:
            return JSONResponse(status_code=416, content={"detail": "Range tidak valid"},
                                headers={"Content-Range": f"bytes */{total}"})
        status = 206
        headers["Content-Range"] = f"bytes {start}-{end}/{total}"
    headers["Content-Length"] = str(end - start + 1)

    async def body():
        grid_out.seek(start)
        remaining = end - start + 1
        while remaining > 0:
            data = await grid_out.read(min(CHUNK, remaining))
            if not data:
                break
            remaining -= len(data)
            yield data

    return StreamingResponse(body(), status_code=status, media_type=ctype, headers=headers)


@api_router.get("/stats/public")
async def public_stats():
    return {
        "buildings": await db.facilities.count_documents({"status": "active"}),
        "spaces": await db.spaces.count_documents({"status": "active"}),
    }


@api_router.get("/admin/stats")
async def admin_stats(user: dict = Depends(get_current_user)):
    today = datetime.now(WIB).strftime("%Y-%m-%d")
    total_facilities = await db.facilities.count_documents({"status": "active"})
    total_all = await db.facilities.count_documents({})
    total_spaces = await db.spaces.count_documents({"status": "active"})
    new_requests = await db.inquiries.count_documents({"status": {"$in": ["INQUIRY_CREATED", "INQUIRY_SENT"]}})
    pending = await db.inquiries.count_documents({"status": "PENDING_BPU_CONFIRMATION"})
    confirmed = await db.inquiries.count_documents({"status": "BOOKING_CONFIRMED"})
    approved = await db.inquiries.count_documents({"status": {"$in": sorted(LOCK_STATUSES - {"BOOKING_CONFIRMED"})}})
    maintenance = await db.availability.count_documents({"source": "maintenance", "status": "active"})
    internal_today = await db.availability.count_documents({"source": "internal", "date": today, "status": "active"})
    used_today = await db.availability.count_documents({"date": today, "status": "active"})

    # utilization per source
    all_events = await db.availability.find({"status": "active"}, {"_id": 0, "source": 1}).to_list(2000)
    util = {"internal": 0, "external": 0, "maintenance": 0}
    for e in all_events:
        util[e.get("source", "internal")] = util.get(e.get("source", "internal"), 0) + 1

    # recent inquiries
    recent = await db.inquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(6)

    # weekly usage (last 7 days)
    weekly = []
    now_wib = datetime.now(WIB)
    for i in range(6, -1, -1):
        d = (now_wib - timedelta(days=i)).strftime("%Y-%m-%d")
        count = await db.availability.count_documents({"date": d, "status": "active"})
        weekly.append({"date": d, "day": (now_wib - timedelta(days=i)).strftime("%a"), "count": count})

    return {
        "total_facilities": total_facilities,
        "total_all_facilities": total_all,
        "total_spaces": total_spaces,
        "available_today": max(total_facilities - used_today, 0),
        "new_requests": new_requests,
        "pending_confirmation": pending,
        "confirmed_bookings": confirmed,
        "approved_bookings": approved,
        "maintenance": maintenance,
        "internal_today": internal_today,
        "utilization": util,
        "recent_requests": recent,
        "weekly_usage": weekly,
    }


@api_router.get("/")
async def root():
    return {"message": "BPU UNIB API", "status": "ok"}


app.include_router(api_router)


@app.middleware("http")
async def limit_upload_size(request: Request, call_next):
    """Tolak upload yang jelas terlalu besar sebelum body dibaca (batas video + overhead multipart)."""
    if request.url.path == "/api/uploads":
        length = request.headers.get("content-length")
        if length and length.isdigit() and int(length) > int(MAX_VIDEO_MB * MB) + MB:
            return JSONResponse(status_code=413, content={"detail": f"Ukuran file maksimal {MAX_VIDEO_MB:g} MB"})
    return await call_next(request)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id")
    await db.facilities.create_index("slug")
    await db.facilities.create_index("id")
    await db.facilities.create_index("code")
    await db.spaces.create_index("id")
    await db.spaces.create_index("building_id")
    await db.amenities.create_index("id")
    await db.availability.create_index([("facility_id", 1), ("date", 1)])
    await db.requests.create_index("request_id")
    await db.inquiries.create_index("inquiry_code", unique=True)
    await db.inquiries.create_index("id")
    await db.bookings.create_index("inquiry_id")
    await db.settings.create_index("key")
    from seed_data import seed_all
    await seed_all(db, hash_password)
    logger.info("BPU UNIB startup complete")


@app.on_event("shutdown")
async def shutdown():
    client.close()

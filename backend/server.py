from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import logging
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
WHATSAPP_BPU = os.environ.get('WHATSAPP_BPU', '6282185028768')

app = FastAPI(title="UNIB ONE API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("unibone")


# ----------------------- Helpers -----------------------
def now_iso():
    return datetime.now(timezone.utc).isoformat()


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
    name: str
    category: str
    description: str = ""
    location: str = ""
    address: str = ""
    latitude: float = -3.7586
    longitude: float = 102.2716
    capacity: int = 0
    area: str = ""
    operating_hours: str = "08.00 - 21.00"
    rules: List[str] = []
    features: List[str] = []
    services: List[str] = []
    images: List[str] = []
    suitable_for: List[str] = []
    pic_name: str = ""
    pic_contact: str = ""
    status: str = "active"
    featured: bool = False


class AvailabilityInput(BaseModel):
    facility_id: str
    date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    end_time: str  # HH:MM
    source: str  # internal | maintenance | external
    purpose: str = ""
    unit: str = ""
    notes: str = ""


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
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"location": {"$regex": q, "$options": "i"}},
            {"category": {"$regex": q, "$options": "i"}},
        ]
    facilities = await db.facilities.find(query, {"_id": 0}).to_list(500)
    if sort == "capacity":
        facilities.sort(key=lambda f: f.get("capacity", 0), reverse=True)
    elif sort == "newest":
        facilities.sort(key=lambda f: f.get("created_at", ""), reverse=True)
    else:
        facilities.sort(key=lambda f: (not f.get("featured", False), f.get("name", "")))
    return facilities


@api_router.get("/facilities/{slug}")
async def get_facility(slug: str):
    fac = await db.facilities.find_one({"slug": slug}, {"_id": 0})
    if not fac:
        fac = await db.facilities.find_one({"id": slug}, {"_id": 0})
    if not fac:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan")
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
    return {"ok": True}


# ----------------------- Availability -----------------------
def overlaps(s1, e1, s2, e2):
    return s1 < e2 and e1 > s2


async def find_conflicts(facility_id, date, start_time, end_time, exclude_id=None):
    events = await db.availability.find(
        {"facility_id": facility_id, "date": date, "status": "active"}, {"_id": 0}
    ).to_list(200)
    conflicts = []
    for ev in events:
        if exclude_id and ev["id"] == exclude_id:
            continue
        if overlaps(start_time, end_time, ev["start_time"], ev["end_time"]):
            conflicts.append(ev)
    return conflicts


@api_router.get("/facilities/{fid}/availability")
async def facility_availability(fid: str, month: Optional[str] = None, public: bool = True):
    query = {"facility_id": fid, "status": "active"}
    if month:
        query["date"] = {"$regex": f"^{month}"}
    events = await db.availability.find(query, {"_id": 0}).to_list(500)
    if public:
        for ev in events:
            ev["purpose"] = ""
            ev["unit"] = ""
            if ev["source"] in ("internal", "external"):
                ev["public_status"] = "unavailable"
            else:
                ev["public_status"] = "maintenance"
    return events


@api_router.get("/availability")
async def all_availability(month: Optional[str] = None, facility_id: Optional[str] = None,
                           user: dict = Depends(get_current_user)):
    query = {"status": "active"}
    if month:
        query["date"] = {"$regex": f"^{month}"}
    if facility_id:
        query["facility_id"] = facility_id
    events = await db.availability.find(query, {"_id": 0}).to_list(1000)
    return events


@api_router.post("/availability")
async def create_availability(body: AvailabilityInput,
                              user: dict = Depends(require_roles("admin_internal", "admin_bpu"))):
    conflicts = await find_conflicts(body.facility_id, body.date, body.start_time, body.end_time)
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
    return {"whatsapp_bpu": WHATSAPP_BPU}


@api_router.get("/admin/stats")
async def admin_stats(user: dict = Depends(get_current_user)):
    today = datetime.now().strftime("%Y-%m-%d")
    total_facilities = await db.facilities.count_documents({"status": "active"})
    total_all = await db.facilities.count_documents({})
    new_requests = await db.requests.count_documents({"status": "request"})
    confirmed = await db.requests.count_documents({"status": "confirmed"})
    approved = await db.requests.count_documents({"status": "approved"})
    maintenance = await db.availability.count_documents({"source": "maintenance", "status": "active"})
    internal_today = await db.availability.count_documents({"source": "internal", "date": today, "status": "active"})
    used_today = await db.availability.count_documents({"date": today, "status": "active"})

    # utilization per source
    all_events = await db.availability.find({"status": "active"}, {"_id": 0, "source": 1}).to_list(2000)
    util = {"internal": 0, "external": 0, "maintenance": 0}
    for e in all_events:
        util[e.get("source", "internal")] = util.get(e.get("source", "internal"), 0) + 1

    # recent requests
    recent = await db.requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(6)

    # weekly usage (last 7 days)
    weekly = []
    for i in range(6, -1, -1):
        d = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        count = await db.availability.count_documents({"date": d, "status": "active"})
        weekly.append({"date": d, "day": (datetime.now() - timedelta(days=i)).strftime("%a"), "count": count})

    return {
        "total_facilities": total_facilities,
        "total_all_facilities": total_all,
        "available_today": max(total_facilities - used_today, 0),
        "new_requests": new_requests,
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
    return {"message": "UNIB ONE API", "status": "ok"}


app.include_router(api_router)

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
    await db.availability.create_index([("facility_id", 1), ("date", 1)])
    await db.requests.create_index("request_id")
    from seed_data import seed_all
    await seed_all(db, hash_password)
    logger.info("UNIB ONE startup complete")


@app.on_event("shutdown")
async def shutdown():
    client.close()

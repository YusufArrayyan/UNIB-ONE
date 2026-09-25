"""Seed data for UNIB ONE: users, facilities (real photos), availability, content."""
import os
import uuid
from datetime import datetime, timezone, timedelta


def _id():
    return str(uuid.uuid4())


def _iso():
    return datetime.now(timezone.utc).isoformat()


def slugify(text):
    s = "".join(c.lower() if c.isalnum() else "-" for c in text)
    while "--" in s:
        s = s.replace("--", "-")
    return s.strip("-")


FACILITIES = [
    {
        "name": "Gedung Serba Guna (GSG) UNIB",
        "category": "Aula",
        "description": "Gedung Serba Guna Universitas Bengkulu adalah ruang multifungsi dengan kapasitas besar yang cocok untuk acara akademik, organisasi, seminar, konferensi, wisuda, maupun kegiatan publik berskala besar. Dilengkapi fasilitas modern dan panggung representatif.",
        "location": "Zona Pusat Kampus UNIB",
        "address": "Jl. WR. Supratman, Kandang Limun, Kota Bengkulu",
        "latitude": -3.7580, "longitude": 102.2735,
        "capacity": 500, "area": "1.200 m2", "operating_hours": "08.00 - 21.00",
        "rules": ["Reservasi minimal H-7", "Dilarang merokok di dalam gedung", "Menjaga kebersihan dan fasilitas", "Wajib koordinasi dengan pengelola untuk dekorasi"],
        "features": ["AC", "LCD Proyektor", "Sound System", "Panggung", "Parkir Luas", "Wi-Fi"],
        "services": ["Cleaning Service", "Operator Sound", "Dokumentasi", "Dekorasi"],
        "images": ["/facilities/gsg-1.jpeg", "/facilities/gsg-2.jpeg", "/facilities/gsg-3.jpeg"],
        "suitable_for": ["Seminar", "Konferensi", "Wisuda", "Event Besar", "Organisasi"],
        "pic_name": "BPU Universitas Bengkulu", "pic_contact": "6282185028768",
        "status": "active", "featured": True,
    },
    {
        "name": "Gedung Laboratorium Terpadu (GLT)",
        "category": "Laboratorium",
        "description": "Gedung Laboratorium Terpadu menyediakan ruang laboratorium modern untuk penelitian multidisiplin dengan peralatan riset berstandar nasional, serta ruang kelas dan ruang praktikum yang lengkap.",
        "location": "Zona Sains & Teknologi",
        "address": "Jl. WR. Supratman, Kandang Limun, Kota Bengkulu",
        "latitude": -3.7595, "longitude": 102.2700,
        "capacity": 120, "area": "800 m2", "operating_hours": "08.00 - 17.00",
        "rules": ["Wajib menggunakan alat keselamatan", "Didampingi laboran", "Reservasi minimal H-3"],
        "features": ["AC", "Peralatan Riset", "Safety Equipment", "Storage", "Wi-Fi", "LCD Proyektor"],
        "services": ["Laboran", "Cleaning Service"],
        "images": ["/facilities/glt-1.jpeg", "/facilities/glt-2.jpeg", "/facilities/glt-3.jpeg", "/facilities/glt-4.jpeg", "/facilities/glt-5.jpeg"],
        "suitable_for": ["Riset", "Praktikum", "Akademik", "Pelatihan"],
        "pic_name": "BPU Universitas Bengkulu", "pic_contact": "6282185028768",
        "status": "active", "featured": True,
    },
    {
        "name": "Asrama Orchid UNIB",
        "category": "Hunian",
        "description": "Asrama Orchid Universitas Bengkulu menyediakan hunian nyaman bagi mahasiswa dan tamu kampus. Dilengkapi kamar, dapur bersama, kamar mandi, serta ruang komunal yang bersih dan tertata.",
        "location": "Zona Hunian Kampus",
        "address": "Jl. WR. Supratman, Kandang Limun, Kota Bengkulu",
        "latitude": -3.7610, "longitude": 102.2680,
        "capacity": 100, "area": "1.500 m2", "operating_hours": "24 Jam",
        "rules": ["Menaati tata tertib asrama", "Menjaga ketenangan", "Reservasi melalui pengelola"],
        "features": ["Dapur Bersama", "Kamar Mandi", "Ruang Komunal", "Wi-Fi", "Parkir"],
        "services": ["Cleaning Service", "Keamanan 24 Jam"],
        "images": ["/facilities/asrama-orchid-1.jpeg", "/facilities/asrama-orchid-2.jpeg", "/facilities/asrama-orchid-3.jpeg", "/facilities/asrama-orchid-4.jpeg", "/facilities/asrama-orchid-5.jpeg", "/facilities/asrama-orchid-6.jpeg"],
        "suitable_for": ["Hunian Mahasiswa", "Tamu Kampus", "Kegiatan Menginap"],
        "pic_name": "BPU Universitas Bengkulu", "pic_contact": "6282185028768",
        "status": "active", "featured": True,
    },
    {
        "name": "Asrama Internasional UNIB",
        "category": "Hunian",
        "description": "Asrama Internasional Universitas Bengkulu adalah hunian representatif untuk mahasiswa asing dan tamu internasional, dengan fasilitas modern dan lingkungan yang mendukung.",
        "location": "Zona Hunian Kampus",
        "address": "Jl. WR. Supratman, Kandang Limun, Kota Bengkulu",
        "latitude": -3.7605, "longitude": 102.2745,
        "capacity": 80, "area": "1.200 m2", "operating_hours": "24 Jam",
        "rules": ["Menaati tata tertib asrama", "Reservasi melalui pengelola"],
        "features": ["AC", "Kamar Mandi Dalam", "Wi-Fi", "Ruang Komunal", "Parkir"],
        "services": ["Cleaning Service", "Keamanan 24 Jam"],
        "images": ["/facilities/asrama-internasional-1.jpeg"],
        "suitable_for": ["Hunian Mahasiswa Asing", "Tamu Internasional"],
        "pic_name": "BPU Universitas Bengkulu", "pic_contact": "6282185028768",
        "status": "active", "featured": False,
    },
    {
        "name": "Aula FMIPA UNIB",
        "category": "Aula",
        "description": "Aula utama kampus FMIPA Universitas Bengkulu, cocok untuk seminar, kuliah umum, workshop, dan berbagai kegiatan akademik dengan kapasitas menengah.",
        "location": "Kampus FMIPA - Padang Harapan",
        "address": "Kampus Padang Harapan, Kota Bengkulu",
        "latitude": -3.7570, "longitude": 102.2690,
        "capacity": 200, "area": "400 m2", "operating_hours": "08.00 - 20.00",
        "rules": ["Reservasi minimal H-5", "Menjaga kebersihan", "Koordinasi dengan pengelola fakultas"],
        "features": ["AC", "LCD Proyektor", "Sound System", "Wi-Fi", "Parkir"],
        "services": ["Cleaning Service", "Operator Sound"],
        "images": ["/facilities/aula-fmipa-1.jpeg"],
        "suitable_for": ["Seminar", "Kuliah Umum", "Workshop", "Akademik"],
        "pic_name": "BPU Universitas Bengkulu", "pic_contact": "6282185028768",
        "status": "active", "featured": True,
    },
    {
        "name": "Kantin Perpustakaan UNIB",
        "category": "Lainnya",
        "description": "Area kantin di kompleks Perpustakaan Pusat UNIB, ruang publik yang nyaman untuk kegiatan santai, gathering kecil, dan aktivitas komunitas kampus.",
        "location": "Kompleks Perpustakaan Pusat",
        "address": "Jl. WR. Supratman, Kandang Limun, Kota Bengkulu",
        "latitude": -3.7588, "longitude": 102.2718,
        "capacity": 150, "area": "300 m2", "operating_hours": "07.00 - 18.00",
        "rules": ["Menjaga kebersihan", "Reservasi untuk acara khusus"],
        "features": ["Wi-Fi", "Area Terbuka", "Parkir"],
        "services": ["Cleaning Service"],
        "images": ["/facilities/kantin-perpus-1.jpeg"],
        "suitable_for": ["Gathering", "Aktivitas Komunitas", "Bazar"],
        "pic_name": "BPU Universitas Bengkulu", "pic_contact": "6282185028768",
        "status": "active", "featured": False,
    },
]

CONTENT = [
    {
        "title": "Di Balik Gedung Serba Guna: Ruang yang Membentuk Generasi",
        "category": "spotlight",
        "excerpt": "Gedung Serba Guna UNIB telah menjadi saksi bisu ribuan momen penting - dari wisuda pertama hingga konferensi internasional terbaru.",
        "body": "Gedung Serba Guna Universitas Bengkulu berdiri sebagai jantung kehidupan akademik dan sosial kampus. Dengan kapasitas lebih dari 500 orang, ruang ini telah menjadi saksi ribuan momen bersejarah. Dilengkapi sistem audio-visual modern, panggung representatif, dan fasilitas pendukung lengkap, GSG siap mendukung setiap acara dengan standar tertinggi.",
        "image": "/facilities/gsg-1.jpeg",
        "date": "2026-09-20", "published": True,
    },
    {
        "title": "UNIB Science Expo 2026 Hadirkan 200 Peneliti Muda",
        "category": "event",
        "excerpt": "Acara tahunan bergengsi ini kembali membuktikan komitmen UNIB dalam mendorong inovasi dan kreativitas mahasiswa.",
        "body": "UNIB Science Expo 2026 diselenggarakan di Gedung Laboratorium Terpadu, menghadirkan 200 peneliti muda dari berbagai fakultas. Acara ini menampilkan hasil riset unggulan, kompetisi inovasi, dan sesi kolaborasi lintas disiplin.",
        "image": "/facilities/glt-2.jpeg",
        "date": "2026-09-15", "published": True,
    },
    {
        "title": "Perpustakaan Digital: Revolusi Akses Ilmu di Era Modern",
        "category": "news",
        "excerpt": "Transformasi digital perpustakaan pusat UNIB membuka akses tanpa batas bagi seluruh civitas akademika.",
        "body": "Perpustakaan Pusat UNIB kini menghadirkan layanan digital yang memudahkan akses koleksi ilmiah kapan saja dan di mana saja. Area kantin perpustakaan juga menjadi ruang kolaborasi favorit mahasiswa.",
        "image": "/facilities/kantin-perpus-1.jpeg",
        "date": "2026-09-10", "published": True,
    },
    {
        "title": "Asrama Orchid: Hunian Nyaman untuk Mahasiswa UNIB",
        "category": "activity",
        "excerpt": "Asrama Orchid menawarkan lingkungan tinggal yang aman, bersih, dan mendukung produktivitas mahasiswa.",
        "body": "Asrama Orchid Universitas Bengkulu terus berbenah menghadirkan hunian yang nyaman bagi mahasiswa. Dengan dapur bersama, ruang komunal, dan keamanan 24 jam, asrama ini menjadi pilihan tepat bagi mahasiswa dari luar kota.",
        "image": "/facilities/asrama-orchid-1.jpeg",
        "date": "2026-09-05", "published": True,
    },
]


async def seed_all(db, hash_password):
    # ---- Users ----
    users = [
        {"name": "M. Yusuf Ar Rayyan", "email": os.environ.get("ADMIN_EMAIL", "m.yusuf.24009@student.unib.ac.id").lower(),
         "password": os.environ.get("ADMIN_PASSWORD", "unibone2026"), "role": "super_admin"},
        {"name": "Admin BPU", "email": "bpu@unib.ac.id", "password": "bpu2026", "role": "admin_bpu"},
        {"name": "Admin Rumah Tangga", "email": "internal@unib.ac.id", "password": "internal2026", "role": "admin_internal"},
    ]
    for u in users:
        existing = await db.users.find_one({"email": u["email"]})
        if existing is None:
            await db.users.insert_one({
                "id": _id(), "name": u["name"], "email": u["email"],
                "password_hash": hash_password(u["password"]), "role": u["role"],
                "status": "active", "created_at": _iso(),
            })
        else:
            # keep password in sync with env for the owner account
            await db.users.update_one({"email": u["email"]}, {"$set": {
                "password_hash": hash_password(u["password"]), "role": u["role"], "name": u["name"],
            }})

    # ---- Facilities ----
    facility_ids = {}
    if await db.facilities.count_documents({}) == 0:
        for f in FACILITIES:
            fid = _id()
            doc = dict(f)
            doc["id"] = fid
            doc["slug"] = slugify(f["name"])
            doc["created_at"] = _iso()
            await db.facilities.insert_one(doc)
            facility_ids[f["name"]] = fid
    else:
        async for f in db.facilities.find({}, {"id": 1, "name": 1, "_id": 0}):
            facility_ids[f["name"]] = f["id"]

    # ---- Availability (demo) ----
    if await db.availability.count_documents({}) == 0:
        base = datetime.now()
        gsg = facility_ids.get("Gedung Serba Guna (GSG) UNIB")
        glt = facility_ids.get("Gedung Laboratorium Terpadu (GLT)")
        aula = facility_ids.get("Aula FMIPA UNIB")
        events = [
            (gsg, 3, "08:00", "12:00", "internal", "Seminar Nasional Mahasiswa", "Fakultas Teknik"),
            (gsg, 7, "13:00", "17:00", "external", "Konferensi Pendidikan", "Dinas Pendidikan"),
            (glt, 2, "09:00", "15:00", "internal", "Praktikum Kimia Dasar", "FMIPA"),
            (glt, 10, "08:00", "16:00", "maintenance", "Kalibrasi Alat Lab", ""),
            (aula, 5, "08:00", "12:00", "internal", "Kuliah Umum", "FMIPA"),
        ]
        for fid, offset, st, et, src, purpose, unit in events:
            if not fid:
                continue
            d = (base + timedelta(days=offset)).strftime("%Y-%m-%d")
            await db.availability.insert_one({
                "id": _id(), "facility_id": fid, "date": d, "start_time": st, "end_time": et,
                "source": src, "purpose": purpose, "unit": unit, "notes": "",
                "status": "active", "created_by": "System Seed", "created_at": _iso(),
            })

    # ---- Content ----
    if await db.content.count_documents({}) == 0:
        for c in CONTENT:
            doc = dict(c)
            doc["id"] = _id()
            doc["slug"] = slugify(c["title"])
            doc["related_facility_id"] = None
            doc["created_at"] = _iso()
            await db.content.insert_one(doc)

"""Seed data & migrations for BPU UNIB: users, buildings, spaces/units, amenities, settings, content.

Sumber data:
- Tarif: Lampiran II Peraturan Rektor UNIB No. 1 Tahun 2026 (Tarif Layanan BLU UNIB).
- Fasilitas termasuk / ketentuan: catatan operasional BPU (update 2026-10).
- Foto: folder "DOKUMENTASI ASET UNIB" -> frontend/public/facilities/<folder>/<file>.jpeg
"""
import os
import uuid
from datetime import datetime, timezone, timedelta

SEED_VERSION = 5
WHATSAPP_BPU_DEFAULT = "6282379869966"
CONTACT_PHONE_DEFAULT = "+62 823-7986-9966"


def _id():
    return str(uuid.uuid4())


def _iso():
    return datetime.now(timezone.utc).isoformat()


def slugify(text):
    s = "".join(c.lower() if c.isalnum() else "-" for c in text)
    while "--" in s:
        s = s.replace("--", "-")
    return s.strip("-")


IMG = "/facilities"
PIC = {"pic_name": "BPU Universitas Bengkulu", "pic_contact": WHATSAPP_BPU_DEFAULT}
ADDR_KL = "Jl. WR. Supratman, Kandang Limun, Kota Bengkulu"


def opt(label, price, price_incl_tax=None, unit=""):
    return {"label": label, "price": price, "price_incl_tax": price_incl_tax, "unit": unit}


# ---------------------------------------------------------------------------
# BUILDING (parent) -> SPACE / UNIT (child). Satu-satunya sumber nama, harga, dan
# konfigurasi; frontend membaca semuanya dari database.
# ---------------------------------------------------------------------------
BUILDINGS = [
    {
        "code": "GSG",
        "name": "Gedung Serba Guna (GSG) UNIB",
        "aliases": [],
        "category": "Gedung",
        "description": "Gedung Serba Guna Universitas Bengkulu adalah gedung berkapasitas besar (1.000 sampai 2.000 undangan) untuk resepsi, wisuda, seminar, konferensi, dan kegiatan publik berskala besar. Tarif menyesuaikan kategori pengguna dan pilihan AC / Non AC.",
        "location": "Zona Pusat Kampus UNIB",
        "address": ADDR_KL,
        "latitude": -3.7580, "longitude": 102.2735,
        "capacity": 2000, "capacity_label": "1.000 sampai 2.000 undangan",
        "area": "1.200 m2", "operating_hours": "08.00 s.d. 21.00",
        "features": [
            "Kursi Futura 300 unit (tanpa sarung)",
            "Kursi Citos 300 unit (tanpa sarung)",
            "Sofa 2 set (2 kursi single + 1 kursi panjang)",
            "AC di atas panggung",
            "Meja tamu 2 unit (kiri & kanan)",
            "Jenset (BBM ditanggung penyewa)",
            "Cleaning Service 8 orang (acara pesta)",
            "Penanggung Jawab (PJ) 1 orang",
            "Satpam 2 orang (sebelum & sesudah kegiatan)",
        ],
        "not_included": [
            "Sound system (penyewa membawa orgen/sound beserta jenset sendiri)",
            "Layar/screen (tersedia berbayar Rp3.000.000/unit)",
            "AC ruang utama (sesuai pilihan tarif AC / Non AC)",
        ],
        "rules": [
            "Acara pesta/resepsi hanya dapat dilaksanakan pada hari Sabtu dan Minggu",
            "Tambahan kursi untuk acara resepsi (khusus) disewa terpisah",
            "BBM jenset ditanggung penyewa",
            "Biaya tambahan ekstra dapat dikenakan apabila terjadi hal di luar kendali",
            "Tarif final dikonfirmasi oleh BPU",
        ],
        "services": ["Cleaning Service", "Penanggung Jawab Gedung", "Keamanan"],
        "images": [f"{IMG}/gsg/dalam-gsg.jpeg", f"{IMG}/gsg/dalam-gsg-1.jpeg", f"{IMG}/gsg/dalam-gsg-2.jpeg"],
        "videos": [],
        "suitable_for": ["Resepsi", "Wisuda", "Seminar", "Konferensi", "Event Besar"],
        **PIC, "status": "active", "featured": True,
        "spaces": [
            {
                "code": "GSG-FULL", "name": "Seluruh Gedung Serba Guna", "is_full_building": True, "group": "Sewa Full Gedung",
                "description": "Penggunaan seluruh area Gedung Serba Guna.",
                "capacity": 2000, "capacity_label": "1.000 sampai 2.000 undangan",
                "amenities": ["Kursi Futura 300", "Kursi Citos 300", "Sofa 2 set", "AC panggung", "Meja tamu 2", "Jenset"],
                "images": [],
                "pricing_rule": {"mode": "auto", "unit": "kegiatan/hari", "note": "Kisaran tarif berdasarkan kategori pengguna dan fasilitas. Tarif final dikonfirmasi oleh BPU.", "options": [
                    opt("Kegiatan Masyarakat Umum (Non AC)", 11000000, 13081081),
                    opt("Kegiatan Masyarakat Umum (Include AC)", 18000000, 21405405),
                    opt("Kegiatan Dosen/Karyawan/Pensiunan UNIB (Non AC)", 7000000, 8324324),
                    opt("Kegiatan Dosen/Karyawan/Pensiunan UNIB (Include AC)", 12000000, 14270270),
                    opt("Kegiatan Mahasiswa (di luar Layanan UKT) Berkontribusi", 3000000, 3000000),
                ]},
            },
            {
                "code": "GSG-R01", "name": "Ruang Rapat Utama GSG", "is_full_building": False, "group": "Ruang Terpisah",
                "description": "Ruang di dalam Gedung Serba Guna yang dapat disewa terpisah.",
                "capacity": 0, "capacity_label": "", "amenities": [], "images": [],
                "pricing_rule": {"mode": "confirm", "unit": "", "note": "", "options": []},
            },
            {
                "code": "GSG-R02", "name": "Ruang Rapat Kecil GSG", "is_full_building": False, "group": "Ruang Terpisah",
                "description": "Ruang di dalam Gedung Serba Guna yang dapat disewa terpisah.",
                "capacity": 0, "capacity_label": "", "amenities": [], "images": [],
                "pricing_rule": {"mode": "confirm", "unit": "", "note": "", "options": []},
            },
        ],
    },
    {
        "code": "GLT",
        "name": "Gedung Layanan Terpadu (GLT)",
        "aliases": ["Gedung Laboratorium Terpadu (GLT)"],
        "category": "Ruang",
        "description": "Gedung Layanan Terpadu (GLT) Universitas Bengkulu menyediakan Ruang Rapat Utama berkapasitas 100 orang dengan meja dan kursi lengkap, sound system, dan videotron (biaya tambahan), serta Ruang Rapat 1 sampai 4 untuk rapat dan pertemuan.",
        "location": "Zona Pusat Kampus UNIB",
        "address": ADDR_KL,
        "latitude": -3.7595, "longitude": 102.2700,
        "capacity": 100, "capacity_label": "Hingga 100 orang",
        "area": "", "operating_hours": "08.00 s.d. 17.00",
        "features": [
            "Meja & kursi lengkap (Ruang Rapat Utama, 100 orang)",
            "Sound system",
            "AC Standing 2 unit + AC Plafon 6 unit (Ruang Rapat Utama)",
            "Sofa 1 set (sementara)",
            "Meja absensi 1 unit",
            "Ruang transit (Ruang Rapat 1) dengan TV, sound system, dan AC",
        ],
        "not_included": ["Videotron (biaya tambahan Rp3.000.000/hari)"],
        "rules": ["Tarif per 8 jam pemakaian", "Penggunaan videotron dikenakan biaya tambahan", "Tarif final dikonfirmasi oleh BPU"],
        "services": ["Operator Sound", "Cleaning Service"],
        "images": [f"{IMG}/glt/glt-depan.jpeg", f"{IMG}/glt/dalam-glt-utama.jpeg", f"{IMG}/glt/ruang-4-glt.jpeg", f"{IMG}/glt/samping-glt.jpeg", f"{IMG}/glt/samping-belakang-glt.jpeg"],
        "videos": [],
        "suitable_for": ["Rapat", "Seminar", "Workshop", "Pelatihan"],
        **PIC, "status": "active", "featured": True,
        "spaces": [
            {
                "code": "GLT-RU", "name": "Ruang Rapat Utama", "is_full_building": False, "group": "Ruang Rapat",
                "description": "Ruang rapat utama GLT dengan meja dan kursi lengkap untuk 100 orang. Ruang Rapat 1 dapat dipakai sebagai ruang transit.",
                "capacity": 100, "capacity_label": "100 orang",
                "amenities": ["Meja & kursi lengkap", "Sound system", "AC Standing 2", "AC Plafon 6", "Sofa 1 set (sementara)", "Meja absensi 1", "Videotron (biaya tambahan)"],
                "images": [f"{IMG}/glt/dalam-glt-utama.jpeg"],
                "pricing_rule": {"mode": "auto", "unit": "8 jam", "note": "Videotron Rp3.000.000/hari (tarif peralatan SK 2026). Tarif final dikonfirmasi oleh BPU.", "options": [
                    opt("Ruang Rapat Utama", 2500000, 2972973),
                    opt("Ruang Rapat Utama + Videotron", 5500000),
                ]},
            },
            {
                "code": "GLT-R01", "name": "Ruang Rapat 1 (Ruang Transit)", "is_full_building": False, "group": "Ruang Rapat",
                "description": "Ruang rapat/transit dengan TV, sound system, dan AC.",
                "capacity": 50, "capacity_label": "40 sampai 50 orang",
                "amenities": ["TV", "Sound system", "AC"],
                "images": [],
                "pricing_rule": {"mode": "auto", "unit": "8 jam", "note": "", "options": [opt("Ruang Rapat 1", 1000000)]},
            },
            {
                "code": "GLT-R02", "name": "Ruang Rapat 2", "is_full_building": False, "group": "Ruang Rapat",
                "description": "", "capacity": 0, "capacity_label": "", "amenities": [], "images": [],
                "pricing_rule": {"mode": "auto", "unit": "8 jam", "note": "", "options": [opt("Ruang Rapat 2", 1000000)]},
            },
            {
                "code": "GLT-R03", "name": "Ruang Rapat 3", "is_full_building": False, "group": "Ruang Rapat",
                "description": "", "capacity": 0, "capacity_label": "", "amenities": [], "images": [],
                "pricing_rule": {"mode": "auto", "unit": "8 jam", "note": "", "options": [opt("Ruang Rapat 3", 1000000)]},
            },
            {
                "code": "GLT-R04", "name": "Ruang Rapat 4", "is_full_building": False, "group": "Ruang Rapat",
                "description": "", "capacity": 0, "capacity_label": "", "amenities": [],
                "images": [f"{IMG}/glt/ruang-4-glt.jpeg"],
                "pricing_rule": {"mode": "auto", "unit": "8 jam", "note": "", "options": [opt("Ruang Rapat 4", 1000000)]},
            },
        ],
    },
    {
        "code": "GDC",
        "name": "Gedung C UNIB",
        "aliases": [],
        "category": "Gedung",
        "description": "Gedung C Universitas Bengkulu untuk resepsi dan kegiatan berkapasitas 500 sampai 1.000 undangan. Gedung Non AC dengan kipas angin dan jenset.",
        "location": "Zona Pusat Kampus UNIB",
        "address": ADDR_KL,
        "latitude": -3.7584, "longitude": 102.2722,
        "capacity": 1000, "capacity_label": "500 sampai 1.000 undangan",
        "area": "", "operating_hours": "08.00 s.d. 21.00",
        "features": [
            "Kipas angin (gedung Non AC)",
            "Jenset",
            "Kursi 350 unit (campuran Futura & Citos)",
            "Sofa 1 set",
            "Cleaning Service 2 orang",
            "Penanggung Jawab (PJ) 1 orang",
            "Satpam 2 orang",
            "Meja luar 3 unit",
        ],
        "not_included": ["AC", "Layar/screen"],
        "rules": ["Tambahan kursi acara disewa terpisah", "Tarif final dikonfirmasi oleh BPU"],
        "services": ["Cleaning Service", "Penanggung Jawab Gedung", "Keamanan"],
        "images": [f"{IMG}/gedung-c/gedung-c-depan.jpeg", f"{IMG}/gedung-c/gedung-c-samping.jpeg"],
        "videos": [],
        "suitable_for": ["Resepsi", "Seminar", "Acara Organisasi"],
        **PIC, "status": "active", "featured": True,
        "spaces": [
            {
                "code": "GDC-FULL", "name": "Seluruh Gedung C", "is_full_building": True, "group": "Sewa Full Gedung",
                "description": "Penggunaan seluruh area Gedung C.",
                "capacity": 1000, "capacity_label": "500 sampai 1.000 undangan",
                "amenities": ["Kipas angin", "Jenset", "Kursi 350", "Sofa 1 set", "Meja luar 3"],
                "images": [],
                "pricing_rule": {"mode": "auto", "unit": "kegiatan/hari", "note": "Tarif final dikonfirmasi oleh BPU.", "options": [
                    opt("Kegiatan Masyarakat Umum", 8000000, 9513514),
                    opt("Kegiatan Dosen/Karyawan/Pensiunan UNIB", 6000000, 7135135),
                    opt("Kegiatan Mahasiswa (di luar Layanan UKT) Berkontribusi", 750000, 750000),
                ]},
            },
        ],
    },
    {
        "code": "APH",
        "name": "Aula Padang Harapan",
        "aliases": ["Aula FMIPA UNIB"],
        "category": "Aula",
        "description": "Aula di gedung utama kampus FMIPA Padang Harapan (Aula FMIPA / Gedung Pertemuan D3 Kampus Padang Harapan) berkapasitas 500 sampai 1.000 undangan dengan 5 unit AC standing.",
        "location": "Kampus Padang Harapan (FMIPA)",
        "address": "Kampus Padang Harapan, Kota Bengkulu",
        "latitude": -3.7570, "longitude": 102.2690,
        "capacity": 1000, "capacity_label": "500 sampai 1.000 undangan",
        "area": "", "operating_hours": "08.00 s.d. 21.00",
        "features": [
            "AC Standing 5 unit (sesuai pilihan tarif AC)",
            "Kursi Citos/lipat 300 unit",
            "Sofa 1 set",
            "Cleaning Service 2 orang",
            "Penanggung Jawab (PJ) 1 orang",
            "Satpam 2 orang",
            "Meja tamu 2 unit",
        ],
        "not_included": ["Jenset (tidak tersedia)"],
        "rules": ["Tambahan kursi acara disewa terpisah", "Tarif final dikonfirmasi oleh BPU"],
        "services": ["Cleaning Service", "Penanggung Jawab Gedung", "Keamanan"],
        "images": [f"{IMG}/aula-padang-harapan/dalam-gedung-utama-kampus-fmipa.jpeg"],
        "videos": [f"{IMG}/aula-padang-harapan/vid-aula-padang-harapan.mp4"],
        "suitable_for": ["Seminar", "Kuliah Umum", "Resepsi", "Workshop"],
        **PIC, "status": "active", "featured": True,
        "spaces": [
            {
                "code": "APH-FULL", "name": "Seluruh Aula Padang Harapan", "is_full_building": True, "group": "Sewa Full Gedung",
                "description": "Penggunaan seluruh area aula.",
                "capacity": 1000, "capacity_label": "500 sampai 1.000 undangan",
                "amenities": ["AC Standing 5", "Kursi Citos/lipat 300", "Sofa 1 set", "Meja tamu 2"],
                "images": [],
                "pricing_rule": {"mode": "auto", "unit": "kegiatan/hari", "note": "Tarif Gedung Pertemuan D3 Kampus Padang Harapan. Tarif final dikonfirmasi oleh BPU.", "options": [
                    opt("Kegiatan Masyarakat Umum (Non AC)", 8000000, 9513514),
                    opt("Kegiatan Masyarakat Umum (Include AC)", 10000000, 11891892),
                    opt("Kegiatan Dosen/Karyawan/Pensiunan UNIB (Non AC)", 6000000, 7135135),
                    opt("Kegiatan Dosen/Karyawan/Pensiunan UNIB (Include AC)", 8000000, 9513514),
                    opt("Kegiatan Mahasiswa (di luar Layanan UKT) Berkontribusi", 2000000, 2000000),
                ]},
            },
        ],
    },
    {
        "code": "ORC",
        "name": "Asrama Orchid UNIB",
        "aliases": [],
        "category": "Hunian",
        "description": "Asrama (Rusun) Orchid Universitas Bengkulu menyediakan kamar untuk 2 orang dengan dapur bersama, kamar mandi, dan ruang komunal yang bersih dan tertata. Tarif per kamar per bulan sesuai lantai.",
        "location": "Zona Hunian Kampus",
        "address": ADDR_KL,
        "latitude": -3.7610, "longitude": 102.2680,
        "capacity": 100, "capacity_label": "2 orang per kamar",
        "area": "1.500 m2", "operating_hours": "24 Jam",
        "features": ["Dapur Bersama", "Kamar Mandi", "Ruang Komunal", "Parkir"],
        "not_included": [],
        "rules": ["Menaati tata tertib asrama", "Menjaga ketenangan", "Tarif per kamar per bulan", "Tarif final dikonfirmasi oleh BPU"],
        "services": ["Cleaning Service", "Keamanan 24 Jam"],
        "images": [
            f"{IMG}/asrama-orchid/gedung-depan-asrama-orchid.jpeg", f"{IMG}/asrama-orchid/gedung-depan-asrama-o.jpeg",
            f"{IMG}/asrama-orchid/gedung-depan-asrama-o-a.jpeg", f"{IMG}/asrama-orchid/samping-asrama-o.jpeg",
            f"{IMG}/asrama-orchid/tampilan-dalam-asrama-o.jpeg", f"{IMG}/asrama-orchid/dalam-kamar-asrama-orchid.jpeg",
            f"{IMG}/asrama-orchid/kamar-mandi-asrama.jpeg", f"{IMG}/asrama-orchid/dapur-asrama-o.jpeg",
        ],
        "videos": [],
        "suitable_for": ["Hunian Mahasiswa", "Tamu Kampus", "Kegiatan Menginap"],
        **PIC, "status": "active", "featured": False,
        "spaces": [
            {
                "code": f"ORC-L{n}", "name": f"Kamar Lantai {n}", "is_full_building": False, "group": "Kamar per Lantai",
                "description": "Kamar untuk 2 orang.", "capacity": 2, "capacity_label": "2 orang / kamar",
                "amenities": ["Dapur bersama", "Kamar mandi", "Ruang komunal"],
                "images": [f"{IMG}/asrama-orchid/dalam-kamar-asrama-orchid.jpeg"],
                "pricing_rule": {"mode": "auto", "unit": "kamar/bulan", "note": "", "options": [opt(f"Lantai {n} (untuk 2 orang)", price)]},
            }
            for n, price in [(2, 500000), (3, 475000), (4, 450000), (5, 425000)]
        ],
    },
    {
        "code": "ASI",
        "name": "Asrama Internasional UNIB",
        "aliases": [],
        "category": "Hunian",
        "description": "Asrama UNIB Jl. WR Supratman Kandang Limun (Asrama Internasional), hunian representatif untuk mahasiswa dan tamu internasional, tersedia kamar dengan AC dan tanpa AC.",
        "location": "Zona Hunian Kampus",
        "address": ADDR_KL,
        "latitude": -3.7605, "longitude": 102.2745,
        "capacity": 80, "capacity_label": "",
        "area": "1.200 m2", "operating_hours": "24 Jam",
        "features": ["Kamar AC / Non AC", "Kamar Mandi Dalam", "Ruang Komunal", "Parkir"],
        "not_included": [],
        "rules": ["Menaati tata tertib asrama", "Tarif mahasiswa beasiswa berlaku dengan bukti beasiswa", "Tarif final dikonfirmasi oleh BPU"],
        "services": ["Cleaning Service", "Keamanan 24 Jam"],
        "images": [f"{IMG}/asrama-internasional/asrama-internasional.jpeg"],
        "videos": [],
        "suitable_for": ["Hunian Mahasiswa Asing", "Tamu Internasional"],
        **PIC, "status": "active", "featured": False,
        "spaces": [
            {
                "code": "ASI-AC", "name": "Kamar Dengan AC", "is_full_building": False, "group": "Kamar",
                "description": "", "capacity": 0, "capacity_label": "", "amenities": ["AC"], "images": [],
                "pricing_rule": {"mode": "auto", "unit": "", "note": "", "options": [
                    opt("Mahasiswa Non Beasiswa, per hari", 200000, unit="hari"),
                    opt("Mahasiswa Non Beasiswa, per bulan", 6000000, unit="bulan"),
                    opt("Mahasiswa Beasiswa, per bulan", 1000000, unit="bulan"),
                ]},
            },
            {
                "code": "ASI-NAC", "name": "Kamar Tanpa AC", "is_full_building": False, "group": "Kamar",
                "description": "", "capacity": 0, "capacity_label": "", "amenities": [], "images": [],
                "pricing_rule": {"mode": "auto", "unit": "", "note": "", "options": [
                    opt("Mahasiswa Non Beasiswa, per hari", 150000, unit="hari"),
                    opt("Mahasiswa Non Beasiswa, per bulan", 4500000, unit="bulan"),
                    opt("Mahasiswa Beasiswa, per bulan", 500000, unit="bulan"),
                ]},
            },
        ],
    },
    {
        "code": "GOR",
        "name": "Gedung Olahraga UNIB",
        "aliases": [],
        "category": "Lapangan",
        "description": "Gedung Olahraga Universitas Bengkulu dengan lapangan indoor untuk futsal dan basket.",
        "location": "Kampus UNIB Depan",
        "address": ADDR_KL,
        "latitude": -3.7575, "longitude": 102.2712,
        "capacity": 0, "capacity_label": "",
        "area": "", "operating_hours": "08.00 s.d. 21.00",
        "features": ["Lapangan Indoor", "Futsal", "Basket"],
        "not_included": [],
        "rules": ["Tarif per 1 jam", "Tarif final dikonfirmasi oleh BPU"],
        "services": [],
        "images": [f"{IMG}/gedung-olahraga-unib-depan/unib-depan.jpeg"],
        "videos": [],
        "suitable_for": ["Futsal", "Basket", "Olahraga"],
        **PIC, "status": "active", "featured": False,
        "spaces": [
            {
                "code": "GOR-IND", "name": "Lapangan Futsal/Basket Indoor", "is_full_building": True, "group": "Lapangan",
                "description": "", "capacity": 0, "capacity_label": "", "amenities": [], "images": [],
                "pricing_rule": {"mode": "auto", "unit": "1 jam", "note": "", "options": [opt("Lapangan Futsal/Basket Indoor", 150000)]},
            },
        ],
    },
    {
        "code": "LBK",
        "name": "Lapangan Basket UNIB",
        "aliases": [],
        "category": "Lapangan",
        "description": "Lapangan basket outdoor Universitas Bengkulu.",
        "location": "Kampus UNIB",
        "address": ADDR_KL,
        "latitude": -3.7572, "longitude": 102.2705,
        "capacity": 0, "capacity_label": "",
        "area": "", "operating_hours": "06.00 s.d. 18.00",
        "features": ["Lapangan Outdoor", "Ring Basket"],
        "not_included": [],
        "rules": ["Tarif per 2 jam", "Tarif final dikonfirmasi oleh BPU"],
        "services": [],
        "images": [f"{IMG}/lapangan-basket/lapangan-basket.jpeg"],
        "videos": [],
        "suitable_for": ["Basket", "Olahraga"],
        **PIC, "status": "active", "featured": False,
        "spaces": [
            {
                "code": "LBK-01", "name": "Lapangan Basket Outdoor", "is_full_building": True, "group": "Lapangan",
                "description": "", "capacity": 0, "capacity_label": "", "amenities": [], "images": [],
                "pricing_rule": {"mode": "auto", "unit": "2 jam", "note": "", "options": [opt("Lapangan Basket Outdoor", 150000)]},
            },
        ],
    },
    {
        "code": "LTN",
        "name": "Lapangan Tenis UNIB",
        "aliases": [],
        "category": "Lapangan",
        "description": "Lapangan tenis beratap Universitas Bengkulu untuk civitas akademika, umum, maupun klub.",
        "location": "Kampus UNIB",
        "address": ADDR_KL,
        "latitude": -3.7569, "longitude": 102.2718,
        "capacity": 0, "capacity_label": "",
        "area": "", "operating_hours": "06.00 s.d. 18.00",
        "features": ["Lapangan Beratap"],
        "not_included": [],
        "rules": ["Tarif final dikonfirmasi oleh BPU"],
        "services": [],
        "images": [f"{IMG}/lapangan-tenis/lapangan-tennis-unib.jpeg"],
        "videos": [],
        "suitable_for": ["Tenis", "Olahraga", "Klub"],
        **PIC, "status": "active", "featured": False,
        "spaces": [
            {
                "code": "LTN-01", "name": "Lapangan Tenis", "is_full_building": True, "group": "Lapangan",
                "description": "", "capacity": 0, "capacity_label": "", "amenities": [], "images": [],
                "pricing_rule": {"mode": "auto", "unit": "", "note": "", "options": [
                    opt("Mahasiswa, Karyawan dan Dosen", 50000, unit="orang/bulan"),
                    opt("Umum", 200000, unit="orang/bulan"),
                    opt("Klub", 500000, unit="hari"),
                ]},
            },
        ],
    },
    {
        "code": "KTP",
        "name": "Kantin Perpustakaan UNIB",
        "aliases": [],
        "category": "Lainnya",
        "description": "Area kantin di kompleks Perpustakaan Pusat UNIB, ruang publik yang nyaman untuk kegiatan santai, gathering kecil, dan aktivitas komunitas kampus.",
        "location": "Kompleks Perpustakaan Pusat",
        "address": ADDR_KL,
        "latitude": -3.7588, "longitude": 102.2718,
        "capacity": 150, "capacity_label": "",
        "area": "300 m2", "operating_hours": "07.00 s.d. 18.00",
        "features": ["Area Terbuka", "Parkir"],
        "not_included": [],
        "rules": ["Menjaga kebersihan", "Reservasi untuk acara khusus"],
        "services": ["Cleaning Service"],
        "images": [f"{IMG}/kantin-perpus/kantin-perpus.jpeg"],
        "videos": [],
        "suitable_for": ["Gathering", "Aktivitas Komunitas", "Bazar"],
        **PIC, "status": "active", "featured": False,
        "spaces": [
            {
                "code": "KTP-01", "name": "Area Kantin Perpustakaan", "is_full_building": True, "group": "Area",
                "description": "", "capacity": 150, "capacity_label": "", "amenities": [], "images": [],
                "pricing_rule": {"mode": "confirm", "unit": "", "note": "", "options": []},
            },
        ],
    },
]

# Fasilitas tambahan (entitas tersendiri, bukan ruang). building_codes kosong = berlaku untuk semua gedung.
AMENITIES = [
    {"name": "Kursi Acara Tambahan", "description": "Tambahan kursi acara (mis. resepsi).", "unit": "unit/kegiatan", "price": 10000,
     "price_information": "Rp10.000 per unit per kegiatan", "building_codes": ["GSG", "GDC", "APH"], "max_qty": 1000},
    {"name": "Layar / Screen", "description": "Layar untuk acara di GSG.", "unit": "unit", "price": 3000000,
     "price_information": "Rp3.000.000 per unit", "building_codes": ["GSG"], "max_qty": 5},
    {"name": "Videotron", "description": "Videotron Ruang Rapat Utama GLT.", "unit": "hari/unit", "price": 3000000,
     "price_information": "Rp3.000.000 per hari per unit", "building_codes": ["GLT"], "max_qty": 1},
    {"name": "LCD Proyektor", "description": "", "unit": "hari/unit", "price": 250000,
     "price_information": "Rp250.000 per hari per unit", "building_codes": [], "max_qty": 10},
    {"name": "AC Standing", "description": "", "unit": "hari/unit", "price": 1000000,
     "price_information": "Rp1.000.000 per hari per unit", "building_codes": [], "max_qty": 10},
    {"name": "Laptop/Notebook", "description": "", "unit": "hari/unit", "price": 300000,
     "price_information": "Rp300.000 per hari per unit", "building_codes": [], "max_qty": 10},
]

HERO_SLIDES = [
    {"image": f"{IMG}/gsg/dalam-gsg.jpeg", "caption": "Gedung Serba Guna (GSG)", "link": "/facility/gedung-serba-guna-gsg-unib"},
    {"image": f"{IMG}/glt/glt-depan.jpeg", "caption": "Gedung Layanan Terpadu (GLT)", "link": "/facility/gedung-layanan-terpadu-glt"},
    {"image": f"{IMG}/gedung-olahraga-unib-depan/unib-depan.jpeg", "caption": "Gedung Olahraga UNIB", "link": "/facility/gedung-olahraga-unib"},
    {"image": f"{IMG}/aula-padang-harapan/dalam-gedung-utama-kampus-fmipa.jpeg", "caption": "Aula Padang Harapan", "link": "/facility/aula-padang-harapan"},
    {"image": f"{IMG}/asrama-orchid/gedung-depan-asrama-orchid.jpeg", "caption": "Asrama Orchid UNIB", "link": "/facility/asrama-orchid-unib"},
    {"image": f"{IMG}/lapangan-tenis/lapangan-tennis-unib.jpeg", "caption": "Lapangan Tenis UNIB", "link": "/facility/lapangan-tenis-unib"},
]

DEFAULT_SETTINGS = {
    "site_name": "BPU UNIB",
    "whatsapp_bpu": WHATSAPP_BPU_DEFAULT,
    "contact_phone": CONTACT_PHONE_DEFAULT,
    "contact_email": "bpu@unib.ac.id",
    "address": ADDR_KL,
    "hero_slides": HERO_SLIDES,
}

# Foto lama (flat) -> foto baru sesuai nama folder/file di "DOKUMENTASI ASET UNIB".
LEGACY_IMAGE_MAP = {
    f"{IMG}/gsg-1.jpeg": f"{IMG}/gsg/dalam-gsg.jpeg",
    f"{IMG}/gsg-2.jpeg": f"{IMG}/gsg/dalam-gsg-1.jpeg",
    f"{IMG}/gsg-3.jpeg": f"{IMG}/gsg/dalam-gsg-2.jpeg",
    f"{IMG}/glt-1.jpeg": f"{IMG}/glt/glt-depan.jpeg",
    f"{IMG}/glt-2.jpeg": f"{IMG}/glt/dalam-glt-utama.jpeg",
    f"{IMG}/glt-3.jpeg": f"{IMG}/glt/ruang-4-glt.jpeg",
    f"{IMG}/glt-4.jpeg": f"{IMG}/glt/samping-glt.jpeg",
    f"{IMG}/glt-5.jpeg": f"{IMG}/glt/samping-belakang-glt.jpeg",
    f"{IMG}/asrama-orchid-1.jpeg": f"{IMG}/asrama-orchid/gedung-depan-asrama-orchid.jpeg",
    f"{IMG}/asrama-orchid-2.jpeg": f"{IMG}/asrama-orchid/gedung-depan-asrama-o.jpeg",
    f"{IMG}/asrama-orchid-3.jpeg": f"{IMG}/asrama-orchid/tampilan-dalam-asrama-o.jpeg",
    f"{IMG}/asrama-orchid-4.jpeg": f"{IMG}/asrama-orchid/dalam-kamar-asrama-orchid.jpeg",
    f"{IMG}/asrama-orchid-5.jpeg": f"{IMG}/asrama-orchid/kamar-mandi-asrama.jpeg",
    f"{IMG}/asrama-orchid-6.jpeg": f"{IMG}/asrama-orchid/dapur-asrama-o.jpeg",
    f"{IMG}/asrama-internasional-1.jpeg": f"{IMG}/asrama-internasional/asrama-internasional.jpeg",
    f"{IMG}/aula-fmipa-1.jpeg": f"{IMG}/aula-padang-harapan/dalam-gedung-utama-kampus-fmipa.jpeg",
    f"{IMG}/kantin-perpus-1.jpeg": f"{IMG}/kantin-perpus/kantin-perpus.jpeg",
}

CONTENT = [
    {
        "title": "Di Balik Gedung Serba Guna: Ruang yang Membentuk Generasi",
        "category": "spotlight",
        "excerpt": "Gedung Serba Guna UNIB telah menjadi saksi bisu ribuan momen penting - dari wisuda pertama hingga konferensi internasional terbaru.",
        "body": "Gedung Serba Guna Universitas Bengkulu berdiri sebagai jantung kehidupan akademik dan sosial kampus. Dengan daya tampung 1.000 sampai 2.000 undangan, ruang ini telah menjadi saksi ribuan momen bersejarah, dari wisuda hingga resepsi.",
        "image": f"{IMG}/gsg/dalam-gsg.jpeg",
        "date": "2026-09-20", "published": True,
    },
    {
        "title": "Ruang Rapat Utama GLT Siap Dukung Rapat dan Pertemuan",
        "category": "event",
        "excerpt": "Ruang Rapat Utama Gedung Layanan Terpadu berkapasitas 100 orang kini dilengkapi sound system dan videotron.",
        "body": "Gedung Layanan Terpadu (GLT) menyediakan Ruang Rapat Utama berkapasitas 100 orang dengan meja dan kursi lengkap, sound system, serta videotron sebagai fasilitas tambahan. Ruang Rapat 1 sampai 4 tersedia untuk pertemuan berskala lebih kecil.",
        "image": f"{IMG}/glt/dalam-glt-utama.jpeg",
        "date": "2026-09-15", "published": True,
    },
    {
        "title": "Perpustakaan Digital: Revolusi Akses Ilmu di Era Modern",
        "category": "news",
        "excerpt": "Transformasi digital perpustakaan pusat UNIB membuka akses tanpa batas bagi seluruh civitas akademika.",
        "body": "Perpustakaan Pusat UNIB kini menghadirkan layanan digital yang memudahkan akses koleksi ilmiah kapan saja dan di mana saja. Area kantin perpustakaan juga menjadi ruang kolaborasi favorit mahasiswa.",
        "image": f"{IMG}/kantin-perpus/kantin-perpus.jpeg",
        "date": "2026-09-10", "published": True,
    },
    {
        "title": "Asrama Orchid: Hunian Nyaman untuk Mahasiswa UNIB",
        "category": "activity",
        "excerpt": "Asrama Orchid menawarkan lingkungan tinggal yang aman, bersih, dan mendukung produktivitas mahasiswa.",
        "body": "Asrama Orchid Universitas Bengkulu terus berbenah menghadirkan hunian yang nyaman bagi mahasiswa. Dengan dapur bersama, ruang komunal, dan keamanan 24 jam, asrama ini menjadi pilihan tepat bagi mahasiswa dari luar kota.",
        "image": f"{IMG}/asrama-orchid/gedung-depan-asrama-orchid.jpeg",
        "date": "2026-09-05", "published": True,
    },
]


# ---------------------------------------------------------------------------
async def upsert_catalog(db):
    """Buat / perbarui gedung, ruang, dan fasilitas tambahan. ID gedung lama dipertahankan
    (dicocokkan lewat code atau nama lama) agar jadwal & permintaan lama tetap terhubung."""
    code_to_id = {}
    for b in BUILDINGS:
        doc = {k: v for k, v in b.items() if k not in ("spaces", "aliases")}
        new_slug = slugify(b["name"])
        existing = await db.facilities.find_one({"code": b["code"]})
        if not existing:
            existing = await db.facilities.find_one({"name": {"$in": [b["name"], *b.get("aliases", [])]}})
        if existing:
            fid = existing["id"]
            slug_aliases = set(existing.get("slug_aliases") or [])
            if existing.get("slug") and existing["slug"] != new_slug:
                slug_aliases.add(existing["slug"])
            doc.update({"slug": new_slug, "slug_aliases": sorted(slug_aliases), "updated_at": _iso()})
            await db.facilities.update_one({"id": fid}, {"$set": doc})
        else:
            fid = _id()
            doc.update({"id": fid, "slug": new_slug, "slug_aliases": [], "created_at": _iso()})
            await db.facilities.insert_one(doc)
        code_to_id[b["code"]] = fid

        for i, s in enumerate(b["spaces"]):
            sdoc = {**s, "building_id": fid, "sort_order": i, "status": s.get("status", "active")}
            ex = await db.spaces.find_one({"building_id": fid, "code": s["code"]})
            if ex:
                await db.spaces.update_one({"id": ex["id"]}, {"$set": {**sdoc, "updated_at": _iso()}})
            else:
                await db.spaces.insert_one({**sdoc, "id": _id(), "created_at": _iso()})

    for a in AMENITIES:
        adoc = {k: v for k, v in a.items() if k != "building_codes"}
        adoc["building_ids"] = [code_to_id[c] for c in a["building_codes"] if c in code_to_id]
        adoc["status"] = "active"
        ex = await db.amenities.find_one({"name": a["name"]})
        if ex:
            await db.amenities.update_one({"id": ex["id"]}, {"$set": adoc})
        else:
            await db.amenities.insert_one({**adoc, "id": _id(), "created_at": _iso()})
    return code_to_id


async def migrate_v2(db):
    """Update 2026-10: BPU UNIB rebrand, struktur Building -> Space, tarif SK 2026, foto baru, WA baru."""
    code_to_id = await upsert_catalog(db)

    await db.settings.update_one({"key": "site"}, {"$set": {**DEFAULT_SETTINGS, "key": "site"}}, upsert=True)

    # Remap foto lama -> struktur folder baru (konten & fasilitas buatan admin).
    async for c in db.content.find({}, {"_id": 0, "id": 1, "image": 1}):
        if c.get("image") in LEGACY_IMAGE_MAP:
            await db.content.update_one({"id": c["id"]}, {"$set": {"image": LEGACY_IMAGE_MAP[c["image"]]}})
    async for f in db.facilities.find({}, {"_id": 0, "id": 1, "images": 1}):
        imgs = f.get("images") or []
        if any(i in LEGACY_IMAGE_MAP for i in imgs):
            await db.facilities.update_one({"id": f["id"]}, {"$set": {"images": [LEGACY_IMAGE_MAP.get(i, i) for i in imgs]}})

    # Nomor WA BPU baru untuk seluruh PIC fasilitas.
    await db.facilities.update_many({}, {"$set": {"pic_contact": WHATSAPP_BPU_DEFAULT}})

    # Fasilitas lama yang belum punya ruang -> buat satu unit "Full Building" agar tetap bisa diajukan.
    async for f in db.facilities.find({}, {"_id": 0, "id": 1, "name": 1, "code": 1, "capacity": 1}):
        if await db.spaces.count_documents({"building_id": f["id"]}) == 0:
            code = f.get("code") or slugify(f["name"])[:6].upper()
            await db.spaces.insert_one({
                "id": _id(), "building_id": f["id"], "code": f"{code}-FULL", "name": f"Seluruh {f['name']}", "group": "Sewa Full Gedung",
                "is_full_building": True, "description": "", "capacity": f.get("capacity", 0), "capacity_label": "",
                "amenities": [], "images": [], "sort_order": 0, "status": "active",
                "pricing_rule": {"mode": "confirm", "unit": "", "note": "", "options": []},
                "created_at": _iso(),
            })
    return code_to_id


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

    # ---- Catalog / migrations ----
    meta = await db.settings.find_one({"key": "seed_version"})
    current = (meta or {}).get("value", 0)
    if current < 2:
        await migrate_v2(db)
    elif current < SEED_VERSION:
        # v3: kategori unit (group), ruang terpisah GSG, teks tanpa tanda pisah
        # v4: foto Gedung C; v5: video dipindah dari GSG ke Aula Padang Harapan
        await upsert_catalog(db)
    if current < SEED_VERSION:
        await db.settings.update_one({"key": "seed_version"}, {"$set": {"value": SEED_VERSION, "at": _iso()}}, upsert=True)

    # ---- Availability (demo, hanya untuk database kosong) ----
    if await db.availability.count_documents({}) == 0:
        base = datetime.now()

        async def ref(bcode, scode):
            b = await db.facilities.find_one({"code": bcode})
            if not b:
                return None, None
            s = await db.spaces.find_one({"building_id": b["id"], "code": scode})
            return b["id"], (s or {}).get("id")

        events = [
            ("GSG", "GSG-FULL", 3, "08:00", "12:00", "internal", "Seminar Nasional Mahasiswa", "Fakultas Teknik"),
            ("GSG", "GSG-FULL", 7, "13:00", "17:00", "external", "Konferensi Pendidikan", "Dinas Pendidikan"),
            ("GLT", "GLT-RU", 2, "09:00", "15:00", "internal", "Rapat Pimpinan", "Rektorat"),
            ("GLT", "GLT-R01", 10, "08:00", "16:00", "maintenance", "Perbaikan AC", ""),
            ("APH", "APH-FULL", 5, "08:00", "12:00", "internal", "Kuliah Umum", "FMIPA"),
        ]
        for bcode, scode, offset, st, et, src, purpose, unit in events:
            fid, sid = await ref(bcode, scode)
            if not fid:
                continue
            d = (base + timedelta(days=offset)).strftime("%Y-%m-%d")
            await db.availability.insert_one({
                "id": _id(), "facility_id": fid, "space_id": sid, "date": d, "start_time": st, "end_time": et,
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

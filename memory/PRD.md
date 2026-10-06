# UNIB ONE — Product Requirements Document

## Original Problem Statement
Build "UNIB ONE" — aplikasi peminjaman gedung (facility discovery, availability & rental) untuk Universitas Bengkulu. Full-stack terintegrasi: Frontend, Backend, API, Database, Map Integration. Referensi UI: mockup user + Figma (tiger-squat-46145772.figma.site). Foto gedung asli dari zip (bukan dummy). Push ke GitHub repo user.

## Architecture
- **Frontend**: React 19 + React Router 7, Tailwind, shadcn/ui, framer-motion, recharts, @vis.gl/react-google-maps, sonner. Alias `@` -> src.
- **Backend**: FastAPI + Motor (MongoDB async). JWT auth (Bearer token, bcrypt). All routes `/api` prefixed.
- **DB**: MongoDB collections — users, facilities, availability, requests, content, login_attempts.
- **Integrations**: Google Maps JS API (key in frontend/.env), WhatsApp deep-link (wa.me), JWT custom auth.

## User Personas & Roles
- **External User** (no login): explore, cek ketersediaan, ajukan request, chat WhatsApp, lacak status.
- **Admin BPU**: kelola fasilitas, review/approve/confirm request eksternal, content/stories, availability.
- **Admin Rumah Tangga (Internal)**: block schedule internal & maintenance, kalender fasilitas.
- **Super Admin** (owner: m.yusuf.24009@student.unib.ac.id): semua akses + kelola users/roles.

## Core Requirements (static)
- Satu fasilitas → satu data → satu kalender → dua jalur pemanfaatan (internal block + external booking).
- Central availability + anti double-booking (overlap check server-side: start<end AND end>start).
- Public hanya lihat Available/Unavailable; identitas internal disembunyikan.
- External request → request_id → WhatsApp handoff → BPU confirm mengunci slot.

## Implemented (2026-06 / initial build)
- ✅ Public: Home (hero+kategori+purpose+featured+stories+CTA), Explore (search/filter/sort/sidebar), Facility Detail (galeri foto asli, fitur, aturan, availability calendar, mini map, WhatsApp, related), UNIB Map (Google Maps marker per kategori + sidebar + preview card), Discover/Stories (tabs + detail), Compare (max 3), How It Works, About BPU.
- ✅ Request Wizard 4 langkah → submit → request_id + WhatsApp CTA; Track page by request_id (timeline).
- ✅ Admin: Login (JWT), Dashboard (KPI + charts + recent), Facilities CRUD, External Requests (review/revision/approve/reject/confirm w/ slot lock), Content CMS CRUD, Internal & Block Schedule (conflict detection), Kalender Fasilitas, Users & Roles CRUD (RBAC role-gated sidebar).
- ✅ 6 fasilitas asli dari zip (GSG, GLT, Asrama Orchid, Asrama Internasional, Aula FMIPA, Kantin Perpus) dengan foto asli di /facilities/.
- ✅ 26/26 backend tests passed.

## Backlog / Remaining
- **P1**: Google Cloud billing perlu diaktifkan agar map tiles bebas watermark. Email/in-app notifications (FR-11). Package Builder (Basic/Standard/Premium) dengan estimasi harga.
- **P2**: Check-in/check-out & inspeksi pasca-pakai. Export laporan per fakultas/kategori. Audit log UI. Approval chain configurable. Saved facilities untuk user.
- **P3**: Payment gateway & invoicing, SSO UNIB, PWA mobile.

## Notes
- request_id = REQ-YYYY-NNNN (sequential). WhatsApp BPU: +6282185028768.

---

## Update 2026-10-02 — BPU UNIB (sumber: "BISMILLAH SISTEM TERBAIK.docx" + SK Tarif BLU 2026)
- **Rebrand**: nama web "BPU UNIB" (Badan Pengelola Usaha), logo `/logo.png` (+ `favicon.png`, `logo192.png`).
- **WhatsApp BPU**: 6282379869966 — disimpan di koleksi `settings` (key `site`), dapat diubah admin di menu **Pengaturan**. Tidak di-hard-code di frontend (fallback saja).
- **Hero slider**: `settings.hero_slides` [{image, caption, link}] berganti otomatis (~6 dtk), dikelola di Pengaturan.
- **Building → Space/Unit**: koleksi `spaces` (building_id, code, name, capacity, capacity_label, amenities, images, pricing_rule, is_full_building, status). Kalender & cek ketersediaan berbasis ruang. Full Building memeriksa semua child; event tanpa `space_id` = blok seluruh gedung.
- **pricing_rule**: {mode: auto|starting|confirm, unit, note, options:[{label, price, price_incl_tax, unit}]} → tampilan "RpX / unit", "RpX – RpY / unit", "Mulai dari RpX", atau "Perlu konfirmasi BPU". `price_summary` gedung dihitung backend.
- **Amenities** (fasilitas tambahan): koleksi `amenities` (building_ids kosong = semua gedung, max_qty).
- **Inquiry**: `POST /api/inquiries` → validasi ulang ketersediaan (409 bila bentrok) → `INQ-YYYY-NNNN` (counter atomik) → pesan & URL WhatsApp otomatis berdasar pilihan penyewa. Status flow: INQUIRY_CREATED → INQUIRY_SENT → PENDING_BPU_CONFIRMATION → APPROVED/REJECTED → FINAL_TARIFF_CONFIRMED → REQUIREMENTS_PENDING → PAYMENT_PENDING → PAYMENT_VERIFICATION → BOOKING_CONFIRMED (+ CANCELLED). Slot dikunci saat APPROVED, dilepas saat REJECTED/CANCELLED. Koleksi `bookings` dibuat otomatis.
- **Migrasi**: `seed_data.migrate_v2` (settings.seed_version=2) memperbarui DB lama tanpa mengganti ID gedung; slug lama disimpan di `slug_aliases`; foto dipindah ke `/facilities/<folder>/<file>.jpeg` sesuai folder "DOKUMENTASI ASET UNIB".
- **Koreksi**: GLT = Gedung Layanan Terpadu (Ruang Rapat Utama + Ruang Rapat 1–4), bukan Gedung Laboratorium Terpadu. Aula FMIPA → "Aula Padang Harapan" (tarif Gedung Pertemuan D3 Kampus Padang Harapan).
- Endpoint lama `/api/requests` tetap ada (legacy, REQ-xxxx masih bisa dilacak).

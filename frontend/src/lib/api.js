import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("unib_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Fallback only — nomor aktif selalu dibaca dari /config (dikelola admin di menu Pengaturan).
export const WA_DEFAULT = "6282379869966";

export function buildWaLink(number, message) {
  let num = (number || WA_DEFAULT).replace(/[^0-9]/g, "");
  if (num.startsWith("0")) num = `62${num.slice(1)}`;
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

/** URL media: file upload disimpan sebagai "/api/media/<id>" dan dilayani backend. */
export function mediaSrc(src) {
  if (!src) return src;
  return src.startsWith("/api/") ? `${BACKEND_URL}${src}` : src;
}

export const isVideoSrc = (src) => /\.(mp4|webm|mov)(\?|$)/i.test(src || "");

/** Upload satu file foto/video (admin). Mengembalikan { url, kind, size }. */
export async function uploadMedia(file, onProgress) {
  const body = new FormData();
  body.append("file", file);
  const res = await api.post("/uploads", body, {
    onUploadProgress: (e) => onProgress && e.total && onProgress(Math.round((e.loaded / e.total) * 100)),
  });
  return res.data;
}

let configPromise = null;
/** Konfigurasi situs (WA BPU, kontak, hero slides) — di-cache per sesi. */
export function fetchSiteConfig(force = false) {
  if (!configPromise || force) {
    configPromise = api.get("/config").then((r) => r.data).catch(() => {
      configPromise = null;
      return { site_name: "BPU UNIB", whatsapp_bpu: WA_DEFAULT, hero_slides: [] };
    });
  }
  return configPromise;
}

export function formatRupiah(n) {
  if (n === null || n === undefined || n === "") return "-";
  return `Rp${Number(n).toLocaleString("id-ID")}`;
}

/** Sama dengan price_text() di backend — dipakai untuk pratinjau di form admin. */
export function priceText(rule) {
  const r = rule || {};
  const opts = (r.options || []).filter((o) => Number(o.price) > 0).map((o) => ({ ...o, price: Number(o.price) }));
  if (r.mode === "confirm" || opts.length === 0) return "Perlu konfirmasi BPU";
  const unitOf = (o) => o.unit || r.unit || "";
  const suffix = (u) => (u ? ` / ${u}` : "");
  opts.sort((a, b) => a.price - b.price);
  const lo = opts[0], hi = opts[opts.length - 1];
  if (r.mode === "starting" || new Set(opts.map(unitOf)).size > 1) return `Mulai dari ${formatRupiah(lo.price)}${suffix(unitOf(lo))}`;
  if (lo.price === hi.price) return `${formatRupiah(lo.price)}${suffix(unitOf(lo))}`;
  return `${formatRupiah(lo.price)} s.d. ${formatRupiah(hi.price)}${suffix(unitOf(lo))}`;
}

const MONTHS_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
export function formatDateId(d) {
  if (!d) return "-";
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return d;
  return `${day} ${MONTHS_ID[m - 1]} ${y}`;
}
export const formatTimeId = (t) => (t || "").replace(":", ".");

export function todayStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

export function formatApiError(detail) {
  if (detail == null) return "Terjadi kesalahan. Silakan coba lagi.";
  if (typeof detail === "string") return detail;
  if (typeof detail === "object" && detail.message) return detail.message;
  if (Array.isArray(detail))
    return detail.map((e) => (e && e.msg ? e.msg : JSON.stringify(e))).join(" ");
  return String(detail);
}

export const CATEGORY_META = {
  Gedung: { color: "#F59E0B", icon: "Building2" },
  Ruang: { color: "#0284C7", icon: "DoorOpen" },
  Aula: { color: "#F43F5E", icon: "Theater" },
  Lapangan: { color: "#10B981", icon: "Trophy" },
  Laboratorium: { color: "#6366F1", icon: "FlaskConical" },
  Hunian: { color: "#8B5CF6", icon: "Home" },
  Lainnya: { color: "#64748B", icon: "LayoutGrid" },
};

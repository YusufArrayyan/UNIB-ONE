import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("unib_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const WA_DEFAULT = "6282185028768";

export function buildWaLink(number, message) {
  const num = (number || WA_DEFAULT).replace(/[^0-9]/g, "");
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
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

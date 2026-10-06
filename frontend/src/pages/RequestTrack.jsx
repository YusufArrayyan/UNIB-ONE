import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { api, buildWaLink, formatApiError, formatDateId, formatTimeId } from "@/lib/api";
import { useSiteConfig } from "@/hooks/useSiteConfig";

const STATUS_STYLE = {
  INQUIRY_CREATED: "bg-sky-50 text-sky-700 border-sky-200",
  INQUIRY_SENT: "bg-sky-50 text-sky-700 border-sky-200",
  PENDING_BPU_CONFIRMATION: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FINAL_TARIFF_CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REQUIREMENTS_PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PAYMENT_PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PAYMENT_VERIFICATION: "bg-indigo-50 text-indigo-700 border-indigo-200",
  BOOKING_CONFIRMED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
};

/** Normalisasi data permintaan lama (REQ-xxxx) agar tampil dengan format yang sama. */
function fromLegacy(r) {
  return {
    inquiry_code: r.request_id, building_name: r.facility_name, space_code: "", space_name: "",
    date: r.date, start_time: r.start_time, end_time: r.end_time, displayed_price: "Dikonfirmasi BPU",
    status: r.status, status_label: r.status, history: (r.history || []).map((h) => ({ ...h, label: h.status })),
  };
}

export default function RequestTrack() {
  const [params] = useSearchParams();
  const cfg = useSiteConfig();
  const [id, setId] = useState(params.get("id") || "");
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(false);

  const search = async (e, code = id) => {
    e?.preventDefault();
    const q = code.trim().toUpperCase();
    if (!q) return;
    setLoading(true);
    try {
      const res = q.startsWith("REQ-") ? fromLegacy((await api.get(`/requests/${q}`)).data) : (await api.get(`/inquiries/${q}`)).data;
      setReq(res);
    } catch (err) {
      setReq(null);
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.get("id")) search(null, params.get("id"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container-unib py-14 max-w-2xl">
      <h1 className="font-heading text-3xl font-extrabold text-slate-900">Lacak Inquiry</h1>
      <p className="text-slate-600 mt-2">Masukkan Inquiry ID untuk melihat status permintaan penyewaan fasilitas Anda.</p>
      <form onSubmit={search} className="mt-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input data-testid="track-input" value={id} onChange={(e) => setId(e.target.value.toUpperCase())} placeholder="INQ-2026-0001"
            className="w-full border border-slate-300 rounded-xl pl-12 pr-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <button data-testid="track-search" disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-6 rounded-xl transition-colors disabled:opacity-60">Lacak</button>
      </form>

      {req && (
        <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-mono font-bold text-amber-600">{req.inquiry_code}</p>
              <h2 className="font-heading text-xl font-bold text-slate-900 mt-1">{req.building_name}</h2>
              {req.space_name && <p className="text-sm text-slate-500">{req.space_name} ({req.space_code})</p>}
            </div>
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${STATUS_STYLE[req.status] || "bg-slate-100 text-slate-700 border-slate-200"}`}>{req.status_label}</span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-slate-500">Tanggal</p><p className="font-medium text-slate-900">{formatDateId(req.date)}</p></div>
            <div><p className="text-slate-500">Waktu</p><p className="font-medium text-slate-900">{formatTimeId(req.start_time)} s.d. {formatTimeId(req.end_time)}</p></div>
            <div><p className="text-slate-500">Tarif</p><p className="font-medium text-slate-900">{req.displayed_price}</p></div>
            {req.price_option && <div><p className="text-slate-500">Kategori Tarif</p><p className="font-medium text-slate-900">{req.price_option}</p></div>}
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-900 mb-3">Riwayat Status</p>
            <div className="space-y-3">
              {(req.history || []).map((h, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    {i < req.history.length - 1 && <span className="w-0.5 flex-1 bg-slate-200 my-1" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-sm font-medium text-slate-900">{h.label || h.status}</p>
                    {h.note && <p className="text-xs text-slate-500">{h.note}</p>}
                    <p className="text-[11px] text-slate-400">{new Date(h.at).toLocaleString("id-ID")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <a href={buildWaLink(cfg.whatsapp_bpu, `Halo Admin BPU UNIB, saya ingin menanyakan status Inquiry ID: ${req.inquiry_code} untuk ${req.building_name}${req.space_code ? ` (${req.space_code})` : ""}.`)}
            target="_blank" rel="noreferrer"
            className="mt-4 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
            <MessageCircle className="w-5 h-5" /> Tanya via WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}

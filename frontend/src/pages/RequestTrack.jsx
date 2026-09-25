import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { api, buildWaLink, formatApiError } from "@/lib/api";

const STATUS_STYLE = {
  request: "bg-sky-50 text-sky-700 border-sky-200",
  review: "bg-sky-50 text-sky-700 border-sky-200",
  revision: "bg-amber-50 text-amber-700 border-amber-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  confirmed: "bg-emerald-100 text-emerald-800 border-emerald-300",
  completed: "bg-slate-100 text-slate-700 border-slate-300",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

export default function RequestTrack() {
  const [params] = useSearchParams();
  const [id, setId] = useState(params.get("id") || "");
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(false);

  const search = async (e) => {
    e?.preventDefault();
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/requests/${id}`);
      setReq(res.data);
    } catch (err) {
      setReq(null);
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  if (params.get("id") && !req && !loading) search();

  return (
    <div className="container-unib py-14 max-w-2xl">
      <h1 className="font-heading text-3xl font-extrabold text-slate-900">Lacak Permintaan</h1>
      <p className="text-slate-600 mt-2">Masukkan Request ID untuk melihat status permintaan pemanfaatan fasilitas Anda.</p>
      <form onSubmit={search} className="mt-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input data-testid="track-input" value={id} onChange={(e) => setId(e.target.value.toUpperCase())} placeholder="REQ-2026-0001"
            className="w-full border border-slate-300 rounded-xl pl-12 pr-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <button data-testid="track-search" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-6 rounded-xl transition-colors">Lacak</button>
      </form>

      {req && (
        <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-mono font-bold text-amber-600">{req.request_id}</p>
              <h2 className="font-heading text-xl font-bold text-slate-900 mt-1">{req.facility_name}</h2>
            </div>
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold border capitalize ${STATUS_STYLE[req.status] || STATUS_STYLE.request}`}>{req.status}</span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-slate-500">Tanggal</p><p className="font-medium text-slate-900">{req.date}</p></div>
            <div><p className="text-slate-500">Waktu</p><p className="font-medium text-slate-900">{req.start_time} - {req.end_time}</p></div>
            <div><p className="text-slate-500">Kegiatan</p><p className="font-medium text-slate-900">{req.activity_type}</p></div>
            <div><p className="text-slate-500">Peserta</p><p className="font-medium text-slate-900">{req.participants || "-"}</p></div>
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
                    <p className="text-sm font-medium text-slate-900 capitalize">{h.status}</p>
                    {h.note && <p className="text-xs text-slate-500">{h.note}</p>}
                    <p className="text-[11px] text-slate-400">{new Date(h.at).toLocaleString("id-ID")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <a href={buildWaLink("6282185028768", `Halo Admin BPU UNIB, saya ingin menanyakan status Request ID: ${req.request_id} untuk ${req.facility_name}.`)}
            target="_blank" rel="noreferrer"
            className="mt-4 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
            <MessageCircle className="w-5 h-5" /> Tanya via WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}

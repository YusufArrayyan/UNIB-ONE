import { useEffect, useState } from "react";
import { Check, X, RotateCcw, MessageCircle, CheckCircle2, Inbox } from "lucide-react";
import { toast } from "sonner";
import { api, buildWaLink, formatApiError } from "@/lib/api";

const TABS = ["all", "request", "review", "revision", "approved", "confirmed", "rejected"];
const STATUS_STYLE = {
  request: "bg-sky-100 text-sky-700", review: "bg-sky-100 text-sky-700",
  revision: "bg-amber-100 text-amber-700", rejected: "bg-rose-100 text-rose-700",
  approved: "bg-emerald-100 text-emerald-700", confirmed: "bg-emerald-100 text-emerald-800",
  completed: "bg-slate-100 text-slate-600", cancelled: "bg-slate-100 text-slate-500",
};

export default function AdminRequests() {
  const [tab, setTab] = useState("all");
  const [list, setList] = useState([]);
  const [active, setActive] = useState(null);

  const load = () => api.get("/requests", { params: tab === "all" ? {} : { status: tab } }).then((r) => setList(r.data));
  useEffect(() => { load(); }, [tab]);

  const act = async (id, status, note = "") => {
    try {
      const res = await api.patch(`/requests/${id}/status`, { status, note });
      toast.success(`Status diubah ke ${status}`);
      if (active) setActive(res.data);
      load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-slate-900">External Requests</h1>
      <p className="text-slate-500 text-sm mt-1">Tinjau, setujui, tolak, atau konfirmasi permintaan pemanfaatan eksternal.</p>

      <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} data-testid={`req-tab-${t}`}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize whitespace-nowrap border ${tab === t ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-amber-400"}`}>{t === "all" ? "Semua" : t}</button>
        ))}
      </div>

      <div className="mt-6 bg-white border border-slate-200 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400 border-b border-slate-100">
            <th className="p-4 font-medium">ID</th><th className="p-4 font-medium">Fasilitas</th><th className="p-4 font-medium">Pemohon</th><th className="p-4 font-medium">Jadwal</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium">Aksi</th>
          </tr></thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-400"><Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />Belum ada permintaan.</td></tr>
            ) : list.map((r) => (
              <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer" onClick={() => setActive(r)}>
                <td className="p-4 font-mono text-amber-600 font-semibold">{r.request_id}</td>
                <td className="p-4 text-slate-700">{r.facility_name}</td>
                <td className="p-4 text-slate-600">{r.name}</td>
                <td className="p-4 text-slate-600">{r.date}<br /><span className="text-xs text-slate-400">{r.start_time}-{r.end_time}</span></td>
                <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLE[r.status]}`}>{r.status}</span></td>
                <td className="p-4"><button className="text-amber-600 font-semibold text-sm">Detail</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {active && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setActive(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div><p className="font-mono text-amber-600 font-bold">{active.request_id}</p><h3 className="font-heading font-bold text-lg">{active.facility_name}</h3></div>
              <button onClick={() => setActive(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold capitalize ${STATUS_STYLE[active.status]}`}>{active.status}</span>
              {!active.slot_available && <p className="text-sm bg-rose-50 text-rose-700 p-3 rounded-lg">⚠ Slot mungkin bentrok — periksa kalender sebelum konfirmasi.</p>}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[["Pemohon", active.name], ["Email", active.email], ["WhatsApp", active.whatsapp], ["Organisasi", active.organization || "-"], ["Tujuan", active.purpose], ["Kegiatan", active.activity_type], ["Tanggal", active.date], ["Waktu", `${active.start_time}-${active.end_time}`], ["Peserta", active.participants || "-"], ["Layanan", (active.services || []).join(", ") || "-"]].map(([k, v]) => (
                  <div key={k}><p className="text-slate-400">{k}</p><p className="font-medium text-slate-800">{v}</p></div>
                ))}
              </div>
              {active.description && <div><p className="text-slate-400 text-sm">Deskripsi</p><p className="text-sm text-slate-700">{active.description}</p></div>}

              <a href={buildWaLink(active.whatsapp, `Halo ${active.name}, terkait permintaan ${active.request_id} untuk ${active.facility_name}...`)} target="_blank" rel="noreferrer"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2"><MessageCircle className="w-4 h-4" /> Hubungi Pemohon</a>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button data-testid="req-action-review" onClick={() => act(active.id, "review", "Sedang ditinjau BPU")} className="border border-sky-200 text-sky-700 rounded-lg py-2.5 text-sm font-semibold hover:bg-sky-50">Tinjau</button>
                <button data-testid="req-action-revision" onClick={() => act(active.id, "revision", "Perlu revisi data")} className="border border-amber-200 text-amber-700 rounded-lg py-2.5 text-sm font-semibold hover:bg-amber-50 flex items-center justify-center gap-1"><RotateCcw className="w-4 h-4" /> Minta Revisi</button>
                <button data-testid="req-action-approve" onClick={() => act(active.id, "approved", "Permintaan disetujui")} className="border border-emerald-200 text-emerald-700 rounded-lg py-2.5 text-sm font-semibold hover:bg-emerald-50 flex items-center justify-center gap-1"><Check className="w-4 h-4" /> Setujui</button>
                <button data-testid="req-action-reject" onClick={() => act(active.id, "rejected", "Permintaan ditolak")} className="border border-rose-200 text-rose-700 rounded-lg py-2.5 text-sm font-semibold hover:bg-rose-50 flex items-center justify-center gap-1"><X className="w-4 h-4" /> Tolak</button>
              </div>
              <button data-testid="req-action-confirm" onClick={() => act(active.id, "confirmed", "Booking dikonfirmasi & slot dikunci")} className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-3 text-sm font-semibold flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Konfirmasi Booking (Kunci Slot)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

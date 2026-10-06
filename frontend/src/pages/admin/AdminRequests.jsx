import { useEffect, useState } from "react";
import { X, MessageCircle, Inbox, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { api, buildWaLink, formatApiError, formatDateId, formatTimeId, formatRupiah } from "@/lib/api";

export const INQUIRY_STYLE = {
  INQUIRY_CREATED: "bg-sky-100 text-sky-700", INQUIRY_SENT: "bg-sky-100 text-sky-700",
  PENDING_BPU_CONFIRMATION: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700", FINAL_TARIFF_CONFIRMED: "bg-emerald-100 text-emerald-700",
  REQUIREMENTS_PENDING: "bg-amber-100 text-amber-700", PAYMENT_PENDING: "bg-amber-100 text-amber-700",
  PAYMENT_VERIFICATION: "bg-indigo-100 text-indigo-700", BOOKING_CONFIRMED: "bg-emerald-200 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-700", CANCELLED: "bg-slate-200 text-slate-600",
};

const TABS = [
  { key: "all", label: "Semua" },
  { key: "INQUIRY_CREATED,INQUIRY_SENT", label: "Inquiry Baru" },
  { key: "PENDING_BPU_CONFIRMATION", label: "Menunggu Konfirmasi" },
  { key: "APPROVED,FINAL_TARIFF_CONFIRMED,REQUIREMENTS_PENDING,PAYMENT_PENDING,PAYMENT_VERIFICATION", label: "Disetujui / Proses" },
  { key: "BOOKING_CONFIRMED", label: "Booking Terkonfirmasi" },
  { key: "REJECTED,CANCELLED", label: "Ditolak / Batal" },
];
const DANGER = ["REJECTED", "CANCELLED"];

export default function AdminRequests() {
  const [tab, setTab] = useState("all");
  const [list, setList] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [active, setActive] = useState(null);
  const [note, setNote] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/inquiries", { params: tab === "all" ? {} : { status: tab } }).then((r) => setList(r.data));
  useEffect(() => { load(); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { api.get("/inquiry-statuses").then((r) => setStatuses(Object.fromEntries(r.data.map((s) => [s.key, s])))); }, []);

  const openDetail = (r) => { setActive(r); setNote(""); setFinalPrice(r.final_price || ""); };

  const act = async (status) => {
    if (DANGER.includes(status) && !window.confirm(`Ubah status ke "${statuses[status]?.label}"? Slot yang terkunci akan dilepas.`)) return;
    setBusy(true);
    try {
      const res = await api.patch(`/inquiries/${active.id}/status`, { status, note, final_price: finalPrice ? parseInt(finalPrice, 10) : null });
      toast.success(`Status: ${res.data.status_label}`);
      openDetail(res.data);
      load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  const next = active ? (statuses[active.status]?.next || []) : [];
  const inputCls = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500";

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-slate-900">Inquiry Management</h1>
      <p className="text-slate-500 text-sm mt-1">Proses permintaan penyewaan: konfirmasi ketersediaan, tarif final, persyaratan, dan pembayaran. Slot dikunci saat inquiry disetujui.</p>

      <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} data-testid={`req-tab-${t.label.toLowerCase().replace(/\W+/g, "-")}`}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border ${tab === t.key ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-amber-400"}`}>{t.label}</button>
        ))}
      </div>

      <div className="mt-6 bg-white border border-slate-200 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400 border-b border-slate-100">
            <th className="p-4 font-medium">Inquiry ID</th><th className="p-4 font-medium">Gedung / Ruang</th><th className="p-4 font-medium">Pemohon</th><th className="p-4 font-medium">Jadwal</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium" />
          </tr></thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-400"><Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />Belum ada inquiry.</td></tr>
            ) : list.map((r) => (
              <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer" onClick={() => openDetail(r)}>
                <td className="p-4 font-mono text-amber-600 font-semibold whitespace-nowrap">{r.inquiry_code}</td>
                <td className="p-4 text-slate-700">{r.building_name}<br /><span className="text-xs text-slate-400">{r.space_name} ({r.space_code})</span></td>
                <td className="p-4 text-slate-600">{r.name}{r.organization && <span className="block text-xs text-slate-400">{r.organization}</span>}</td>
                <td className="p-4 text-slate-600 whitespace-nowrap">{formatDateId(r.date)}<br /><span className="text-xs text-slate-400">{formatTimeId(r.start_time)} s.d. {formatTimeId(r.end_time)}</span></td>
                <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${INQUIRY_STYLE[r.status]}`}>{r.status_label}</span></td>
                <td className="p-4"><button className="text-amber-600 font-semibold text-sm">Detail</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {active && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setActive(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white">
              <div><p className="font-mono text-amber-600 font-bold">{active.inquiry_code}</p><h3 className="font-heading font-bold text-lg">{active.building_name} · {active.space_code}</h3></div>
              <button onClick={() => setActive(null)} aria-label="Tutup"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-5">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${INQUIRY_STYLE[active.status]}`}>{active.status_label}</span>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Unit", `${active.space_name} (${active.space_code})`], ["Tanggal", formatDateId(active.date)],
                  ["Waktu", `${formatTimeId(active.start_time)} s.d. ${formatTimeId(active.end_time)}`], ["Tarif Ditampilkan", active.displayed_price],
                  ["Tarif Final", active.final_price ? formatRupiah(active.final_price) : "Belum ditetapkan"],
                  ["Pemohon", active.name], ["WhatsApp", active.whatsapp], ["Email", active.email || "Tidak diisi"], ["Organisasi", active.organization || "Tidak diisi"],
                  ["Kegiatan", [active.activity_type, active.purpose].filter(Boolean).join(", ") || "Tidak diisi"], ["Peserta", active.participants ? `${active.participants} orang` : "Tidak diisi"],
                ].map(([k, v]) => (
                  <div key={k}><p className="text-slate-400">{k}</p><p className="font-medium text-slate-800">{v}</p></div>
                ))}
              </div>
              {active.selected_amenities?.length > 0 && (
                <div className="text-sm"><p className="text-slate-400 mb-1">Fasilitas Tambahan</p>
                  <ul className="space-y-1">{active.selected_amenities.map((a) => <li key={a.amenity_id} className="text-slate-800">• {a.name} ×{a.qty} <span className="text-slate-400 text-xs">({a.price_information || (a.price ? `${formatRupiah(a.price)} / ${a.unit}` : "konfirmasi")})</span></li>)}</ul>
                </div>
              )}
              {active.notes && <div className="text-sm"><p className="text-slate-400">Catatan</p><p className="text-slate-700">{active.notes}</p></div>}

              <a href={buildWaLink(active.whatsapp, `Halo ${active.name}, terkait Inquiry ${active.inquiry_code} (${active.building_name}, ${active.space_name}, ${formatDateId(active.date)} pukul ${formatTimeId(active.start_time)} s.d. ${formatTimeId(active.end_time)}): `)} target="_blank" rel="noreferrer"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2"><MessageCircle className="w-4 h-4" /> Hubungi Pemohon</a>

              {next.length > 0 ? (
                <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
                  <p className="font-heading font-semibold text-slate-900">Ubah Status</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className="text-xs font-medium text-slate-500">Catatan (opsional, tampil di halaman lacak)</label><input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} /></div>
                    <div><label className="text-xs font-medium text-slate-500">Tarif Final (Rp)</label><input type="number" className={inputCls} value={finalPrice} onChange={(e) => setFinalPrice(e.target.value)} placeholder="Wajib saat konfirmasi tarif final" /></div>
                  </div>
                  {["APPROVED"].some((s) => next.includes(s)) && <p className="text-xs text-amber-700 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Menyetujui akan mengunci slot ruang di kalender (ditolak otomatis bila bentrok).</p>}
                  <div className="flex flex-wrap gap-2">
                    {next.map((s) => (
                      <button key={s} disabled={busy} onClick={() => act(s)} data-testid={`inq-action-${s}`}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold border disabled:opacity-50 ${DANGER.includes(s) ? "border-rose-200 text-rose-700 hover:bg-rose-50" : "border-slate-900 bg-slate-900 text-white hover:bg-slate-800"}`}>
                        {statuses[s]?.label || s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : <p className="text-sm text-slate-500">Status akhir, tidak ada aksi lanjutan.</p>}

              <div>
                <p className="text-sm font-semibold text-slate-900 mb-2">Riwayat</p>
                <ul className="space-y-1.5 text-xs">
                  {(active.history || []).map((h, i) => (
                    <li key={i} className="flex gap-2"><span className="text-slate-400 whitespace-nowrap">{new Date(h.at).toLocaleString("id-ID")}</span><span className="text-slate-800 font-medium">{h.label}</span>{h.note && <span className="text-slate-500">· {h.note}</span>}{h.by && <span className="text-slate-400">({h.by})</span>}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

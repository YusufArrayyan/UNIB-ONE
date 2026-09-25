import { useEffect, useState } from "react";
import { CalendarClock, ShieldBan, Wrench, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";

export default function AdminSchedule() {
  const [facilities, setFacilities] = useState([]);
  const [events, setEvents] = useState([]);
  const [conflict, setConflict] = useState(null);
  const [form, setForm] = useState({
    facility_id: "", date: "", start_time: "08:00", end_time: "12:00",
    source: "internal", purpose: "", unit: "", notes: "",
  });

  const load = () => api.get("/availability").then((r) => setEvents(r.data.sort((a, b) => b.date.localeCompare(a.date))));
  useEffect(() => {
    api.get("/facilities").then((r) => { setFacilities(r.data); setForm((f) => ({ ...f, facility_id: r.data[0]?.id || "" })); });
    load();
  }, []);
  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const facName = (id) => facilities.find((f) => f.id === id)?.name || "-";

  const submit = async () => {
    setConflict(null);
    if (!form.facility_id || !form.date) { toast.error("Lengkapi fasilitas & tanggal"); return; }
    try {
      await api.post("/availability", form);
      toast.success(form.source === "maintenance" ? "Jadwal pemeliharaan ditambahkan" : "Jadwal berhasil diblokir");
      setForm((f) => ({ ...f, purpose: "", unit: "", notes: "" })); load();
    } catch (e) {
      const detail = e.response?.data?.detail;
      if (detail?.conflicts) { setConflict(detail.conflicts); toast.error("Jadwal bentrok!"); }
      else toast.error(formatApiError(detail));
    }
  };

  const del = async (id) => { await api.delete(`/availability/${id}`); toast.success("Jadwal dibatalkan"); load(); };
  const inputCls = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500";
  const SRC_STYLE = { internal: "bg-indigo-100 text-indigo-700", external: "bg-amber-100 text-amber-700", maintenance: "bg-rose-100 text-rose-700" };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-slate-900">Internal Use & Block Schedule</h1>
      <p className="text-slate-500 text-sm mt-1">Catat penggunaan internal atau pemeliharaan. Slot otomatis menjadi Tidak Tersedia untuk publik.</p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 h-fit">
          <div className="flex items-center gap-2 font-heading font-semibold text-slate-900 mb-4"><ShieldBan className="w-5 h-5 text-amber-600" /> Block Facility</div>
          <div className="space-y-3">
            <div><label className="text-sm font-medium text-slate-700">Jenis</label>
              <select data-testid="block-source" className={inputCls} value={form.source} onChange={(e) => set("source", e.target.value)}>
                <option value="internal">Penggunaan Internal</option>
                <option value="maintenance">Pemeliharaan</option>
              </select></div>
            <div><label className="text-sm font-medium text-slate-700">Fasilitas</label>
              <select data-testid="block-facility" className={inputCls} value={form.facility_id} onChange={(e) => set("facility_id", e.target.value)}>
                {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select></div>
            <div><label className="text-sm font-medium text-slate-700">Tanggal</label><input data-testid="block-date" type="date" className={inputCls} value={form.date} onChange={(e) => set("date", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium text-slate-700">Mulai</label><input type="time" className={inputCls} value={form.start_time} onChange={(e) => set("start_time", e.target.value)} /></div>
              <div><label className="text-sm font-medium text-slate-700">Selesai</label><input type="time" className={inputCls} value={form.end_time} onChange={(e) => set("end_time", e.target.value)} /></div>
            </div>
            {form.source === "internal" ? (
              <>
                <div><label className="text-sm font-medium text-slate-700">Tujuan Kegiatan</label><input className={inputCls} value={form.purpose} onChange={(e) => set("purpose", e.target.value)} placeholder="Seminar Mahasiswa" /></div>
                <div><label className="text-sm font-medium text-slate-700">Unit / Peminjam</label><input className={inputCls} value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="Fakultas Teknik" /></div>
              </>
            ) : (
              <div><label className="text-sm font-medium text-slate-700">Alasan / Keterangan</label><input className={inputCls} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Perbaikan AC" /></div>
            )}

            {conflict && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700">
                <p className="flex items-center gap-1.5 font-semibold"><AlertTriangle className="w-4 h-4" /> Jadwal Bentrok</p>
                {conflict.map((c) => <p key={c.id} className="mt-1 text-xs">{c.date} {c.start_time}-{c.end_time} ({c.source})</p>)}
              </div>
            )}

            <button data-testid="block-submit" onClick={submit} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold py-3 rounded-lg flex items-center justify-center gap-2">
              {form.source === "maintenance" ? <Wrench className="w-4 h-4" /> : <CalendarClock className="w-4 h-4" />} Block Schedule
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-100 font-heading font-semibold text-slate-900">Jadwal Terblokir ({events.length})</div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white"><tr className="text-left text-slate-400 border-b border-slate-100">
                <th className="p-4 font-medium">Fasilitas</th><th className="p-4 font-medium">Tanggal</th><th className="p-4 font-medium">Waktu</th><th className="p-4 font-medium">Jenis</th><th className="p-4 font-medium">Keterangan</th><th className="p-4"></th>
              </tr></thead>
              <tbody>
                {events.length === 0 ? <tr><td colSpan={6} className="py-10 text-center text-slate-400">Belum ada jadwal terblokir.</td></tr> : events.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50">
                    <td className="p-4 text-slate-700">{facName(e.facility_id)}</td>
                    <td className="p-4 text-slate-600">{e.date}</td>
                    <td className="p-4 text-slate-600">{e.start_time}-{e.end_time}</td>
                    <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${SRC_STYLE[e.source]}`}>{e.source}</span></td>
                    <td className="p-4 text-slate-500 text-xs">{e.purpose || e.notes || "-"}{e.unit && <span className="block">{e.unit}</span>}</td>
                    <td className="p-4"><button onClick={() => del(e.id)} className="text-rose-500 hover:text-rose-700"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

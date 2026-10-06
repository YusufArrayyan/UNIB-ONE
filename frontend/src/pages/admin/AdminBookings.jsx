import { useEffect, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { api, formatDateId, formatTimeId, formatRupiah } from "@/lib/api";

const TABS = [
  { key: "confirmed", label: "Terkonfirmasi" },
  { key: "pending", label: "Dalam Proses" },
  { key: "cancelled", label: "Dibatalkan" },
  { key: "all", label: "Semua" },
];
const STYLE = { confirmed: "bg-emerald-100 text-emerald-800", pending: "bg-amber-100 text-amber-700", cancelled: "bg-slate-200 text-slate-600" };
const LABEL = { confirmed: "Terkonfirmasi", pending: "Dalam Proses", cancelled: "Dibatalkan" };

export default function AdminBookings() {
  const [tab, setTab] = useState("confirmed");
  const [list, setList] = useState([]);
  useEffect(() => { api.get("/bookings", { params: { status: tab } }).then((r) => setList(r.data)); }, [tab]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-slate-900">Booking Management</h1>
      <p className="text-slate-500 text-sm mt-1">Booking dibuat otomatis saat inquiry disetujui, dan menjadi terkonfirmasi setelah pembayaran diverifikasi.</p>

      <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border ${tab === t.key ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-amber-400"}`}>{t.label}</button>
        ))}
      </div>

      <div className="mt-6 bg-white border border-slate-200 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400 border-b border-slate-100">
            <th className="p-4 font-medium">Tanggal</th><th className="p-4 font-medium">Gedung / Ruang</th><th className="p-4 font-medium">Penyewa</th><th className="p-4 font-medium">Inquiry</th><th className="p-4 font-medium text-right">Tarif Final</th><th className="p-4 font-medium">Status</th>
          </tr></thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-400"><CalendarCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />Belum ada booking.</td></tr>
            ) : list.map((b) => (
              <tr key={b.id} className="border-b border-slate-50">
                <td className="p-4 text-slate-700 whitespace-nowrap">{formatDateId(b.confirmed_date)}<br /><span className="text-xs text-slate-400">{formatTimeId(b.start_time)} s.d. {formatTimeId(b.end_time)}</span></td>
                <td className="p-4 text-slate-700">{b.building_name}<br /><span className="text-xs text-slate-400">{b.space_name} ({b.space_code})</span></td>
                <td className="p-4 text-slate-600">{b.name}{b.organization && <span className="block text-xs text-slate-400">{b.organization}</span>}</td>
                <td className="p-4 font-mono text-amber-600 font-semibold">{b.inquiry_code}</td>
                <td className="p-4 text-right text-slate-800 whitespace-nowrap">{b.final_price ? formatRupiah(b.final_price) : "Belum ditetapkan"}</td>
                <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STYLE[b.status]}`}>{LABEL[b.status] || b.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

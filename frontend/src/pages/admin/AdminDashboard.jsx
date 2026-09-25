import { useEffect, useState } from "react";
import { Building2, CalendarCheck, Inbox, CheckCircle2, Wrench, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";

const STATUS_STYLE = {
  request: "bg-sky-100 text-sky-700", review: "bg-sky-100 text-sky-700",
  revision: "bg-amber-100 text-amber-700", rejected: "bg-rose-100 text-rose-700",
  approved: "bg-emerald-100 text-emerald-700", confirmed: "bg-emerald-100 text-emerald-800",
  completed: "bg-slate-100 text-slate-600", cancelled: "bg-slate-100 text-slate-500",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get("/admin/stats").then((r) => setStats(r.data)); }, []);
  if (!stats) return <p className="text-slate-400">Memuat dashboard...</p>;

  const kpis = [
    { label: "Total Fasilitas", value: stats.total_all_facilities, Icon: Building2, color: "bg-amber-500" },
    { label: "Tersedia Hari Ini", value: stats.available_today, Icon: CheckCircle2, color: "bg-emerald-500" },
    { label: "Permintaan Baru", value: stats.new_requests, Icon: Inbox, color: "bg-sky-500" },
    { label: "Booking Terkonfirmasi", value: stats.confirmed_bookings, Icon: CalendarCheck, color: "bg-indigo-500" },
    { label: "Dalam Perbaikan", value: stats.maintenance, Icon: Wrench, color: "bg-rose-500" },
    { label: "Internal Hari Ini", value: stats.internal_today, Icon: TrendingUp, color: "bg-slate-700" },
  ];
  const pieData = [
    { name: "Internal", value: stats.utilization.internal, color: "#6366F1" },
    { name: "Eksternal", value: stats.utilization.external, color: "#F59E0B" },
    { name: "Pemeliharaan", value: stats.utilization.maintenance, color: "#EF4444" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Ringkasan pengelolaan fasilitas UNIB ONE.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map(({ label, value, Icon, color }) => (
          <div key={label} data-testid={`kpi-${label}`} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}><Icon className="w-5 h-5 text-white" /></span>
            <p className="mt-3 font-heading text-3xl font-extrabold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-heading font-semibold text-slate-900 mb-4">Penggunaan Fasilitas (7 Hari)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.weekly_usage}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#F59E0B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-heading font-semibold text-slate-900 mb-4">Distribusi Penggunaan</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                {pieData.map((e) => <Cell key={e.name} fill={e.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map((e) => <span key={e.name} className="flex items-center gap-1.5 text-xs text-slate-600"><span className="w-2.5 h-2.5 rounded-full" style={{ background: e.color }} /> {e.name}</span>)}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-slate-900">Permintaan Terbaru</h3>
          <Link to="/admin/requests" className="text-sm font-semibold text-amber-600 hover:text-amber-700">Lihat Semua</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="pb-3 font-medium">Request ID</th><th className="pb-3 font-medium">Fasilitas</th><th className="pb-3 font-medium">Pemohon</th><th className="pb-3 font-medium">Tanggal</th><th className="pb-3 font-medium">Status</th>
            </tr></thead>
            <tbody>
              {stats.recent_requests.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400">Belum ada permintaan.</td></tr>
              ) : stats.recent_requests.map((r) => (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="py-3 font-mono text-amber-600 font-semibold">{r.request_id}</td>
                  <td className="py-3 text-slate-700">{r.facility_name}</td>
                  <td className="py-3 text-slate-600">{r.name}</td>
                  <td className="py-3 text-slate-600">{r.date}</td>
                  <td className="py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLE[r.status] || STATUS_STYLE.request}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

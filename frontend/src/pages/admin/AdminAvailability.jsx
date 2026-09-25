import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";

export default function AdminAvailability() {
  const [facilities, setFacilities] = useState([]);
  const [facilityId, setFacilityId] = useState("");
  const [events, setEvents] = useState([]);

  useEffect(() => {
    api.get("/facilities").then((r) => { setFacilities(r.data); setFacilityId(r.data[0]?.id || ""); });
  }, []);
  useEffect(() => {
    if (facilityId) api.get("/availability", { params: { facility_id: facilityId } }).then((r) => setEvents(r.data));
  }, [facilityId]);

  const dayEvents = events.slice().sort((a, b) => a.date.localeCompare(b.date));
  const SRC_STYLE = { internal: "bg-indigo-100 text-indigo-700", external: "bg-amber-100 text-amber-700", maintenance: "bg-rose-100 text-rose-700" };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-slate-900">Kalender Fasilitas</h1>
      <p className="text-slate-500 text-sm mt-1">Kalender ketersediaan terintegrasi — internal, eksternal, dan pemeliharaan dalam satu tampilan.</p>

      <div className="mt-5 max-w-sm">
        <select data-testid="avail-facility" className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500" value={facilityId} onChange={(e) => setFacilityId(e.target.value)}>
          {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <AvailabilityCalendar events={events} publicView={false} />
        <div className="bg-white border border-slate-200 rounded-2xl p-5 h-fit">
          <h3 className="font-heading font-semibold text-slate-900 mb-3">Jadwal Mendatang</h3>
          <div className="space-y-2 max-h-[420px] overflow-y-auto no-scrollbar">
            {dayEvents.length === 0 ? <p className="text-sm text-slate-400 py-4 text-center">Tidak ada jadwal.</p> : dayEvents.map((e) => (
              <div key={e.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800">{e.date}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${SRC_STYLE[e.source]}`}>{e.source}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{e.start_time}-{e.end_time} · {e.purpose || e.notes || "-"}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { CalendarCheck, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { api, formatApiError, formatDateId, formatTimeId } from "@/lib/api";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { DaySchedule } from "@/components/DaySchedule";

/**
 * Cek ketersediaan untuk SATU ruang/unit. Kalender otomatis berpindah ke jadwal
 * ruang yang dipilih (bukan jadwal gedung secara keseluruhan).
 *
 * value: { date, start_time, end_time }  onChange(next)  result/onResult: hasil /availability/check
 */
export function SpaceAvailability({ facility, space, value, onChange, result, onResult, children }) {
  const [events, setEvents] = useState([]);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!facility?.id || !space?.id) { setEvents([]); return; }
    api.get(`/facilities/${facility.id}/availability`, { params: { space_id: space.id } }).then((r) => setEvents(r.data));
  }, [facility?.id, space?.id]);

  const update = (patch) => { setError(""); onResult(null); onChange({ ...value, ...patch }); };

  const check = async () => {
    if (!value.date || !value.start_time || !value.end_time) { setError("Pilih tanggal dan waktu terlebih dahulu."); return; }
    if (value.start_time >= value.end_time) { setError("Waktu selesai harus setelah waktu mulai."); return; }
    setChecking(true); setError("");
    try {
      const r = await api.post("/availability/check", { facility_id: facility.id, space_id: space.id, ...value });
      onResult({ ...r.data, key: JSON.stringify({ s: space.id, ...value }) });
    } catch (e) {
      setError(formatApiError(e.response?.data?.detail));
    } finally {
      setChecking(false);
    }
  };

  const dayEvents = events.filter((e) => e.date === value.date);
  const inputCls = "w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500";

  if (!space) return <p className="text-sm text-slate-500 bg-white border border-dashed border-slate-300 rounded-[14px] p-6 text-center">Pilih ruang/unit terlebih dahulu untuk melihat kalender.</p>;

  return (
    <div className="space-y-4" data-testid="space-availability">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 items-start">
        <AvailabilityCalendar events={events} publicView selectedDate={value.date} onSelectDate={(d) => update({ date: d })} />
        {value.date
          ? <DaySchedule date={value.date} spaceLabel={space.name} events={dayEvents} operatingHours={facility.operating_hours}
              onPickFree={(start, end) => update({ start_time: start, end_time: end })} />
          : <div className="bg-slate-50 border border-dashed border-slate-300 rounded-[14px] p-5 text-sm text-slate-500">Pilih tanggal pada kalender untuk melihat jadwal harian <b>{space.name}</b>.</div>}
      </div>

      <div className="bg-white border border-slate-200 rounded-[14px] p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 2xl:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
          <div><label className="text-xs font-semibold text-slate-500">Tanggal</label>
            <input data-testid="avail-date" type="date" className={inputCls} value={value.date} onChange={(e) => update({ date: e.target.value })} /></div>
          <div><label className="text-xs font-semibold text-slate-500">Mulai</label>
            <input data-testid="avail-start" type="time" className={inputCls} value={value.start_time} onChange={(e) => update({ start_time: e.target.value })} /></div>
          <div><label className="text-xs font-semibold text-slate-500">Selesai</label>
            <input data-testid="avail-end" type="time" className={inputCls} value={value.end_time} onChange={(e) => update({ end_time: e.target.value })} /></div>
          <button data-testid="avail-check" onClick={check} disabled={checking}
            className="sm:col-span-3 2xl:col-span-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 h-11 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60 whitespace-nowrap">
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarCheck className="w-4 h-4" />} Cek Ketersediaan
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      </div>

      {result && (
        <div data-testid="avail-result" className={`rounded-[14px] border p-5 ${result.available ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
          <p className="text-sm text-slate-600">{space.name} · {formatDateId(value.date)} · {formatTimeId(value.start_time)} s.d. {formatTimeId(value.end_time)}</p>
          <p className={`mt-1 font-heading text-lg font-bold flex items-center gap-2 ${result.available ? "text-emerald-700" : "text-rose-700"}`}>
            {result.available ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            {result.available ? "Tersedia" : "Tidak Tersedia"}
          </p>
          <p className="text-sm text-slate-600 mt-1">
            {result.available ? "Ruang tersedia pada waktu yang dipilih." : `Bentrok dengan jadwal ${result.conflicts.map((c) => `${formatTimeId(c.start_time)} s.d. ${formatTimeId(c.end_time)}`).join(", ")}. Silakan pilih waktu atau ruang lain.`}
          </p>
          {result.available && children}
        </div>
      )}
    </div>
  );
}

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function ymd(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * events: [{date, start_time, end_time, source}]
 * onSelectDate: optional (dateStr) => void
 */
export function AvailabilityCalendar({ events = [], onSelectDate, selectedDate, publicView = true }) {
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });

  const dayMap = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [events]);

  const firstDay = new Date(cursor.y, cursor.m, 1).getDay();
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const todayStr = ymd(now.getFullYear(), now.getMonth(), now.getDate());

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const move = (dir) => {
    let m = cursor.m + dir, y = cursor.y;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setCursor({ y, m });
  };

  const stateFor = (dstr) => {
    const evs = dayMap[dstr];
    if (!evs || evs.length === 0) return "available";
    if (evs.some((e) => e.source === "maintenance")) return "maintenance";
    if (publicView) return "unavailable";
    if (evs.some((e) => e.source === "external")) return "external";
    return "internal";
  };

  const STATE_CLS = {
    available: "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100",
    unavailable: "bg-amber-50 border-amber-200 text-amber-800",
    external: "bg-amber-50 border-amber-200 text-amber-800",
    internal: "bg-indigo-50 border-indigo-200 text-indigo-800",
    maintenance: "bg-rose-50 border-rose-200 text-rose-800",
    empty: "border-transparent",
  };

  return (
    <div data-testid="availability-calendar" className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <button data-testid="cal-prev" onClick={() => move(-1)} className="p-2 rounded-lg hover:bg-slate-100"><ChevronLeft className="w-5 h-5" /></button>
        <h4 className="font-heading font-semibold text-slate-900">{MONTHS[cursor.m]} {cursor.y}</h4>
        <button data-testid="cal-next" onClick={() => move(1)} className="p-2 rounded-lg hover:bg-slate-100"><ChevronRight className="w-5 h-5" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {DAYS.map((d) => <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const dstr = ymd(cursor.y, cursor.m, d);
          const isPast = dstr < todayStr;
          const st = stateFor(dstr);
          const selectable = onSelectDate && st === "available" && !isPast;
          const isSel = selectedDate === dstr;
          return (
            <button key={i} disabled={!selectable}
              data-testid={`cal-day-${dstr}`}
              onClick={() => selectable && onSelectDate(dstr)}
              className={`h-11 rounded-lg border flex items-center justify-center text-sm font-medium transition-all relative
                ${isPast ? "opacity-40 bg-slate-50 border-slate-100 text-slate-400" : STATE_CLS[st]}
                ${selectable ? "cursor-pointer hover:scale-105" : "cursor-default"}
                ${isSel ? "ring-2 ring-amber-500 ring-offset-1" : ""}`}>
              {d}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium pt-4 mt-4 border-t border-slate-100">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-400" /> Tersedia</span>
        {publicView
          ? <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400" /> Tidak Tersedia</span>
          : <>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-400" /> Internal</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400" /> Eksternal</span>
            </>}
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-400" /> Pemeliharaan</span>
      </div>
    </div>
  );
}

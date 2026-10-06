import { formatDateId, formatTimeId } from "@/lib/api";

/** "08.00 - 21.00" -> ["08:00","21:00"]; "24 Jam" atau tidak terbaca -> 00:00 s.d. 24:00 */
export function parseOperatingHours(text) {
  const m = (text || "").match(/(\d{1,2})[.:](\d{2})\s*(?:[-–]|s\.?d\.?|sampai)\s*(\d{1,2})[.:](\d{2})/i);
  if (!m) return ["00:00", "24:00"];
  const pad = (h, mm) => `${String(h).padStart(2, "0")}:${mm}`;
  return [pad(m[1], m[2]), pad(m[3], m[4])];
}

/** Bagi jam operasional menjadi blok TERPAKAI / TERSEDIA berdasarkan event hari itu. */
export function buildDayBlocks(events, open, close) {
  const busy = events
    .map((e) => ({ start: e.start_time < open ? open : e.start_time, end: e.end_time > close ? close : e.end_time, maintenance: e.public_status === "maintenance" || e.source === "maintenance" }))
    .filter((e) => e.start < e.end)
    .sort((a, b) => a.start.localeCompare(b.start));
  const merged = [];
  busy.forEach((b) => {
    const last = merged[merged.length - 1];
    if (last && b.start <= last.end) {
      if (b.end > last.end) last.end = b.end;
      last.maintenance = last.maintenance || b.maintenance;
    } else merged.push({ ...b });
  });
  const blocks = [];
  let cur = open;
  merged.forEach((b) => {
    if (b.start > cur) blocks.push({ start: cur, end: b.start, free: true });
    blocks.push({ start: b.start, end: b.end, free: false, maintenance: b.maintenance });
    cur = b.end > cur ? b.end : cur;
  });
  if (cur < close) blocks.push({ start: cur, end: close, free: true });
  return blocks;
}

export function DaySchedule({ date, spaceLabel, events = [], operatingHours, onPickFree }) {
  const [open, close] = parseOperatingHours(operatingHours);
  const blocks = buildDayBlocks(events, open, close);
  const label = (t) => (t === "24:00" ? "24.00" : formatTimeId(t));
  return (
    <div className="bg-white border border-slate-200 rounded-[14px] p-5" data-testid="day-schedule">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Jadwal Harian</p>
      <p className="font-heading font-semibold text-slate-900 mt-0.5">{formatDateId(date)}</p>
      {spaceLabel && <p className="text-xs text-slate-500">{spaceLabel}</p>}
      <div className="mt-4 space-y-2">
        {blocks.map((b, i) => (
          <button key={i} type="button" disabled={!b.free || !onPickFree}
            onClick={() => b.free && onPickFree && onPickFree(b.start, b.end === "24:00" ? "23:59" : b.end)}
            className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border text-sm text-left transition-colors
              ${b.free ? "bg-emerald-50 border-emerald-200 text-emerald-800 enabled:hover:bg-emerald-100" : b.maintenance ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
            <span className="font-semibold tabular-nums">{label(b.start)} s.d. {label(b.end)}</span>
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
              <span className={`w-2.5 h-2.5 rounded-full ${b.free ? "bg-emerald-500" : b.maintenance ? "bg-rose-500" : "bg-amber-500"}`} />
              {b.free ? "Tersedia" : b.maintenance ? "Pemeliharaan" : "Terpakai"}
            </span>
          </button>
        ))}
      </div>
      {onPickFree && blocks.some((b) => b.free) && <p className="mt-3 text-[11px] text-slate-400">Klik blok hijau untuk mengisi jam secara otomatis.</p>}
    </div>
  );
}

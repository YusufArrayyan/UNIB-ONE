import { useEffect, useMemo, useState } from "react";
import { Building2, DoorOpen, BedDouble, Trophy, LayoutGrid, Users, Check } from "lucide-react";
import { capacityText } from "@/components/FacilityCard";

const FULL_GROUP = "Sewa Full Gedung";

export const spaceGroup = (s) => s.group || (s.is_full_building ? FULL_GROUP : "Ruang Terpisah");

function groupIcon(name) {
  const n = name.toLowerCase();
  if (n.includes("full") || n.includes("gedung")) return Building2;
  if (n.includes("kamar")) return BedDouble;
  if (n.includes("lapangan")) return Trophy;
  if (n.includes("ruang")) return DoorOpen;
  return LayoutGrid;
}

/**
 * Pilih unit sewa dalam dua tahap, seperti strip kategori:
 * 1) jenis sewa (mis. Sewa Full Gedung / Ruang Terpisah), 2) unit di dalamnya.
 */
export function SpacePicker({ spaces = [], value, onChange, testPrefix = "space" }) {
  const groups = useMemo(() => {
    const map = new Map();
    spaces.forEach((s) => {
      const g = spaceGroup(s);
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(s);
    });
    return [...map.entries()].sort(([a], [b]) => (a === FULL_GROUP ? -1 : b === FULL_GROUP ? 1 : 0));
  }, [spaces]);

  const selected = spaces.find((s) => s.id === value);
  const [group, setGroup] = useState(selected ? spaceGroup(selected) : groups[0]?.[0]);

  useEffect(() => {
    if (selected) setGroup(spaceGroup(selected));
    else if (!groups.some(([g]) => g === group)) setGroup(groups[0]?.[0]);
  }, [selected, groups]); // eslint-disable-line react-hooks/exhaustive-deps

  const units = groups.find(([g]) => g === group)?.[1] || [];
  const pickGroup = (g) => {
    setGroup(g);
    const list = groups.find(([x]) => x === g)?.[1] || [];
    if (!list.some((s) => s.id === value) && list[0]) onChange(list[0].id);
  };

  return (
    <div>
      {groups.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" role="tablist" aria-label="Jenis sewa">
          {groups.map(([g, list]) => {
            const Icon = groupIcon(g);
            const active = g === group;
            return (
              <button key={g} role="tab" aria-selected={active} onClick={() => pickGroup(g)} data-testid={`${testPrefix}-group-${g}`}
                className={`flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-full border text-sm font-medium whitespace-nowrap transition-colors
                  ${active ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"}`}>
                <Icon className={`w-4 h-4 ${active ? "text-amber-400" : "text-slate-400"}`} />
                {g}
                <span className={`text-xs rounded-full px-2 py-0.5 ${active ? "bg-white/15" : "bg-slate-100 text-slate-500"}`}>{list.length}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${groups.length > 1 ? "mt-4" : ""}`} role="radiogroup" aria-label="Unit sewa">
        {units.map((s) => {
          const active = s.id === value;
          return (
            <button key={s.id} role="radio" aria-checked={active} aria-label={`${s.name}, ${s.price_text}`} onClick={() => onChange(s.id)}
              data-testid={`${testPrefix}-${s.code}`}
              className={`text-left p-4 rounded-[14px] border transition-all ${active ? "border-slate-900 ring-1 ring-slate-900 bg-white shadow-float" : "border-slate-200 bg-white hover:border-slate-400"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-heading font-semibold text-slate-900 leading-snug">{s.name}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{s.code}</p>
                </div>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${active ? "bg-slate-900" : "border border-slate-300"}`}>
                  {active && <Check className="w-3 h-3 text-white" />}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-2 flex items-center gap-1.5"><Users className="w-4 h-4" /> {capacityText(s)}</p>
              {s.amenities?.length > 0 && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.amenities.join(" · ")}</p>}
              <p className="mt-3 text-sm text-slate-900"><span className="font-semibold">{s.price_text}</span></p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

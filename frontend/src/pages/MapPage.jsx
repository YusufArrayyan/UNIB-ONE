import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Users, ArrowRight, X } from "lucide-react";
import { api, CATEGORY_META } from "@/lib/api";
import { FacilityMap } from "@/components/FacilityMap";

const CATS = ["Semua", "Gedung", "Ruang", "Aula", "Lapangan", "Laboratorium", "Hunian", "Lainnya"];

export default function MapPage() {
  const [facilities, setFacilities] = useState([]);
  const [cat, setCat] = useState("Semua");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => { api.get("/facilities").then((r) => setFacilities(r.data)); }, []);

  const filtered = facilities.filter((f) => {
    if (cat !== "Semua" && f.category !== cat) return false;
    if (q && !f.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <section className="bg-slate-900 text-white">
        <div className="container-unib py-10">
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold">UNIB Map</h1>
          <p className="text-slate-300 mt-2">Jelajahi semua fasilitas Universitas Bengkulu dalam peta interaktif.</p>
          <div className="mt-5 relative max-w-xl">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari lokasi atau fasilitas..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATS.map((c) => (
              <button key={c} onClick={() => setCat(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-colors
                  ${cat === c ? "bg-amber-500 text-slate-950 border-amber-500" : "bg-slate-800/60 text-slate-300 border-slate-700 hover:border-amber-500"}`}>{c}</button>
            ))}
          </div>
        </div>
      </section>

      <div className="container-unib py-8 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <div className="relative h-[540px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          <FacilityMap facilities={filtered} onSelect={setSelected} selectedId={selected?.id} zoom={15} />
          {selected && (
            <div data-testid="map-preview-card" className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-up">
              <button onClick={() => setSelected(null)} className="absolute top-2 right-2 z-10 bg-white/90 rounded-full p-1.5 shadow"><X className="w-4 h-4" /></button>
              <img src={selected.images?.[0]} alt={selected.name} className="w-full h-32 object-cover" />
              <div className="p-4">
                <span className="text-xs font-semibold text-white px-2 py-0.5 rounded-full" style={{ background: (CATEGORY_META[selected.category] || CATEGORY_META.Lainnya).color }}>{selected.category}</span>
                <h4 className="font-heading font-bold text-slate-900 mt-2">{selected.name}</h4>
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><Users className="w-4 h-4" /> {selected.capacity} orang</p>
                <Link to={`/facility/${selected.slug}`} className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1 text-sm transition-colors">
                  Detail Fasilitas <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-3">
          <p className="text-sm font-semibold text-slate-900">Fasilitas Terdekat ({filtered.length})</p>
          <div className="space-y-3 max-h-[490px] overflow-y-auto no-scrollbar pr-1">
            {filtered.map((f) => (
              <button key={f.id} onClick={() => setSelected(f)}
                className={`w-full flex gap-3 p-3 rounded-xl border text-left transition-all ${selected?.id === f.id ? "border-amber-500 bg-amber-50" : "border-slate-200 bg-white hover:border-amber-300"}`}>
                <img src={f.images?.[0]} alt={f.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: (CATEGORY_META[f.category] || CATEGORY_META.Lainnya).color }}>{f.category}</span>
                  <p className="font-heading font-semibold text-sm text-slate-900 mt-1 truncate">{f.name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Users className="w-3 h-3" /> {f.capacity} org</p>
                </div>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

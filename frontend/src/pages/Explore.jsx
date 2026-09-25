import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, SlidersHorizontal, X, Map as MapIcon, GitCompare } from "lucide-react";
import { api } from "@/lib/api";
import { FacilityCard } from "@/components/FacilityCard";

const CATS = ["Semua", "Gedung", "Ruang", "Aula", "Lapangan", "Laboratorium", "Hunian", "Lainnya"];
const CAPS = [
  { label: "Semua", min: 0 },
  { label: "< 100 orang", min: 1, max: 99 },
  { label: "100 - 300", min: 100, max: 300 },
  { label: "300 - 500", min: 300, max: 500 },
  { label: "> 500", min: 500 },
];

export default function Explore() {
  const [params, setParams] = useSearchParams();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(params.get("q") || "");
  const [cat, setCat] = useState(params.get("category") || "Semua");
  const [capIdx, setCapIdx] = useState(0);
  const [sort, setSort] = useState("popular");
  const [feature, setFeature] = useState("");

  useEffect(() => {
    setLoading(true);
    const p = {};
    if (q) p.q = q;
    if (cat !== "Semua") p.category = cat;
    p.sort = sort;
    api.get("/facilities", { params: p }).then((r) => { setFacilities(r.data); setLoading(false); });
  }, [q, cat, sort]);

  useEffect(() => {
    const np = {};
    if (q) np.q = q;
    if (cat !== "Semua") np.category = cat;
    setParams(np, { replace: true });
  }, [q, cat]);

  const filtered = useMemo(() => {
    const c = CAPS[capIdx];
    return facilities.filter((f) => {
      if (c.min && f.capacity < c.min) return false;
      if (c.max && f.capacity > c.max) return false;
      if (feature && !(f.features || []).includes(feature)) return false;
      return true;
    });
  }, [facilities, capIdx, feature]);

  const allFeatures = useMemo(() => {
    const set = new Set();
    facilities.forEach((f) => (f.features || []).forEach((x) => set.add(x)));
    return [...set];
  }, [facilities]);

  return (
    <div>
      <section className="bg-slate-900 text-white">
        <div className="container-unib py-12">
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold">Explore Facilities</h1>
          <p className="text-slate-300 mt-2">Temukan fasilitas terbaik yang sesuai dengan kebutuhan Anda.</p>
          <div className="mt-6 relative max-w-2xl">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input data-testid="explore-search" value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Cari fasilitas, gedung, ruang..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATS.map((c) => (
              <button key={c} onClick={() => setCat(c)} data-testid={`explore-chip-${c}`}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border
                  ${cat === c ? "bg-amber-500 text-slate-950 border-amber-500" : "bg-slate-800/60 text-slate-300 border-slate-700 hover:border-amber-500"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="container-unib py-10 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        {/* Sidebar filters */}
        <aside className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 font-heading font-semibold text-slate-900 mb-4">
              <SlidersHorizontal className="w-4 h-4" /> Filter
            </div>
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase text-slate-400 mb-2">Kapasitas</p>
              <div className="space-y-1.5">
                {CAPS.map((c, i) => (
                  <label key={c.label} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input type="radio" name="cap" checked={capIdx === i} onChange={() => setCapIdx(i)} className="accent-amber-500" />
                    {c.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 mb-2">Fasilitas Pendukung</p>
              <div className="flex flex-wrap gap-1.5">
                {allFeatures.slice(0, 10).map((f) => (
                  <button key={f} onClick={() => setFeature(feature === f ? "" : f)}
                    className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${feature === f ? "bg-amber-500 text-slate-950 border-amber-500" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-amber-400"}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            {(capIdx !== 0 || feature || cat !== "Semua" || q) && (
              <button onClick={() => { setCapIdx(0); setFeature(""); setCat("Semua"); setQ(""); }}
                className="mt-5 w-full text-sm font-medium text-rose-600 border border-rose-200 rounded-lg py-2 hover:bg-rose-50 flex items-center justify-center gap-1">
                <X className="w-4 h-4" /> Reset Filter
              </button>
            )}
          </div>
          <Link to="/map" className="flex items-center gap-2 justify-center bg-slate-900 text-white rounded-2xl py-3.5 text-sm font-semibold hover:bg-slate-800">
            <MapIcon className="w-4 h-4" /> Lihat di Peta
          </Link>
          <Link to="/compare" className="flex items-center gap-2 justify-center border border-slate-200 bg-white text-slate-800 rounded-2xl py-3.5 text-sm font-semibold hover:border-amber-400">
            <GitCompare className="w-4 h-4" /> Bandingkan Fasilitas
          </Link>
        </aside>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-slate-600">Hasil Pencarian <span className="font-semibold text-slate-900">({filtered.length} fasilitas)</span></p>
            <select data-testid="explore-sort" value={sort} onChange={(e) => setSort(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="popular">Terpopuler</option>
              <option value="capacity">Kapasitas Terbesar</option>
              <option value="newest">Terbaru</option>
            </select>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <div key={i} className="h-80 rounded-2xl bg-slate-100 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
              <p className="font-heading font-semibold text-slate-900 text-lg">Tidak ada fasilitas ditemukan</p>
              <p className="text-slate-500 text-sm mt-2">Ubah filter, hapus kata kunci, atau buka peta kampus.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((f) => <FacilityCard key={f.id} facility={f} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

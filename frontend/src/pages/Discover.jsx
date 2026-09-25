import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { ArrowRight } from "lucide-react";

const TABS = [
  { key: "all", label: "Semua" },
  { key: "news", label: "Berita" },
  { key: "event", label: "Event" },
  { key: "spotlight", label: "Facility Spotlight" },
  { key: "activity", label: "Aktivitas Kampus" },
];

export default function Discover() {
  const [tab, setTab] = useState("all");
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get("/content", { params: tab === "all" ? {} : { category: tab } }).then((r) => setItems(r.data));
  }, [tab]);

  return (
    <div>
      <section className="bg-slate-900 text-white">
        <div className="container-unib py-12">
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold">Stories & Information</h1>
          <p className="text-slate-300 mt-2">Berita, event, dan cerita menarik seputar fasilitas dan aktivitas kampus UNIB.</p>
          <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} data-testid={`discover-tab-${t.key}`}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-colors
                  ${tab === t.key ? "bg-amber-500 text-slate-950 border-amber-500" : "bg-slate-800/60 text-slate-300 border-slate-700 hover:border-amber-500"}`}>{t.label}</button>
            ))}
          </div>
        </div>
      </section>

      <div className="container-unib py-12">
        {items.length === 0 ? (
          <p className="text-center text-slate-400 py-16">Belum ada konten pada kategori ini.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((s) => (
              <Link key={s.id} to={`/discover/${s.slug}`} className="group bg-white rounded-2xl overflow-hidden border border-slate-200 card-hover hover:shadow-xl">
                <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                  <img src={s.image} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <span className="text-[10px] font-bold tracking-wide uppercase text-amber-600">{s.category}</span>
                  <h3 className="font-heading font-semibold text-slate-900 mt-2 leading-snug line-clamp-2 group-hover:text-amber-600">{s.title}</h3>
                  <p className="text-sm text-slate-500 mt-2 line-clamp-2">{s.excerpt}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-400">{s.date}</span>
                    <span className="text-sm font-semibold text-amber-600 flex items-center gap-1">Baca <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

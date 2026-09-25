import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ArrowRight, Building2, DoorOpen, Theater, Trophy, FlaskConical, Home as HomeIcon, LayoutGrid, GraduationCap, PartyPopper, Award, Users2, Dumbbell, Sparkles, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import { FacilityCard } from "@/components/FacilityCard";

const CATS = [
  { key: "Gedung", label: "Gedung", Icon: Building2 },
  { key: "Ruang", label: "Ruang", Icon: DoorOpen },
  { key: "Aula", label: "Aula", Icon: Theater },
  { key: "Lapangan", label: "Lapangan", Icon: Trophy },
  { key: "Laboratorium", label: "Laboratorium", Icon: FlaskConical },
  { key: "Hunian", label: "Hunian", Icon: HomeIcon },
  { key: "Lainnya", label: "Lainnya", Icon: LayoutGrid },
];

const PURPOSES = [
  { label: "Akademik", desc: "Seminar, workshop, kuliah", Icon: GraduationCap },
  { label: "Event & Acara", desc: "Konferensi, pameran, acara besar", Icon: PartyPopper },
  { label: "Kompetisi", desc: "Lomba akademik & non-akademik", Icon: Award },
  { label: "Organisasi", desc: "Rapat & kegiatan organisasi", Icon: Users2 },
  { label: "Olahraga", desc: "Lapangan & fasilitas olahraga", Icon: Dumbbell },
  { label: "Event Eksternal", desc: "Untuk masyarakat & instansi", Icon: Sparkles },
];

const STATS = [
  { n: "6+", l: "Fasilitas Kampus" },
  { n: "2", l: "Jalur Pemanfaatan" },
  { n: "24/7", l: "Akses Informasi" },
  { n: "100%", l: "Terintegrasi" },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [stories, setStories] = useState([]);
  const [q, setQ] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    api.get("/facilities", { params: { featured: true } }).then((r) => setFeatured(r.data.slice(0, 4)));
    api.get("/content").then((r) => setStories(r.data.slice(0, 4)));
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden text-white">
        <img src="/facilities/gsg-1.jpeg" alt="Kampus UNIB" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 hero-overlay" />
        <div className="container-unib relative py-20 lg:py-28">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase bg-white/10 border border-white/20 px-3 py-1.5 rounded-full">
              <MapPin className="w-3.5 h-3.5 text-amber-400" /> Universitas Bengkulu
            </span>
            <h1 className="mt-6 font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight max-w-3xl">
              Lebih dari Sekadar Fasilitas. <span className="text-gradient-gold">Kampusmu, Terhubung.</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Temukan ruang, fasilitas, dan layanan di seluruh Universitas Bengkulu — cek ketersediaan dan ajukan pemanfaatan, semua dalam satu ekosistem digital terpadu.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); nav(`/explore?q=${encodeURIComponent(q)}`); }}
              className="mt-8 bg-white/10 backdrop-blur-lg border border-white/20 p-3 rounded-2xl max-w-2xl shadow-2xl flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input data-testid="hero-search-input" value={q} onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari gedung, ruang, aula, laboratorium..."
                  className="w-full bg-white text-slate-900 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <button data-testid="hero-search-btn" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-6 py-3.5 rounded-xl transition-colors whitespace-nowrap">
                Cari Sekarang
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2 items-center text-sm text-slate-300">
              <span>Populer:</span>
              {["Gedung Serba Guna", "Laboratorium Terpadu", "Asrama Orchid", "Aula FMIPA"].map((p) => (
                <button key={p} onClick={() => nav(`/explore?q=${encodeURIComponent(p)}`)}
                  className="bg-white/10 hover:bg-amber-500 hover:text-slate-950 border border-white/15 px-3 py-1 rounded-full text-xs font-medium transition-colors">{p}</button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-slate-900 text-white border-t border-slate-800">
        <div className="container-unib grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-800">
          {STATS.map((s) => (
            <div key={s.l} className="py-8 text-center">
              <div className="font-heading text-3xl lg:text-4xl font-extrabold text-amber-400">{s.n}</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-unib py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold tracking-wide uppercase text-amber-600">Kategori</p>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Jelajahi Ruang UNIB</h2>
          </div>
          <Link to="/explore" className="text-sm font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1">Lihat Semua <ArrowRight className="w-4 h-4" /></Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          {CATS.map(({ key, label, Icon }) => (
            <Link key={key} to={`/explore?category=${key}`} data-testid={`home-cat-${key}`}
              className="group bg-white border border-slate-200 rounded-xl p-5 flex flex-col items-center gap-3 card-hover hover:border-amber-300 hover:shadow-md text-center">
              <span className="w-12 h-12 rounded-xl bg-slate-900 group-hover:bg-amber-500 flex items-center justify-center transition-colors">
                <Icon className="w-6 h-6 text-amber-400 group-hover:text-slate-950 transition-colors" />
              </span>
              <span className="text-sm font-semibold text-slate-800">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* PURPOSE */}
      <section className="bg-white border-y border-slate-200">
        <div className="container-unib py-16">
          <p className="text-xs font-semibold tracking-wide uppercase text-amber-600">Tujuan Penggunaan</p>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 mt-1 mb-8">Apa yang Anda Rencanakan?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PURPOSES.map(({ label, desc, Icon }) => (
              <Link key={label} to="/explore" className="group flex items-start gap-4 p-5 rounded-2xl border border-slate-200 card-hover hover:shadow-md hover:border-amber-300 bg-slate-50/50">
                <span className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-amber-600" />
                </span>
                <div>
                  <h3 className="font-heading font-semibold text-slate-900 group-hover:text-amber-600">{label}</h3>
                  <p className="text-sm text-slate-500 mt-1">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="container-unib py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold tracking-wide uppercase text-amber-600">Fasilitas Unggulan</p>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Fasilitas Pilihan</h2>
          </div>
          <Link to="/explore" className="text-sm font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1">Semua Fasilitas <ArrowRight className="w-4 h-4" /></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((f) => <FacilityCard key={f.id} facility={f} />)}
        </div>
      </section>

      {/* STORIES */}
      <section className="bg-slate-900 text-white">
        <div className="container-unib py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold tracking-wide uppercase text-amber-400">Cerita & Info</p>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold mt-1">Cerita dari Ruang Kami</h2>
            </div>
            <Link to="/discover" className="text-sm font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1">Lihat Semua <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stories.map((s) => (
              <Link key={s.id} to={`/discover/${s.slug}`} className="group bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 card-hover hover:border-amber-500/50">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={s.image} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <span className="text-[10px] font-bold tracking-wide uppercase text-amber-400">{s.category}</span>
                  <h3 className="font-heading font-semibold mt-2 leading-snug line-clamp-2 group-hover:text-amber-300">{s.title}</h3>
                  <p className="text-xs text-slate-400 mt-2">{s.date}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-unib py-16">
        <div className="rounded-3xl bg-gradient-to-br from-amber-500 to-amber-600 p-10 lg:p-14 text-center text-slate-950">
          <h2 className="font-heading text-3xl lg:text-4xl font-extrabold">Butuh Menggunakan Fasilitas?</h2>
          <p className="mt-3 max-w-2xl mx-auto font-medium">Ceritakan kebutuhan Anda. Tim BPU siap membantu menemukan ruang yang tepat dan menyelesaikan proses pemanfaatan.</p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/request" className="bg-slate-950 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-slate-800 transition-colors">Ajukan Permohonan</Link>
            <Link to="/explore" className="bg-white/30 backdrop-blur border border-slate-950/10 text-slate-950 font-semibold px-7 py-3.5 rounded-xl hover:bg-white/50 transition-colors">Jelajahi Fasilitas</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

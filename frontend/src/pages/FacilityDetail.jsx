import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, MapPin, Clock, ChevronRight, MessageCircle, CalendarCheck, Check, Wifi, Wind, Monitor, Volume2, Theater, Car } from "lucide-react";
import { toast } from "sonner";
import { api, buildWaLink } from "@/lib/api";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { FacilityMap } from "@/components/FacilityMap";
import { FacilityCard } from "@/components/FacilityCard";

const FEATURE_ICON = { "AC": Wind, "Wi-Fi": Wifi, "LCD Proyektor": Monitor, "Sound System": Volume2, "Panggung": Theater, "Parkir Luas": Car, "Parkir": Car };

export default function FacilityDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const [fac, setFac] = useState(null);
  const [events, setEvents] = useState([]);
  const [related, setRelated] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);
  const [waNumber, setWaNumber] = useState("6282185028768");

  useEffect(() => {
    setActiveImg(0);
    api.get(`/facilities/${slug}`).then((r) => {
      setFac(r.data);
      api.get(`/facilities/${r.data.id}/availability`).then((a) => setEvents(a.data));
      api.get("/facilities", { params: { category: r.data.category } }).then((rel) =>
        setRelated(rel.data.filter((f) => f.id !== r.data.id).slice(0, 3)));
    }).catch(() => nav("/explore"));
    api.get("/config").then((r) => setWaNumber(r.data.whatsapp_bpu));
  }, [slug, nav]);

  if (!fac) return <div className="container-unib py-24 text-center text-slate-400">Memuat...</div>;

  const waMsg = `Halo Admin BPU UNIB, saya ingin mengajukan penggunaan ${fac.name}${selectedDate ? ` pada tanggal ${selectedDate}` : ""}. Mohon informasi ketersediaannya.`;

  return (
    <div>
      <div className="container-unib pt-6">
        <nav className="flex items-center gap-1.5 text-sm text-slate-500 flex-wrap">
          <Link to="/" className="hover:text-amber-600">Home</Link><ChevronRight className="w-4 h-4" />
          <Link to="/explore" className="hover:text-amber-600">Explore</Link><ChevronRight className="w-4 h-4" />
          <span className="text-slate-400">{fac.category}</span><ChevronRight className="w-4 h-4" />
          <span className="text-slate-900 font-medium">{fac.name}</span>
        </nav>
      </div>

      <div className="container-unib py-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        <div className="space-y-8">
          {/* Gallery */}
          <div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="aspect-[16/9] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <img src={fac.images[activeImg]} alt={fac.name} className="w-full h-full object-cover" />
            </motion.div>
            {fac.images.length > 1 && (
              <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar">
                {fac.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`w-24 h-16 rounded-lg overflow-hidden border-2 shrink-0 ${activeImg === i ? "border-amber-500" : "border-transparent opacity-70 hover:opacity-100"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Identity */}
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-slate-900 text-white text-xs font-semibold px-3 py-1 rounded-full">{fac.category}</span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full">Aktif</span>
            </div>
            <h1 className="mt-3 font-heading text-3xl sm:text-4xl font-extrabold text-slate-900">{fac.name}</h1>
            <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-600">
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-amber-600" /> Kapasitas {fac.capacity} orang</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-amber-600" /> {fac.operating_hours}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-amber-600" /> {fac.location}</span>
            </div>
            <p className="mt-5 text-slate-600 leading-relaxed">{fac.description}</p>
          </div>

          {/* Features */}
          <div>
            <h3 className="font-heading text-xl font-bold text-slate-900 mb-4">Fasilitas Pendukung</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {fac.features.map((f) => {
                const Icon = FEATURE_ICON[f] || Check;
                return (
                  <div key={f} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
                    <span className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center"><Icon className="w-4 h-4 text-amber-600" /></span>
                    <span className="text-sm font-medium text-slate-700">{f}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Suitable + Services */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="font-heading text-lg font-bold text-slate-900 mb-3">Cocok Untuk</h3>
              <div className="flex flex-wrap gap-2">
                {fac.suitable_for.map((s) => <span key={s} className="bg-sky-50 text-sky-700 text-sm font-medium px-3 py-1.5 rounded-lg">{s}</span>)}
              </div>
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-slate-900 mb-3">Layanan Tambahan</h3>
              <div className="flex flex-wrap gap-2">
                {fac.services.map((s) => <span key={s} className="bg-slate-100 text-slate-700 text-sm font-medium px-3 py-1.5 rounded-lg">{s}</span>)}
              </div>
            </div>
          </div>

          {/* Rules */}
          <div>
            <h3 className="font-heading text-xl font-bold text-slate-900 mb-4">Aturan Penggunaan</h3>
            <ul className="space-y-2">
              {fac.rules.map((r) => (
                <li key={r} className="flex items-start gap-2 text-sm text-slate-600"><Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> {r}</li>
              ))}
            </ul>
          </div>

          {/* Availability */}
          <div>
            <h3 className="font-heading text-xl font-bold text-slate-900 mb-4">Ketersediaan</h3>
            <AvailabilityCalendar events={events} publicView onSelectDate={setSelectedDate} selectedDate={selectedDate} />
          </div>

          {/* Map */}
          <div>
            <h3 className="font-heading text-xl font-bold text-slate-900 mb-4">Lokasi</h3>
            <p className="text-sm text-slate-600 mb-3 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-amber-600" /> {fac.address}</p>
            <div className="h-72 rounded-2xl overflow-hidden border border-slate-200">
              <FacilityMap facilities={[fac]} center={{ lat: fac.latitude, lng: fac.longitude }} zoom={16} />
            </div>
          </div>
        </div>

        {/* Sticky sidebar */}
        <aside className="lg:sticky lg:top-24 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg">
            <p className="text-xs font-semibold uppercase text-slate-400">Ajukan Pemanfaatan</p>
            <p className="mt-2 font-heading text-lg font-bold text-slate-900">{fac.name}</p>
            {selectedDate && <p className="mt-1 text-sm text-amber-600 font-medium">Tanggal dipilih: {selectedDate}</p>}
            <button data-testid="detail-check-availability"
              onClick={() => nav(`/request?facility=${fac.id}${selectedDate ? `&date=${selectedDate}` : ""}`)}
              className="mt-4 w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
              <CalendarCheck className="w-5 h-5" /> Cek & Ajukan
            </button>
            <a data-testid="detail-whatsapp" href={buildWaLink(waNumber, waMsg)} target="_blank" rel="noreferrer"
              onClick={() => toast.success("Membuka WhatsApp BPU...")}
              className="mt-3 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
              <MessageCircle className="w-5 h-5" /> Chat via WhatsApp
            </a>
            <div className="mt-5 pt-5 border-t border-slate-100 text-sm space-y-2 text-slate-600">
              <p className="font-semibold text-slate-900">Pengelola (PIC)</p>
              <p>{fac.pic_name}</p>
              <p className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /> +{fac.pic_contact}</p>
            </div>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="container-unib py-12 border-t border-slate-200">
          <h3 className="font-heading text-2xl font-bold text-slate-900 mb-6">Fasilitas Terkait</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((f) => <FacilityCard key={f.id} facility={f} />)}
          </div>
        </section>
      )}
    </div>
  );
}

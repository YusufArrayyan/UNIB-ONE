import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { Users, MapPin, Clock, ChevronRight, MessageCircle, CalendarCheck, Check, X, Play, ArrowRight, PackagePlus, Images } from "lucide-react";
import { toast } from "sonner";
import { api, buildWaLink, formatRupiah, mediaSrc } from "@/lib/api";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { SpaceAvailability } from "@/components/SpaceAvailability";
import { SpacePicker } from "@/components/SpacePicker";
import { FacilityMap } from "@/components/FacilityMap";
import { FacilityCard, capacityText } from "@/components/FacilityCard";
import { MediaFallback } from "@/components/BrandLogo";

function youtubeId(url) {
  const m = (url || "").match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function MediaView({ item, alt, className = "" }) {
  if (!item) return <MediaFallback label="Foto segera hadir" />;
  if (item.type === "video") {
    const yt = youtubeId(item.src);
    return yt
      ? <iframe title={alt} src={`https://www.youtube.com/embed/${yt}`} className={`w-full h-full ${className}`} allowFullScreen />
      : <video src={mediaSrc(item.src)} controls playsInline preload="metadata" className={`w-full h-full object-cover bg-black ${className}`} />;
  }
  return <img src={mediaSrc(item.src)} alt={alt} className={`w-full h-full object-cover ${className}`} />;
}

/** Tata letak galeri: 1 foto besar + hingga 4 foto kecil, menyesuaikan jumlah foto. */
function cellClass(i, n) {
  if (i === 0) return "col-span-4 row-span-2 sm:col-span-2";
  const base = "hidden sm:block";
  if (n === 2) return `${base} sm:col-span-2 sm:row-span-2`;
  if (n === 3) return `${base} sm:col-span-2`;
  if (n === 4 && i === 3) return `${base} sm:col-span-2`;
  return base;
}

function Section({ title, sub, children, id, innerRef }) {
  return (
    <section id={id} ref={innerRef} className="py-8 border-t border-slate-200 first:border-t-0 first:pt-0 scroll-mt-24">
      <h2 className="font-heading text-[21px] font-bold text-slate-900">{title}</h2>
      {sub && <p className="text-sm text-slate-500 mt-1">{sub}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function FacilityDetail() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const cfg = useSiteConfig();
  const [fac, setFac] = useState(null);
  const [related, setRelated] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [activeMedia, setActiveMedia] = useState(null);
  const [spaceId, setSpaceId] = useState("");
  const [slot, setSlot] = useState({ date: params.get("date") || "", start_time: "08:00", end_time: "12:00" });
  const [result, setResult] = useState(null);
  const checkRef = useRef(null);

  useEffect(() => {
    setActiveMedia(null);
    setResult(null);
    api.get(`/facilities/${slug}`).then((r) => {
      setFac(r.data);
      const wanted = r.data.spaces.find((s) => s.code === params.get("space"));
      setSpaceId((wanted || r.data.spaces[0])?.id || "");
      api.get("/amenities", { params: { building_id: r.data.id } }).then((a) => setAmenities(a.data));
      api.get("/facilities", { params: { category: r.data.category } }).then((rel) =>
        setRelated(rel.data.filter((f) => f.id !== r.data.id).slice(0, 4)));
    }).catch(() => nav("/explore"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, nav]);

  const media = useMemo(() => fac ? [
    ...(fac.images || []).map((src) => ({ type: "image", src })),
    ...(fac.videos || []).map((src) => ({ type: "video", src })),
  ] : [], [fac]);

  if (!fac) return <div className="container-unib py-24 text-center text-slate-400">Memuat...</div>;

  const space = fac.spaces.find((s) => s.id === spaceId);
  const waMsg = `Halo Admin BPU UNIB, saya ingin bertanya mengenai ${fac.name}${space ? ` (${space.name})` : ""}. Mohon informasinya.`;
  const goRequest = () => nav(`/request?facility=${fac.id}&space=${space.id}&date=${slot.date}&start=${slot.start_time}&end=${slot.end_time}`);
  const selectSpace = (id) => { setSpaceId(id); setResult(null); };
  const grid = media.slice(0, 5);

  return (
    <div className="bg-white">
      <div className="container-unib pt-6">
        <nav className="flex items-center gap-1.5 text-sm text-slate-500 flex-wrap">
          <Link to="/" className="hover:text-slate-900">Home</Link><ChevronRight className="w-4 h-4" />
          <Link to="/explore" className="hover:text-slate-900">Explore</Link><ChevronRight className="w-4 h-4" />
          <span className="text-slate-900 font-medium">{fac.name}</span>
        </nav>
        <h1 className="mt-4 font-heading text-2xl sm:text-[28px] font-bold text-slate-900 leading-tight">{fac.name}</h1>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
          <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {fac.location}</span>
          <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {capacityText(fac)}</span>
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {fac.operating_hours}</span>
        </div>

        {/* Galeri: satu foto besar + empat kecil */}
        <div className="mt-6 relative">
          {media.length <= 1 ? (
            <div className="aspect-[16/7] rounded-[14px] overflow-hidden bg-slate-100"><MediaView item={media[0]} alt={fac.name} /></div>
          ) : (
            <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[280px] sm:h-[420px] rounded-[14px] overflow-hidden">
              {grid.map((m, i) => (
                <button key={i} onClick={() => setActiveMedia(i)} aria-label={`Buka media ${i + 1}`}
                  className={`relative overflow-hidden bg-slate-100 group ${cellClass(i, grid.length)}`}>
                  {m.type === "image"
                    ? <img src={mediaSrc(m.src)} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                    : <span className="w-full h-full bg-slate-900 flex items-center justify-center"><Play className="w-8 h-8 text-white" /></span>}
                </button>
              ))}
            </div>
          )}
          {media.length > 1 && (
            <button onClick={() => setActiveMedia(0)} className="absolute bottom-4 right-4 bg-white text-slate-900 text-sm font-medium px-4 py-2 rounded-lg border border-slate-900 flex items-center gap-2 shadow-float">
              <Images className="w-4 h-4" /> Lihat semua ({media.length})
            </button>
          )}
        </div>
      </div>

      <div className="container-unib py-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 lg:gap-16 items-start">
        <div className="min-w-0">
          <Section title="Tentang tempat ini">
            <p className="text-slate-700 leading-relaxed">{fac.description}</p>
            {fac.suitable_for?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {fac.suitable_for.map((s) => <span key={s} className="text-sm text-slate-700 border border-slate-200 px-3 py-1.5 rounded-full">{s}</span>)}
              </div>
            )}
          </Section>

          <Section title="Pilih unit yang disewa" sub="Sewa seluruh gedung, atau pilih ruang/area yang bisa disewa terpisah. Ketersediaan dicek per unit.">
            <SpacePicker spaces={fac.spaces} value={spaceId} onChange={selectSpace} />
            {space?.pricing_rule?.note && <p className="mt-3 text-xs text-slate-500">{space.pricing_rule.note}</p>}
          </Section>

          {(fac.features?.length > 0 || fac.not_included?.length > 0) && (
            <Section title="Fasilitas">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
                <ul>
                  {(fac.features || []).map((f) => (
                    <li key={f} className="flex items-start gap-3 py-3 text-slate-800"><Check className="w-5 h-5 text-emerald-600 shrink-0" /> {f}</li>
                  ))}
                </ul>
                {fac.not_included?.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-900 pt-3">Tidak termasuk</p>
                    <ul>
                      {fac.not_included.map((f) => (
                        <li key={f} className="flex items-start gap-3 py-3 text-slate-500"><X className="w-5 h-5 text-slate-400 shrink-0" /> <span className="line-through decoration-slate-300">{f}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Section>
          )}

          <Section title={space ? `Cek ketersediaan ${space.name}` : "Cek ketersediaan"} id="cek-ketersediaan" innerRef={checkRef}>
            <SpaceAvailability facility={fac} space={space} value={slot} onChange={setSlot} result={result} onResult={setResult}>
              <button data-testid="detail-continue" onClick={goRequest}
                className="mt-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold h-12 px-6 rounded-lg inline-flex items-center gap-2 transition-colors">
                Lanjutkan Permintaan <ArrowRight className="w-4 h-4" />
              </button>
            </SpaceAvailability>
          </Section>

          {amenities.length > 0 && (
            <Section title="Fasilitas tambahan" sub="Bisa dipilih saat mengajukan permintaan. Biaya final dikonfirmasi BPU.">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
                {amenities.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 py-3">
                    <PackagePlus className="w-5 h-5 text-slate-700 shrink-0" />
                    <span><span className="block text-slate-800">{a.name}</span><span className="block text-sm text-slate-500">{a.price_information || (a.price ? `${formatRupiah(a.price)} / ${a.unit}` : "Dikonfirmasi BPU")}</span></span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {fac.rules?.length > 0 && (
            <Section title="Ketentuan penggunaan">
              <ul className="space-y-2.5">
                {fac.rules.map((r) => <li key={r} className="flex items-start gap-3 text-slate-700"><span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2.5 shrink-0" /> {r}</li>)}
              </ul>
            </Section>
          )}

          <Section title="Lokasi" sub={fac.address}>
            <div className="h-72 rounded-[14px] overflow-hidden border border-slate-200">
              <FacilityMap facilities={[fac]} center={{ lat: fac.latitude, lng: fac.longitude }} zoom={16} />
            </div>
          </Section>
        </div>

        {/* Kartu pemesanan (sticky) */}
        <aside className="lg:sticky lg:top-24">
          <div className="bg-white border border-slate-200 rounded-[14px] p-6 shadow-float">
            <p className="font-heading text-[21px] font-bold text-slate-900 leading-tight">{space ? space.price_text : fac.price_summary?.text}</p>
            <p className="text-sm text-slate-500 mt-1">{space ? space.name : fac.name}</p>
            <div className="mt-5 rounded-lg border border-slate-300 divide-y divide-slate-300 text-sm">
              <div className="px-3 py-2.5"><p className="text-[11px] font-bold uppercase text-slate-900">Unit</p><p className="text-slate-700 truncate">{space?.name}</p></div>
              <div className="px-3 py-2.5"><p className="text-[11px] font-bold uppercase text-slate-900">Kapasitas</p><p className="text-slate-700">{space ? capacityText(space) : capacityText(fac)}</p></div>
            </div>
            <button data-testid="detail-check-availability"
              onClick={() => checkRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="mt-4 w-full h-12 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors">
              <CalendarCheck className="w-5 h-5" /> Cek Ketersediaan
            </button>
            <p className="text-xs text-slate-500 text-center mt-3">Belum ada pembayaran. Tarif final dikonfirmasi BPU.</p>
            <a data-testid="detail-whatsapp" href={buildWaLink(cfg.whatsapp_bpu, waMsg)} target="_blank" rel="noreferrer"
              onClick={() => toast.success("Membuka WhatsApp BPU...")}
              className="mt-5 pt-5 border-t border-slate-200 flex items-center justify-center gap-2 text-sm font-semibold text-slate-900 underline underline-offset-2">
              <MessageCircle className="w-4 h-4" /> Tanya Admin BPU via WhatsApp
            </a>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="container-unib py-12 border-t border-slate-200">
          <h2 className="font-heading text-[21px] font-bold text-slate-900 mb-6">Fasilitas serupa</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((f) => <FacilityCard key={f.id} facility={f} />)}
          </div>
        </section>
      )}

      {activeMedia !== null && media.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={() => setActiveMedia(null)} role="dialog" aria-label="Galeri">
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-sm">{activeMedia + 1} / {media.length}</span>
            <button aria-label="Tutup galeri" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 flex items-center justify-center px-4 pb-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-5xl aspect-[16/10]"><MediaView item={media[activeMedia]} alt={fac.name} className="object-contain rounded-lg" /></div>
          </div>
          <div className="flex gap-2 justify-center pb-6 overflow-x-auto no-scrollbar px-4" onClick={(e) => e.stopPropagation()}>
            {media.map((m, i) => (
              <button key={i} onClick={() => setActiveMedia(i)} aria-label={`Media ${i + 1}`}
                className={`w-20 h-14 rounded-md overflow-hidden shrink-0 border-2 ${i === activeMedia ? "border-white" : "border-transparent opacity-60"}`}>
                {m.type === "image" ? <img src={mediaSrc(m.src)} alt="" className="w-full h-full object-cover" /> : <span className="w-full h-full bg-slate-800 flex items-center justify-center"><Play className="w-5 h-5 text-white" /></span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

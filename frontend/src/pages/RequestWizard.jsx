import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, User, CalendarClock, ClipboardCheck, ArrowRight, ArrowLeft, MessageCircle, PackagePlus, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError, formatDateId, formatTimeId, formatRupiah, mediaSrc } from "@/lib/api";
import { SpaceAvailability } from "@/components/SpaceAvailability";
import { SpacePicker } from "@/components/SpacePicker";
import { MediaFallback } from "@/components/BrandLogo";

const STEPS = [
  { n: 1, label: "Ruang & Jadwal", Icon: CalendarClock },
  { n: 2, label: "Fasilitas Tambahan", Icon: PackagePlus },
  { n: 3, label: "Data Pemohon", Icon: User },
  { n: 4, label: "Ringkasan", Icon: ClipboardCheck },
];
const ACTIVITY_TYPES = ["Seminar", "Rapat", "Resepsi / Pesta", "Wisuda", "Workshop / Pelatihan", "Kompetisi", "Olahraga", "Event Publik", "Hunian / Menginap", "Lainnya"];

export default function RequestWizard() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [facilities, setFacilities] = useState([]);
  const [facilityId, setFacilityId] = useState(params.get("facility") || "");
  const [facility, setFacility] = useState(null);
  const [amenityList, setAmenityList] = useState([]);
  const [spaceId, setSpaceId] = useState(params.get("space") || "");
  const [slot, setSlot] = useState({ date: params.get("date") || "", start_time: params.get("start") || "08:00", end_time: params.get("end") || "12:00" });
  const [check, setCheck] = useState(null);
  const [qty, setQty] = useState({});
  const [form, setForm] = useState({ name: "", whatsapp: "", email: "", organization: "", activity_type: "Seminar", purpose: "", participants: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => { api.get("/facilities").then((r) => setFacilities(r.data)); }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step, result]);

  useEffect(() => {
    if (!facilityId) return undefined;
    let alive = true;
    api.get(`/facilities/${facilityId}`).then((r) => {
      if (!alive) return;
      setFacility(r.data);
      setSpaceId((cur) => (r.data.spaces.some((s) => s.id === cur) ? cur : r.data.spaces[0]?.id || ""));
    }).catch(() => toast.error("Fasilitas tidak ditemukan"));
    api.get("/amenities", { params: { building_id: facilityId } }).then((r) => alive && setAmenityList(r.data));
    return () => { alive = false; };
  }, [facilityId]);

  const space = facility?.spaces.find((s) => s.id === spaceId);

  // Datang dari halaman detail dengan jadwal lengkap -> langsung cek ketersediaan.
  useEffect(() => {
    if (!space || check || !params.get("date")) return;
    api.post("/availability/check", { facility_id: facility.id, space_id: space.id, ...slot })
      .then((r) => setCheck({ ...r.data, key: JSON.stringify({ s: space.id, ...slot }) })).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [space?.id]);

  const selectedAmenities = useMemo(() => amenityList.filter((a) => qty[a.id] > 0).map((a) => ({ ...a, qty: qty[a.id] })), [amenityList, qty]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const chooseFacility = (f) => { setFacility(null); setAmenityList([]); setCheck(null); setQty({}); setSpaceId(""); setFacilityId(f.id); };
  const chooseSpace = (id) => { setSpaceId(id); setCheck(null); };

  const slotChecked = check?.available && check.key === JSON.stringify({ s: spaceId, ...slot });
  // Asrama/hunian: formulir ringkas (nama, email, WhatsApp) tanpa data kegiatan.
  const isHunian = facility?.category === "Hunian";
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const waValid = form.whatsapp.replace(/\D/g, "").length >= 9;

  const canNext = () => {
    if (step === 1) return slotChecked;
    if (step === 3) {
      if (isHunian) return form.name.trim() && emailValid && waValid;
      return form.name.trim() && waValid && form.activity_type && (!form.email.trim() || emailValid);
    }
    return true;
  };
  const nextHint = {
    1: "Cek ketersediaan ruang terlebih dahulu (status harus Tersedia).",
    3: isHunian ? "Lengkapi nama, email yang valid, dan nomor WhatsApp." : "Lengkapi nama, nomor WhatsApp yang valid, dan jenis kegiatan.",
  };

  const submit = async () => {
    setSubmitting(true);
    // Buka tab lebih dulu (sinkron dengan klik) agar tidak diblokir popup blocker.
    const win = window.open("", "_blank");
    if (win) win.opener = null;
    try {
      const payload = {
        facility_id: facility.id, space_id: space.id, ...slot,
        amenities: selectedAmenities.map((a) => ({ amenity_id: a.id, qty: a.qty })),
        ...form, email: form.email.trim() || null, participants: parseInt(form.participants, 10) || 0,
        ...(isHunian ? { activity_type: "Hunian / Menginap", organization: "", purpose: "", participants: 0, notes: "" } : {}),
      };
      const res = await api.post("/inquiries", payload);
      setResult(res.data);
      if (win) {
        win.location.href = res.data.whatsapp_url;
        api.post(`/inquiries/${res.data.inquiry_code}/sent`).catch(() => {});
      }
      toast.success(`Inquiry tercatat: ${res.data.inquiry_code}`);
    } catch (e) {
      if (win) win.close();
      const detail = e.response?.data?.detail;
      toast.error(formatApiError(detail));
      if (e.response?.status === 409) { setCheck(null); setStep(1); }
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500";

  if (result) {
    return (
      <div className="container-unib py-16 max-w-xl text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <Check className="w-10 h-10 text-emerald-600" />
        </motion.div>
        <h1 className="mt-6 font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">Inquiry Tercatat</h1>
        <p className="mt-2 text-slate-600">Lanjutkan percakapan dengan Admin BPU melalui WhatsApp. Simpan Inquiry ID untuk melacak status.</p>
        <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-6 text-left space-y-2 text-sm">
          {[
            ["Inquiry ID", <span className="font-mono font-bold text-amber-600" data-testid="request-result-id">{result.inquiry_code}</span>],
            ["Gedung", result.building_name],
            ["Unit", result.space_name],
            ["Tanggal", formatDateId(result.date)],
            ["Waktu", `${formatTimeId(result.start_time)} s.d. ${formatTimeId(result.end_time)}`],
            ["Tarif", result.displayed_price],
            ["Status", <span className="font-semibold text-amber-600">{result.status_label}</span>],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4"><span className="text-slate-500">{k}</span><span className="font-medium text-slate-900 text-right">{v}</span></div>
          ))}
        </div>
        <a href={result.whatsapp_url} target="_blank" rel="noreferrer" data-testid="request-result-whatsapp"
          onClick={() => api.post(`/inquiries/${result.inquiry_code}/sent`).catch(() => {})}
          className="mt-6 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
          <MessageCircle className="w-5 h-5" /> Ajukan via WhatsApp
        </a>
        <div className="mt-3 flex gap-3">
          <button onClick={() => nav(`/track?id=${result.inquiry_code}`)} className="flex-1 border border-slate-300 rounded-xl py-3 font-semibold text-slate-700 hover:bg-slate-50">Lacak Status</button>
          <button onClick={() => nav("/explore")} className="flex-1 border border-slate-300 rounded-xl py-3 font-semibold text-slate-700 hover:bg-slate-50">Kembali</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="bg-slate-900 text-white">
        <div className="container-unib py-10">
          <h1 className="font-heading text-3xl font-extrabold">Ajukan Permintaan Penyewaan</h1>
          <p className="text-slate-300 mt-2">Pilih ruang dan jadwal, cek ketersediaan, lalu ajukan via WhatsApp. Tarif final dan persyaratan dikonfirmasi oleh BPU.</p>
        </div>
      </section>

      <div className="container-unib py-10 max-w-5xl">
        {/* Stepper */}
        <div className="flex items-center justify-between relative mb-10 max-w-3xl mx-auto">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200" />
          <div className="absolute top-5 left-0 h-0.5 bg-amber-500 transition-all duration-500" style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} />
          {STEPS.map((s) => (
            <div key={s.n} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all
                ${step === s.n ? "bg-amber-500 text-slate-950 ring-4 ring-amber-500/20 scale-110" : step > s.n ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400 border border-slate-200"}`}>
                {step > s.n ? <Check className="w-5 h-5" /> : s.n}
              </div>
              <span className={`text-[11px] font-medium text-center max-w-[90px] ${step >= s.n ? "text-slate-900" : "text-slate-400"}`}>{s.label}</span>
            </div>
          ))}
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <h2 className="font-heading text-xl font-bold text-slate-900">1. Pilih Gedung / Fasilitas</h2>
                <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar pb-1">
                  {facilities.map((f) => (
                    <button key={f.id} onClick={() => f.id !== facilityId && chooseFacility(f)} data-testid={`req-facility-${f.slug}`}
                      className={`flex gap-3 p-3 rounded-xl border text-left transition-all w-64 shrink-0 ${facilityId === f.id ? "border-amber-500 bg-amber-50 ring-1 ring-amber-500" : "border-slate-200 hover:border-amber-300"}`}>
                      <span className="w-14 h-14 rounded-lg overflow-hidden shrink-0">{f.images?.[0] ? <img src={mediaSrc(f.images[0])} alt="" className="w-full h-full object-cover" /> : <MediaFallback />}</span>
                      <span className="min-w-0">
                        <span className="block font-heading font-semibold text-sm text-slate-900 truncate">{f.name}</span>
                        <span className="block text-xs text-slate-500 truncate">{f.price_summary?.text}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {facility && (
                <div>
                  <h2 className="font-heading text-xl font-bold text-slate-900">2. Pilih Unit yang Disewa</h2>
                  <p className="text-sm text-slate-500 mt-1 mb-4">Sewa seluruh gedung, atau pilih ruang/area yang bisa disewa terpisah.</p>
                  <SpacePicker spaces={facility.spaces} value={spaceId} onChange={chooseSpace} testPrefix="req-space" />
                </div>
              )}

              {facility && space && (
                <div>
                  <h2 className="font-heading text-xl font-bold text-slate-900 mb-4">3. Pilih Tanggal & Waktu</h2>
                  <SpaceAvailability facility={facility} space={space} value={slot} onChange={setSlot} result={check} onResult={setCheck} />
                </div>
              )}
            </div>
          )}

          {step === 2 && space && (
            <div className="space-y-8">
              <div>
                <h2 className="font-heading text-xl font-bold text-slate-900">Fasilitas Tambahan <span className="text-sm font-normal text-slate-400">(opsional)</span></h2>
                {amenityList.length === 0 ? <p className="mt-3 text-sm text-slate-500">Tidak ada fasilitas tambahan untuk gedung ini.</p> : (
                  <div className="mt-4 space-y-2">
                    {amenityList.map((a) => {
                      const n = qty[a.id] || 0;
                      const max = Math.max(a.max_qty || 1, 1);
                      const setN = (v) => setQty((q) => ({ ...q, [a.id]: Math.max(0, Math.min(max, v)) }));
                      return (
                        <div key={a.id} className={`flex items-center justify-between gap-4 p-4 rounded-xl border ${n > 0 ? "border-amber-500 bg-amber-50" : "border-slate-200"}`}>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{a.name}</p>
                            <p className="text-xs text-slate-500">{a.price_information || (a.price ? `${formatRupiah(a.price)} / ${a.unit}` : "Perlu konfirmasi BPU")}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" aria-label={`Kurangi ${a.name}`} onClick={() => setN(n - 1)} disabled={n === 0} className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center disabled:opacity-30"><Minus className="w-4 h-4" /></button>
                            <input aria-label={`Jumlah ${a.name}`} type="number" min={0} max={max} value={n} onChange={(e) => setN(parseInt(e.target.value, 10) || 0)} className="w-16 text-center border border-slate-300 rounded-lg py-1.5 text-sm" />
                            <button type="button" aria-label={`Tambah ${a.name}`} onClick={() => setN(n + 1)} disabled={n >= max} className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center disabled:opacity-30"><Plus className="w-4 h-4" /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-heading text-xl font-bold text-slate-900">Data Pemohon</h2>
              {isHunian ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2"><label className="text-sm font-medium text-slate-700">Nama Lengkap *</label><input data-testid="req-name" autoComplete="name" className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nama lengkap Anda" /></div>
                  <div><label className="text-sm font-medium text-slate-700">Email *</label><input data-testid="req-email" type="email" autoComplete="email" className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@contoh.com" /></div>
                  <div><label className="text-sm font-medium text-slate-700">Nomor WhatsApp *</label><input data-testid="req-whatsapp" type="tel" inputMode="tel" autoComplete="tel" className={inputCls} value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="0812xxxxxxxx" /></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium text-slate-700">Nama Lengkap *</label><input data-testid="req-name" autoComplete="name" className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nama lengkap Anda" /></div>
                    <div><label className="text-sm font-medium text-slate-700">Nomor WhatsApp *</label><input data-testid="req-whatsapp" type="tel" inputMode="tel" autoComplete="tel" className={inputCls} value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="0812xxxxxxxx" /></div>
                    <div><label className="text-sm font-medium text-slate-700">Email</label><input data-testid="req-email" type="email" autoComplete="email" className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@contoh.com (opsional)" /></div>
                    <div><label className="text-sm font-medium text-slate-700">Organisasi / Instansi</label><input data-testid="req-org" className={inputCls} value={form.organization} onChange={(e) => set("organization", e.target.value)} placeholder="Opsional" /></div>
                    <div><label className="text-sm font-medium text-slate-700">Jenis Kegiatan *</label>
                      <select data-testid="req-activity-type" className={inputCls} value={form.activity_type} onChange={(e) => set("activity_type", e.target.value)}>
                        {ACTIVITY_TYPES.map((a) => <option key={a}>{a}</option>)}
                      </select></div>
                    <div><label className="text-sm font-medium text-slate-700">Perkiraan Peserta</label><input data-testid="req-participants" type="number" min={0} className={inputCls} value={form.participants} onChange={(e) => set("participants", e.target.value)} placeholder="Jumlah orang" /></div>
                  </div>
                  <div><label className="text-sm font-medium text-slate-700">Nama / Tujuan Kegiatan</label><input data-testid="req-purpose" className={inputCls} value={form.purpose} onChange={(e) => set("purpose", e.target.value)} placeholder="Contoh: Seminar Nasional Teknologi" /></div>
                  <div><label className="text-sm font-medium text-slate-700">Catatan</label><textarea data-testid="req-desc" rows={3} className={inputCls} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Kebutuhan lain (opsional)" /></div>
                </>
              )}
              {form.email.trim() && !emailValid && <p className="text-sm text-rose-600">Format email belum benar.</p>}
            </div>
          )}

          {step === 4 && space && (
            <div>
              <h2 className="font-heading text-xl font-bold text-slate-900 mb-1">Ringkasan Penyewaan</h2>
              <p className="text-sm text-slate-500 mb-5">Periksa kembali sebelum diajukan. Sistem akan membuat Inquiry ID lalu membuka WhatsApp BPU dengan pesan otomatis.</p>
              <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 text-sm">
                {[
                  ["Gedung", facility.name],
                  ["Unit", space.name],
                  ["Tanggal", formatDateId(slot.date)],
                  ["Waktu", `${formatTimeId(slot.start_time)} s.d. ${formatTimeId(slot.end_time)}`],
                  ["Tarif", space.price_text],
                  ["Fasilitas Tambahan", selectedAmenities.length ? selectedAmenities.map((a) => `${a.name} ×${a.qty}`).join(", ") : "Tidak ada"],
                  ["Pemohon", `${form.name}${!isHunian && form.organization ? ` (${form.organization})` : ""}`],
                  ...(isHunian || form.email.trim() ? [["Email", form.email.trim()]] : []),
                  ["WhatsApp", form.whatsapp],
                  ...(isHunian ? [] : [
                    ["Kegiatan", [form.activity_type, form.purpose].filter(Boolean).join(", ")],
                    ["Peserta", form.participants ? `${form.participants} orang` : "Belum diisi"],
                  ]),
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-6 px-4 py-3"><span className="text-slate-500">{k}</span><span className="font-medium text-slate-900 text-right">{v}</span></div>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500">Estimasi final dikonfirmasi BPU. Tidak ada pembayaran online di sistem ini. Pembayaran dan administrasi ditangani langsung oleh BPU.</p>
            </div>
          )}

          <div className="mt-8 flex justify-between gap-3">
            <button onClick={() => setStep(step - 1)} disabled={step === 1}
              className="flex items-center gap-1 px-5 py-2.5 rounded-xl font-semibold text-slate-600 border border-slate-300 disabled:opacity-40 hover:bg-slate-50">
              <ArrowLeft className="w-4 h-4" /> Kembali
            </button>
            {step < 4 ? (
              <button data-testid="req-next" onClick={() => canNext() ? setStep(step + 1) : toast.error(nextHint[step] || "Lengkapi data wajib (*)")}
                className={`flex items-center gap-1 font-semibold px-6 py-2.5 rounded-xl transition-colors ${canNext() ? "bg-amber-500 hover:bg-amber-600 text-slate-950" : "bg-slate-200 text-slate-500"}`}>
                {step === 1 ? "Lanjutkan Permintaan" : "Lanjut"} <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button data-testid="req-submit" onClick={submit} disabled={submitting}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60">
                <MessageCircle className="w-4 h-4" /> {submitting ? "Memproses..." : "Ajukan via WhatsApp"}
              </button>
            )}
          </div>
        </motion.div>
        <p className="mt-4 text-center text-sm text-slate-500">Sudah punya Inquiry ID? <Link to="/track" className="text-amber-600 font-semibold hover:underline">Lacak status</Link></p>
      </div>
    </div>
  );
}

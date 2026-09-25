import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, User, CalendarClock, Building2, ClipboardCheck, ArrowRight, ArrowLeft, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { api, buildWaLink, formatApiError } from "@/lib/api";

const STEPS = [
  { n: 1, label: "Data Pengguna", Icon: User },
  { n: 2, label: "Detail Kegiatan", Icon: CalendarClock },
  { n: 3, label: "Pilih Fasilitas", Icon: Building2 },
  { n: 4, label: "Konfirmasi", Icon: ClipboardCheck },
];

export default function RequestWizard() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [facilities, setFacilities] = useState([]);
  const [waNumber, setWaNumber] = useState("6282185028768");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const [form, setForm] = useState({
    name: "", email: "", whatsapp: "", organization: "", purpose: "", participants: "",
    activity_type: "Seminar", description: "",
    facility_id: params.get("facility") || "", date: params.get("date") || "",
    start_time: "08:00", end_time: "12:00", package: "Custom", services: [],
  });

  useEffect(() => {
    api.get("/facilities").then((r) => setFacilities(r.data));
    api.get("/config").then((r) => setWaNumber(r.data.whatsapp_bpu));
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const selectedFacility = facilities.find((f) => f.id === form.facility_id);

  const canNext = () => {
    if (step === 1) return form.name && form.email && form.whatsapp && form.purpose;
    if (step === 2) return form.date && form.start_time && form.end_time && form.activity_type;
    if (step === 3) return form.facility_id;
    return true;
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload = { ...form, participants: parseInt(form.participants) || 0 };
      const res = await api.post("/requests", payload);
      setResult(res.data);
      toast.success(`Permintaan terkirim! ID: ${res.data.request_id}`);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500";

  if (result) {
    const waMsg = `Halo Admin BPU UNIB, saya ingin mengajukan penggunaan ${result.facility_name} untuk kegiatan ${result.activity_type} pada tanggal ${result.date} pukul ${result.start_time}-${result.end_time}. Request ID: ${result.request_id}.`;
    return (
      <div className="container-unib py-16 max-w-xl text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <Check className="w-10 h-10 text-emerald-600" />
        </motion.div>
        <h1 className="mt-6 font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">Permintaan Terkirim!</h1>
        <p className="mt-2 text-slate-600">Simpan Request ID Anda untuk melacak status permintaan.</p>
        <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-6 text-left space-y-2">
          <div className="flex justify-between"><span className="text-slate-500">Request ID</span><span className="font-mono font-bold text-amber-600" data-testid="request-result-id">{result.request_id}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Fasilitas</span><span className="font-medium text-slate-900">{result.facility_name}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Tanggal</span><span className="font-medium text-slate-900">{result.date}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Waktu</span><span className="font-medium text-slate-900">{result.start_time} - {result.end_time}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="font-medium text-amber-600 capitalize">{result.status}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Ketersediaan Slot</span><span className={`font-medium ${result.slot_available ? "text-emerald-600" : "text-rose-600"}`}>{result.slot_available ? "Tersedia" : "Perlu Cek Ulang"}</span></div>
        </div>
        <a href={buildWaLink(waNumber, waMsg)} target="_blank" rel="noreferrer" data-testid="request-result-whatsapp"
          className="mt-6 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
          <MessageCircle className="w-5 h-5" /> Lanjutkan via WhatsApp BPU
        </a>
        <div className="mt-3 flex gap-3">
          <button onClick={() => nav(`/track?id=${result.request_id}`)} className="flex-1 border border-slate-300 rounded-xl py-3 font-semibold text-slate-700 hover:bg-slate-50">Lacak Status</button>
          <button onClick={() => nav("/explore")} className="flex-1 border border-slate-300 rounded-xl py-3 font-semibold text-slate-700 hover:bg-slate-50">Kembali</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="bg-slate-900 text-white">
        <div className="container-unib py-10">
          <h1 className="font-heading text-3xl font-extrabold">Ajukan Pemanfaatan Fasilitas</h1>
          <p className="text-slate-300 mt-2">Isi formulir berikut untuk mengajukan pemanfaatan. Tim BPU akan menghubungi Anda melalui WhatsApp.</p>
        </div>
      </section>

      <div className="container-unib py-10 max-w-3xl">
        {/* Stepper */}
        <div className="flex items-center justify-between relative mb-10">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200" />
          <div className="absolute top-5 left-0 h-0.5 bg-amber-500 transition-all duration-500" style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} />
          {STEPS.map((s) => (
            <div key={s.n} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all
                ${step === s.n ? "bg-amber-500 text-slate-950 ring-4 ring-amber-500/20 scale-110" : step > s.n ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400 border border-slate-200"}`}>
                {step > s.n ? <Check className="w-5 h-5" /> : s.n}
              </div>
              <span className={`text-[11px] font-medium text-center max-w-[70px] ${step >= s.n ? "text-slate-900" : "text-slate-400"}`}>{s.label}</span>
            </div>
          ))}
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-heading text-xl font-bold text-slate-900">Informasi Pengguna</h2>
              <div><label className="text-sm font-medium text-slate-700">Nama Lengkap *</label><input data-testid="req-name" className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nama lengkap Anda" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-slate-700">Email *</label><input data-testid="req-email" type="email" className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@contoh.com" /></div>
                <div><label className="text-sm font-medium text-slate-700">Nomor WhatsApp *</label><input data-testid="req-whatsapp" className={inputCls} value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="0812xxxxxxxx" /></div>
              </div>
              <div><label className="text-sm font-medium text-slate-700">Organisasi / Instansi</label><input data-testid="req-org" className={inputCls} value={form.organization} onChange={(e) => set("organization", e.target.value)} placeholder="Nama organisasi/instansi (opsional)" /></div>
              <div><label className="text-sm font-medium text-slate-700">Tujuan Kegiatan *</label><input data-testid="req-purpose" className={inputCls} value={form.purpose} onChange={(e) => set("purpose", e.target.value)} placeholder="Contoh: Seminar Nasional Teknologi" /></div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-heading text-xl font-bold text-slate-900">Detail Kegiatan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-slate-700">Jenis Kegiatan *</label>
                  <select data-testid="req-activity-type" className={inputCls} value={form.activity_type} onChange={(e) => set("activity_type", e.target.value)}>
                    {["Seminar", "Konferensi", "Workshop", "Wisuda", "Kompetisi", "Rapat Organisasi", "Event Publik", "Lainnya"].map((a) => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div><label className="text-sm font-medium text-slate-700">Jumlah Peserta</label><input data-testid="req-participants" type="number" className={inputCls} value={form.participants} onChange={(e) => set("participants", e.target.value)} placeholder="Perkiraan jumlah" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className="text-sm font-medium text-slate-700">Tanggal *</label><input data-testid="req-date" type="date" className={inputCls} value={form.date} onChange={(e) => set("date", e.target.value)} /></div>
                <div><label className="text-sm font-medium text-slate-700">Mulai *</label><input data-testid="req-start" type="time" className={inputCls} value={form.start_time} onChange={(e) => set("start_time", e.target.value)} /></div>
                <div><label className="text-sm font-medium text-slate-700">Selesai *</label><input data-testid="req-end" type="time" className={inputCls} value={form.end_time} onChange={(e) => set("end_time", e.target.value)} /></div>
              </div>
              <div><label className="text-sm font-medium text-slate-700">Deskripsi Kegiatan</label><textarea data-testid="req-desc" rows={3} className={inputCls} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Jelaskan kebutuhan kegiatan Anda..." /></div>
            </div>
          )}
          {step === 3 && (
            <div>
              <h2 className="font-heading text-xl font-bold text-slate-900 mb-4">Pilih Fasilitas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto no-scrollbar">
                {facilities.map((f) => (
                  <button key={f.id} onClick={() => set("facility_id", f.id)} data-testid={`req-facility-${f.slug}`}
                    className={`flex gap-3 p-3 rounded-xl border text-left transition-all ${form.facility_id === f.id ? "border-amber-500 bg-amber-50 ring-1 ring-amber-500" : "border-slate-200 hover:border-amber-300"}`}>
                    <img src={f.images?.[0]} alt={f.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                    <div className="min-w-0">
                      <p className="font-heading font-semibold text-sm text-slate-900 truncate">{f.name}</p>
                      <p className="text-xs text-slate-500">{f.category} · {f.capacity} org</p>
                      {form.facility_id === f.id && <span className="text-xs text-amber-600 font-semibold flex items-center gap-1 mt-1"><Check className="w-3 h-3" /> Dipilih</span>}
                    </div>
                  </button>
                ))}
              </div>
              {selectedFacility && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">Layanan Tambahan (opsional)</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedFacility.services.map((s) => (
                      <button key={s} onClick={() => set("services", form.services.includes(s) ? form.services.filter((x) => x !== s) : [...form.services, s])}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${form.services.includes(s) ? "bg-amber-500 text-slate-950 border-amber-500" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-amber-400"}`}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {step === 4 && (
            <div>
              <h2 className="font-heading text-xl font-bold text-slate-900 mb-4">Konfirmasi Permintaan</h2>
              <div className="space-y-3 text-sm">
                {[
                  ["Nama", form.name], ["Email", form.email], ["WhatsApp", form.whatsapp],
                  ["Organisasi", form.organization || "-"], ["Tujuan", form.purpose],
                  ["Jenis Kegiatan", form.activity_type], ["Peserta", form.participants || "-"],
                  ["Fasilitas", selectedFacility?.name || "-"], ["Tanggal", form.date],
                  ["Waktu", `${form.start_time} - ${form.end_time}`],
                  ["Layanan", form.services.join(", ") || "-"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">{k}</span><span className="font-medium text-slate-900 text-right max-w-[60%]">{v}</span></div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between">
            <button onClick={() => setStep(step - 1)} disabled={step === 1}
              className="flex items-center gap-1 px-5 py-2.5 rounded-xl font-semibold text-slate-600 border border-slate-300 disabled:opacity-40 hover:bg-slate-50">
              <ArrowLeft className="w-4 h-4" /> Kembali
            </button>
            {step < 4 ? (
              <button data-testid="req-next" onClick={() => canNext() ? setStep(step + 1) : toast.error("Lengkapi data wajib (*)")}
                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-6 py-2.5 rounded-xl transition-colors">
                Lanjut <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button data-testid="req-submit" onClick={submit} disabled={submitting}
                className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60">
                {submitting ? "Mengirim..." : "Kirim Permintaan"} <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, MessageCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError, fetchSiteConfig, buildWaLink, mediaSrc } from "@/lib/api";
import { MediaUploader } from "@/components/admin/MediaUploader";

const inputCls = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500";

export default function AdminSettings() {
  const [form, setForm] = useState(null);
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/config").then((r) => setForm({ ...r.data, hero_slides: r.data.hero_slides || [] }));
    api.get("/facilities", { params: { include_inactive: true } }).then((r) => {
      const all = new Set();
      r.data.forEach((f) => (f.images || []).forEach((i) => all.add(i)));
      setImages([...all]);
    });
  }, []);

  if (!form) return <p className="text-slate-400">Memuat pengaturan...</p>;

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const setSlide = (i, k, v) => set("hero_slides", form.hero_slides.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
  const move = (i, d) => {
    const arr = [...form.hero_slides];
    const j = i + d;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    set("hero_slides", arr);
  };

  const save = async () => {
    setSaving(true);
    try {
      const { whatsapp_bpu, contact_phone, contact_email, address, hero_slides } = form;
      const r = await api.put("/settings", { whatsapp_bpu, contact_phone, contact_email, address, hero_slides });
      setForm({ ...r.data, hero_slides: r.data.hero_slides || [] });
      fetchSiteConfig(true);
      toast.success("Pengaturan tersimpan");
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Pengaturan</h1>
          <p className="text-slate-500 text-sm mt-1">Nomor WhatsApp BPU, kontak, dan slide banner halaman utama.</p>
        </div>
        <button data-testid="settings-save" onClick={save} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 disabled:opacity-60"><Save className="w-4 h-4" /> {saving ? "Menyimpan..." : "Simpan"}</button>
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <h2 className="font-heading font-semibold text-slate-900">WhatsApp & Kontak BPU</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Nomor WhatsApp Admin BPU</label>
            <input data-testid="settings-wa" className={inputCls} value={form.whatsapp_bpu} onChange={(e) => set("whatsapp_bpu", e.target.value)} placeholder="6282379869966" />
            <p className="text-[11px] text-slate-400 mt-1">Tujuan semua pesan inquiry otomatis. Format 08xx atau 628xx.</p>
            <a href={buildWaLink(form.whatsapp_bpu, "Tes nomor WhatsApp BPU UNIB")} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium hover:underline"><MessageCircle className="w-4 h-4" /> Uji tautan WhatsApp</a>
          </div>
          <div><label className="text-sm font-medium text-slate-700">Nomor Telepon (tampilan)</label><input className={inputCls} value={form.contact_phone || ""} onChange={(e) => set("contact_phone", e.target.value)} placeholder="+62 823-7986-9966" /></div>
          <div><label className="text-sm font-medium text-slate-700">Email</label><input className={inputCls} value={form.contact_email || ""} onChange={(e) => set("contact_email", e.target.value)} /></div>
          <div><label className="text-sm font-medium text-slate-700">Alamat</label><input className={inputCls} value={form.address || ""} onChange={(e) => set("address", e.target.value)} /></div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-semibold text-slate-900">Slide Banner Halaman Utama</h2>
            <p className="text-xs text-slate-500">Gambar berganti otomatis setiap 5 detik. Urutan di bawah = urutan tampil.</p>
          </div>
          <button data-testid="slide-add" onClick={() => set("hero_slides", [...form.hero_slides, { image: images[0] || "", caption: "", link: "" }])}
            className="text-sm font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"><Plus className="w-4 h-4" /> Tambah Slide</button>
        </div>
        <datalist id="facility-images">{images.map((i) => <option key={i} value={i} />)}</datalist>
        {form.hero_slides.length === 0 && <p className="text-sm text-slate-400">Belum ada slide.</p>}
        {form.hero_slides.map((s, i) => (
          <div key={i} className="flex flex-col sm:flex-row gap-4 p-3 rounded-xl border border-slate-200">
            <div className="w-full sm:w-40 h-24 rounded-lg overflow-hidden bg-slate-100 shrink-0">{s.image && <img src={mediaSrc(s.image)} alt="" className="w-full h-full object-cover" />}</div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="sm:col-span-2"><label className="text-xs font-medium text-slate-500">Gambar (pilih dari foto fasilitas, tempel URL, atau upload)</label>
                <input list="facility-images" className={inputCls} value={s.image} onChange={(e) => setSlide(i, "image", e.target.value)} />
                <div className="mt-2"><MediaUploader kind="image" multiple={false} value={[]} onChange={(v) => v[0] && setSlide(i, "image", v[0])} /></div>
              </div>
              <div className="sm:col-span-2"><label className="text-xs font-medium text-slate-500">Keterangan</label><input className={inputCls} value={s.caption} onChange={(e) => setSlide(i, "caption", e.target.value)} placeholder="Gedung Serba Guna (GSG)" /></div>
            </div>
            <div className="flex sm:flex-col gap-2 justify-end">
              <button aria-label="Naikkan" onClick={() => move(i, -1)} disabled={i === 0} className="p-2 rounded-lg border border-slate-200 disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
              <button aria-label="Turunkan" onClick={() => move(i, 1)} disabled={i === form.hero_slides.length - 1} className="p-2 rounded-lg border border-slate-200 disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
              <button aria-label="Hapus slide" onClick={() => set("hero_slides", form.hero_slides.filter((_, j) => j !== i))} className="p-2 rounded-lg border border-rose-200 text-rose-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

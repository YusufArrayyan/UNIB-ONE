import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Star, LayoutGrid, Users } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError, priceText, mediaSrc } from "@/lib/api";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { MediaFallback } from "@/components/BrandLogo";

const CATS = ["Gedung", "Ruang", "Aula", "Lapangan", "Laboratorium", "Hunian", "Lainnya"];
const EMPTY = {
  name: "", code: "", category: "Gedung", description: "", location: "", address: "",
  latitude: -3.7586, longitude: 102.2716, capacity: 0, capacity_label: "", area: "", operating_hours: "08.00 s.d. 21.00",
  rules: [], features: [], not_included: [], services: [], images: [], videos: [], suitable_for: [],
  pic_name: "BPU Universitas Bengkulu", pic_contact: "", status: "active", featured: false,
};
const EMPTY_SPACE = {
  code: "", name: "", description: "", capacity: 0, capacity_label: "", amenities: [], images: [],
  is_full_building: false, group: "", sort_order: 0, status: "active",
  pricing_rule: { mode: "auto", unit: "", note: "", options: [] },
};
const inputCls = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500";
const lines = (arr) => (arr || []).join("\n");
const toLines = (v) => v.split("\n").map((x) => x.trim()).filter(Boolean);

function Modal({ title, onClose, children, footer, wide }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl w-full max-h-[90vh] overflow-y-auto ${wide ? "max-w-4xl" : "max-w-2xl"}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h3 className="font-heading font-bold text-lg">{title}</h3>
          <button onClick={onClose} aria-label="Tutup"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
        {footer && <div className="p-5 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 bg-white">{footer}</div>}
      </div>
    </div>
  );
}

const Field = ({ label, children, hint }) => (
  <div><label className="text-sm font-medium text-slate-700">{label}</label>{children}{hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}</div>
);

function SpaceForm({ building, initial, onClose, onSaved }) {
  const [form, setForm] = useState({ ...EMPTY_SPACE, ...initial, pricing_rule: { ...EMPTY_SPACE.pricing_rule, ...(initial?.pricing_rule || {}) } });
  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const setRule = (k, v) => setForm((s) => ({ ...s, pricing_rule: { ...s.pricing_rule, [k]: v } }));
  const setOpt = (i, k, v) => setRule("options", form.pricing_rule.options.map((o, j) => (j === i ? { ...o, [k]: v } : o)));

  const save = async () => {
    if (!form.code.trim() || !form.name.trim()) { toast.error("Kode dan nama ruang wajib diisi"); return; }
    const payload = {
      ...form, building_id: building.id, code: form.code.trim().toUpperCase(),
      capacity: parseInt(form.capacity, 10) || 0, sort_order: parseInt(form.sort_order, 10) || 0,
      pricing_rule: {
        ...form.pricing_rule,
        options: form.pricing_rule.options.filter((o) => o.label.trim()).map((o) => ({
          label: o.label.trim(), unit: o.unit || "", price: parseInt(o.price, 10) || 0,
          price_incl_tax: o.price_incl_tax ? parseInt(o.price_incl_tax, 10) : null,
        })),
      },
    };
    delete payload.id; delete payload.price_text; delete payload.created_at; delete payload.updated_at;
    try {
      if (initial?.id) await api.put(`/spaces/${initial.id}`, payload);
      else await api.post("/spaces", payload);
      toast.success("Ruang/unit tersimpan");
      onSaved();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  return (
    <Modal wide title={`${initial?.id ? "Edit" : "Tambah"} Ruang / Unit · ${building.name}`} onClose={onClose}
      footer={<><button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-slate-300 font-semibold text-slate-700">Batal</button>
        <button data-testid="space-save" onClick={save} className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold">Simpan</button></>}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Kode Ruang *" hint="Contoh: GSG-R01"><input className={inputCls} value={form.code} onChange={(e) => set("code", e.target.value)} /></Field>
        <div className="sm:col-span-2"><Field label="Nama Ruang *"><input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} /></Field></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Kapasitas (angka)"><input type="number" className={inputCls} value={form.capacity} onChange={(e) => set("capacity", e.target.value)} /></Field>
        <Field label="Label Kapasitas" hint="Contoh: 40 sampai 50 orang"><input className={inputCls} value={form.capacity_label} onChange={(e) => set("capacity_label", e.target.value)} /></Field>
        <Field label="Urutan"><input type="number" className={inputCls} value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} /></Field>
      </div>
      <Field label="Kategori Unit" hint="Mengelompokkan unit di halaman publik, mis. Sewa Full Gedung, Ruang Terpisah, Ruang Rapat, Kamar.">
        <input list="space-groups" className={inputCls} value={form.group || ""} onChange={(e) => set("group", e.target.value)} placeholder={form.is_full_building ? "Sewa Full Gedung" : "Ruang Terpisah"} />
        <datalist id="space-groups">{["Sewa Full Gedung", "Ruang Terpisah", "Ruang Rapat", "Area", "Kamar", "Kamar per Lantai", "Lapangan"].map((g) => <option key={g} value={g} />)}</datalist>
      </Field>
      <Field label="Deskripsi"><textarea rows={2} className={inputCls} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Fasilitas Ruang (satu per baris)"><textarea rows={4} className={inputCls} value={lines(form.amenities)} onChange={(e) => set("amenities", toLines(e.target.value))} /></Field>
        <Field label="Foto Ruang"><MediaUploader kind="image" value={form.images || []} onChange={(v) => set("images", v)} testId="space-images" /></Field>
      </div>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" className="accent-amber-500 w-4 h-4" checked={form.is_full_building} onChange={(e) => set("is_full_building", e.target.checked)} /> Full Building (memeriksa seluruh ruang di gedung ini)</label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" className="accent-amber-500 w-4 h-4" checked={form.status === "active"} onChange={(e) => set("status", e.target.checked ? "active" : "inactive")} /> Aktif</label>
      </div>

      <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
        <p className="font-heading font-semibold text-slate-900">Aturan Tarif (pricing_rule)</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Tampilan">
            <select className={inputCls} value={form.pricing_rule.mode} onChange={(e) => setRule("mode", e.target.value)}>
              <option value="auto">Otomatis (tunggal / rentang)</option>
              <option value="starting">Mulai dari (tarif kompleks)</option>
              <option value="confirm">Perlu konfirmasi BPU</option>
            </select>
          </Field>
          <Field label="Satuan default" hint="Contoh: kegiatan/hari, 8 jam"><input className={inputCls} value={form.pricing_rule.unit} onChange={(e) => setRule("unit", e.target.value)} /></Field>
          <Field label="Catatan tarif"><input className={inputCls} value={form.pricing_rule.note} onChange={(e) => setRule("note", e.target.value)} /></Field>
        </div>
        <div className="space-y-2">
          <div className="hidden sm:grid grid-cols-[1fr_130px_130px_110px_32px] gap-2 text-[11px] font-semibold uppercase text-slate-400">
            <span>Kategori / Layanan</span><span>Tarif (Rp)</span><span>Total incl. pajak</span><span>Satuan</span><span />
          </div>
          {form.pricing_rule.options.map((o, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_130px_130px_110px_32px] gap-2">
              <input aria-label="Kategori" className={inputCls} value={o.label} onChange={(e) => setOpt(i, "label", e.target.value)} placeholder="Kegiatan Masyarakat Umum (Non AC)" />
              <input aria-label="Tarif" type="number" className={inputCls} value={o.price ?? ""} onChange={(e) => setOpt(i, "price", e.target.value)} />
              <input aria-label="Total incl. pajak" type="number" className={inputCls} value={o.price_incl_tax ?? ""} onChange={(e) => setOpt(i, "price_incl_tax", e.target.value)} />
              <input aria-label="Satuan" className={inputCls} value={o.unit || ""} onChange={(e) => setOpt(i, "unit", e.target.value)} placeholder="(default)" />
              <button aria-label="Hapus opsi" onClick={() => setRule("options", form.pricing_rule.options.filter((_, j) => j !== i))} className="text-rose-500 hover:text-rose-700 flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          <button onClick={() => setRule("options", [...form.pricing_rule.options, { label: "", price: "", price_incl_tax: "", unit: "" }])}
            className="text-sm font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"><Plus className="w-4 h-4" /> Tambah kategori tarif</button>
        </div>
        <p className="text-sm">Tampilan publik: <span className="font-semibold text-slate-900">{priceText(form.pricing_rule)}</span></p>
      </div>
    </Modal>
  );
}

function SpacesManager({ building, onClose }) {
  const [spaces, setSpaces] = useState([]);
  const [editing, setEditing] = useState(undefined);
  const load = () => api.get("/spaces", { params: { building_id: building.id } }).then((r) => setSpaces(r.data));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const del = async (s) => {
    if (!window.confirm(`Hapus ruang ${s.code}?`)) return;
    await api.delete(`/spaces/${s.id}`); toast.success("Ruang dihapus"); load();
  };

  return (
    <>
      <Modal wide title={`Ruang / Unit · ${building.name}`} onClose={onClose}>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Gedung adalah induk; ruang/unit adalah yang dipilih penyewa dan dicek ketersediaannya.</p>
          <button data-testid="space-add" onClick={() => setEditing(null)} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-3 py-2 rounded-lg text-sm flex items-center gap-1 shrink-0"><Plus className="w-4 h-4" /> Tambah Ruang</button>
        </div>
        <div className="border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="p-3 font-medium">Kode</th><th className="p-3 font-medium">Nama</th><th className="p-3 font-medium">Kategori</th><th className="p-3 font-medium">Kapasitas</th><th className="p-3 font-medium">Tarif</th><th className="p-3 font-medium">Status</th><th className="p-3" />
            </tr></thead>
            <tbody>
              {spaces.length === 0 ? <tr><td colSpan={7} className="p-6 text-center text-slate-400">Belum ada ruang/unit.</td></tr> : spaces.map((s) => (
                <tr key={s.id} className="border-b border-slate-50">
                  <td className="p-3 font-mono font-semibold text-amber-700 whitespace-nowrap">{s.code}{s.is_full_building && <span className="block font-sans text-[10px] text-slate-500">Full Building</span>}</td>
                  <td className="p-3 text-slate-800">{s.name}</td>
                  <td className="p-3 text-slate-600 text-xs">{s.group || (s.is_full_building ? "Sewa Full Gedung" : "Ruang Terpisah")}</td>
                  <td className="p-3 text-slate-600">{s.capacity_label || s.capacity || "Belum diisi"}</td>
                  <td className="p-3 text-slate-700">{s.price_text}</td>
                  <td className="p-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>{s.status === "active" ? "Aktif" : "Nonaktif"}</span></td>
                  <td className="p-3 whitespace-nowrap">
                    <button aria-label={`Edit ${s.code}`} onClick={() => setEditing(s)} className="text-slate-600 hover:text-amber-600 mr-3"><Pencil className="w-4 h-4" /></button>
                    <button aria-label={`Hapus ${s.code}`} onClick={() => del(s)} className="text-rose-500 hover:text-rose-700"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
      {editing !== undefined && <SpaceForm building={building} initial={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); load(); }} />}
    </>
  );
}

export default function AdminFacilities() {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(undefined);
  const [form, setForm] = useState(EMPTY);
  const [spacesFor, setSpacesFor] = useState(null);

  const load = () => api.get("/facilities", { params: { include_inactive: true } }).then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const open = (f) => {
    if (f) { setEditing(f); setForm({ ...EMPTY, ...f }); }
    else { setEditing(null); setForm(EMPTY); }
  };
  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const save = async () => {
    try {
      const payload = { ...form, code: (form.code || "").trim().toUpperCase(), capacity: parseInt(form.capacity, 10) || 0, latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude) };
      if (editing) await api.put(`/facilities/${editing.id}`, payload);
      else await api.post("/facilities", payload);
      toast.success("Gedung tersimpan");
      setForm(EMPTY); setEditing(undefined); load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const del = async (f) => { if (!window.confirm(`Hapus ${f.name} beserta seluruh ruangnya?`)) return; await api.delete(`/facilities/${f.id}`); toast.success("Dihapus"); load(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-heading text-2xl font-bold text-slate-900">Gedung & Ruang</h1><p className="text-slate-500 text-sm mt-1">Kelola gedung (induk), ruang/unit, dan aturan tarif. Semua nama & harga di situs publik berasal dari sini.</p></div>
        <button data-testid="facility-add" onClick={() => open(null)} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5"><Plus className="w-4 h-4" /> Tambah Gedung</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((f) => (
          <div key={f.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="relative h-36">{f.images?.[0] ? <img src={mediaSrc(f.images[0])} alt={f.name} className="w-full h-full object-cover" /> : <MediaFallback label="Belum ada foto" />}
              {f.featured && <span className="absolute top-2 left-2 bg-amber-500 text-slate-950 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Star className="w-3 h-3" /> Unggulan</span>}
              <span className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full ${f.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>{f.status === "active" ? "Aktif" : "Nonaktif"}</span>
            </div>
            <div className="p-4">
              <span className="text-xs text-slate-400">{f.code && <b className="text-amber-700 font-mono">{f.code}</b>} {f.category} · <Users className="w-3 h-3 inline" /> {f.capacity_label || f.capacity}</span>
              <p className="font-heading font-semibold text-slate-900 mt-1 line-clamp-1">{f.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{f.space_count} ruang · {f.price_summary?.text}</p>
              <div className="mt-3 flex gap-2">
                <button data-testid={`facility-spaces-${f.slug}`} onClick={() => setSpacesFor(f)} className="flex-1 border border-amber-300 bg-amber-50 rounded-lg py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 flex items-center justify-center gap-1"><LayoutGrid className="w-4 h-4" /> Ruang/Unit</button>
                <button data-testid={`facility-edit-${f.slug}`} onClick={() => open(f)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1"><Pencil className="w-4 h-4" /> Edit</button>
                <button aria-label={`Hapus ${f.name}`} onClick={() => del(f)} className="border border-rose-200 text-rose-600 rounded-lg px-3 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing !== undefined && (
        <Modal title={editing ? "Edit Gedung" : "Tambah Gedung"} onClose={() => setEditing(undefined)}
          footer={<><button onClick={() => setEditing(undefined)} className="px-5 py-2.5 rounded-lg border border-slate-300 font-semibold text-slate-700">Batal</button>
            <button data-testid="facility-save" onClick={save} className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold">Simpan</button></>}>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3">
            <Field label="Nama Gedung / Fasilitas"><input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field label="Kode" hint="Contoh: GSG"><input className={inputCls} value={form.code} onChange={(e) => set("code", e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Kategori"><select className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value)}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Kapasitas (angka)"><input type="number" className={inputCls} value={form.capacity} onChange={(e) => set("capacity", e.target.value)} /></Field>
            <Field label="Label Kapasitas" hint="1.000 sampai 2.000 undangan"><input className={inputCls} value={form.capacity_label} onChange={(e) => set("capacity_label", e.target.value)} /></Field>
          </div>
          <Field label="Deskripsi"><textarea rows={3} className={inputCls} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Lokasi (Zona)"><input className={inputCls} value={form.location} onChange={(e) => set("location", e.target.value)} /></Field>
            <Field label="Luas"><input className={inputCls} value={form.area} onChange={(e) => set("area", e.target.value)} /></Field>
          </div>
          <Field label="Alamat"><input className={inputCls} value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Latitude"><input className={inputCls} value={form.latitude} onChange={(e) => set("latitude", e.target.value)} /></Field>
            <Field label="Longitude"><input className={inputCls} value={form.longitude} onChange={(e) => set("longitude", e.target.value)} /></Field>
            <Field label="Jam Operasional"><input className={inputCls} value={form.operating_hours} onChange={(e) => set("operating_hours", e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Foto Gedung" hint="Foto pertama dipakai sebagai sampul."><MediaUploader kind="image" value={form.images || []} onChange={(v) => set("images", v)} testId="facility-images" /></Field>
            <Field label="Video Gedung"><MediaUploader kind="video" value={form.videos || []} onChange={(v) => set("videos", v)} testId="facility-videos" /></Field>
            <Field label="Fasilitas Termasuk (satu per baris)"><textarea rows={5} className={inputCls} value={lines(form.features)} onChange={(e) => set("features", toLines(e.target.value))} /></Field>
            <Field label="Tidak Termasuk (satu per baris)"><textarea rows={5} className={inputCls} value={lines(form.not_included)} onChange={(e) => set("not_included", toLines(e.target.value))} /></Field>
            <Field label="Ketentuan Penggunaan (satu per baris)"><textarea rows={4} className={inputCls} value={lines(form.rules)} onChange={(e) => set("rules", toLines(e.target.value))} /></Field>
            <Field label="Cocok Untuk (satu per baris)"><textarea rows={4} className={inputCls} value={lines(form.suitable_for)} onChange={(e) => set("suitable_for", toLines(e.target.value))} /></Field>
          </div>
          <Field label="Layanan (satu per baris)"><textarea rows={2} className={inputCls} value={lines(form.services)} onChange={(e) => set("services", toLines(e.target.value))} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status"><select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}><option value="active">Aktif</option><option value="inactive">Nonaktif</option></select></Field>
            <label className="flex items-center gap-2 mt-6 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="accent-amber-500 w-4 h-4" /> Fasilitas Unggulan</label>
          </div>
          {!editing && <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">Setelah gedung disimpan, tambahkan ruang/unit dan tarifnya melalui tombol <b>Ruang/Unit</b>.</p>}
          {editing && <p className="text-xs text-slate-500">Tarif publik dihitung dari ruang/unit: <b>{editing.price_summary?.text}</b>.</p>}
        </Modal>
      )}

      {spacesFor && <SpacesManager building={spacesFor} onClose={() => { setSpacesFor(null); load(); }} />}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Star } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";

const CATS = ["Gedung", "Ruang", "Aula", "Lapangan", "Laboratorium", "Hunian", "Lainnya"];
const EMPTY = {
  name: "", category: "Gedung", description: "", location: "", address: "",
  latitude: -3.7586, longitude: 102.2716, capacity: 0, area: "", operating_hours: "08.00 - 21.00",
  rules: [], features: [], services: [], images: [], suitable_for: [],
  pic_name: "BPU Universitas Bengkulu", pic_contact: "6282185028768", status: "active", featured: false,
};

export default function AdminFacilities() {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = () => api.get("/facilities", { params: { include_inactive: true } }).then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const open = (f) => {
    if (f) { setEditing(f); setForm({ ...EMPTY, ...f }); }
    else { setEditing(null); setForm(EMPTY); }
  };
  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const setList2 = (k, v) => set(k, v.split(",").map((x) => x.trim()).filter(Boolean));

  const save = async () => {
    try {
      const payload = { ...form, capacity: parseInt(form.capacity) || 0, latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude) };
      if (editing) await api.put(`/facilities/${editing.id}`, payload);
      else await api.post("/facilities", payload);
      toast.success("Fasilitas tersimpan");
      setForm(EMPTY); setEditing(undefined); load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const del = async (id) => { if (!window.confirm("Hapus fasilitas ini?")) return; await api.delete(`/facilities/${id}`); toast.success("Dihapus"); load(); };

  const showForm = editing !== undefined;
  const inputCls = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-heading text-2xl font-bold text-slate-900">Fasilitas</h1><p className="text-slate-500 text-sm mt-1">Kelola katalog fasilitas kampus.</p></div>
        <button data-testid="facility-add" onClick={() => setEditing(null)} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5"><Plus className="w-4 h-4" /> Tambah</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((f) => (
          <div key={f.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="relative h-36"><img src={f.images?.[0]} alt={f.name} className="w-full h-full object-cover" />
              {f.featured && <span className="absolute top-2 left-2 bg-amber-500 text-slate-950 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Star className="w-3 h-3" /> Unggulan</span>}
              <span className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full ${f.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>{f.status === "active" ? "Aktif" : "Nonaktif"}</span>
            </div>
            <div className="p-4">
              <span className="text-xs text-slate-400">{f.category} · {f.capacity} org</span>
              <p className="font-heading font-semibold text-slate-900 mt-1 line-clamp-1">{f.name}</p>
              <div className="mt-3 flex gap-2">
                <button data-testid={`facility-edit-${f.slug}`} onClick={() => open(f)} className="flex-1 border border-slate-200 rounded-lg py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1"><Pencil className="w-4 h-4" /> Edit</button>
                <button onClick={() => del(f.id)} className="border border-rose-200 text-rose-600 rounded-lg px-3 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditing(undefined)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white">
              <h3 className="font-heading font-bold text-lg">{editing ? "Edit Fasilitas" : "Tambah Fasilitas"}</h3>
              <button onClick={() => setEditing(undefined)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="text-sm font-medium text-slate-700">Nama Fasilitas</label><input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium text-slate-700">Kategori</label><select className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value)}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></div>
                <div><label className="text-sm font-medium text-slate-700">Kapasitas</label><input type="number" className={inputCls} value={form.capacity} onChange={(e) => set("capacity", e.target.value)} /></div>
              </div>
              <div><label className="text-sm font-medium text-slate-700">Deskripsi</label><textarea rows={3} className={inputCls} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium text-slate-700">Lokasi (Zona)</label><input className={inputCls} value={form.location} onChange={(e) => set("location", e.target.value)} /></div>
                <div><label className="text-sm font-medium text-slate-700">Luas</label><input className={inputCls} value={form.area} onChange={(e) => set("area", e.target.value)} /></div>
              </div>
              <div><label className="text-sm font-medium text-slate-700">Alamat</label><input className={inputCls} value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-sm font-medium text-slate-700">Latitude</label><input className={inputCls} value={form.latitude} onChange={(e) => set("latitude", e.target.value)} /></div>
                <div><label className="text-sm font-medium text-slate-700">Longitude</label><input className={inputCls} value={form.longitude} onChange={(e) => set("longitude", e.target.value)} /></div>
                <div><label className="text-sm font-medium text-slate-700">Jam Operasional</label><input className={inputCls} value={form.operating_hours} onChange={(e) => set("operating_hours", e.target.value)} /></div>
              </div>
              <div><label className="text-sm font-medium text-slate-700">Gambar (URL, pisahkan koma)</label><input className={inputCls} value={form.images.join(", ")} onChange={(e) => setList2("images", e.target.value)} placeholder="/facilities/gsg-1.jpeg, ..." /></div>
              <div><label className="text-sm font-medium text-slate-700">Fasilitas Pendukung (koma)</label><input className={inputCls} value={form.features.join(", ")} onChange={(e) => setList2("features", e.target.value)} placeholder="AC, Wi-Fi, ..." /></div>
              <div><label className="text-sm font-medium text-slate-700">Layanan Tambahan (koma)</label><input className={inputCls} value={form.services.join(", ")} onChange={(e) => setList2("services", e.target.value)} /></div>
              <div><label className="text-sm font-medium text-slate-700">Cocok Untuk (koma)</label><input className={inputCls} value={form.suitable_for.join(", ")} onChange={(e) => setList2("suitable_for", e.target.value)} /></div>
              <div><label className="text-sm font-medium text-slate-700">Aturan (koma)</label><input className={inputCls} value={form.rules.join(", ")} onChange={(e) => setList2("rules", e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium text-slate-700">Status</label><select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}><option value="active">Aktif</option><option value="inactive">Nonaktif</option></select></div>
                <label className="flex items-center gap-2 mt-6 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="accent-amber-500 w-4 h-4" /> Fasilitas Unggulan</label>
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setEditing(undefined)} className="px-5 py-2.5 rounded-lg border border-slate-300 font-semibold text-slate-700">Batal</button>
              <button data-testid="facility-save" onClick={save} className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

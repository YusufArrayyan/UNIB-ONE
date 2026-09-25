import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";

const CATS = [{ k: "news", l: "Berita" }, { k: "event", l: "Event" }, { k: "spotlight", l: "Facility Spotlight" }, { k: "activity", l: "Aktivitas Kampus" }];
const EMPTY = { title: "", category: "news", excerpt: "", body: "", image: "", date: "", published: true };

export default function AdminContent() {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(undefined);
  const [form, setForm] = useState(EMPTY);

  const load = () => api.get("/content", { params: { include_unpublished: true } }).then((r) => setList(r.data));
  useEffect(() => { load(); }, []);
  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const save = async () => {
    try {
      if (editing) await api.put(`/content/${editing.id}`, form);
      else await api.post("/content", form);
      toast.success("Konten tersimpan"); setEditing(undefined); load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };
  const del = async (id) => { if (!window.confirm("Hapus konten ini?")) return; await api.delete(`/content/${id}`); toast.success("Dihapus"); load(); };
  const inputCls = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-heading text-2xl font-bold text-slate-900">Content & Stories</h1><p className="text-slate-500 text-sm mt-1">Kelola berita, event, dan cerita fasilitas.</p></div>
        <button data-testid="content-add" onClick={() => { setEditing(null); setForm(EMPTY); }} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5"><Plus className="w-4 h-4" /> Tambah</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((c) => (
          <div key={c.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <img src={c.image} alt={c.title} className="w-full h-32 object-cover" />
            <div className="p-4">
              <div className="flex items-center gap-2"><span className="text-[10px] font-bold uppercase text-amber-600">{c.category}</span>{!c.published && <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 rounded">Draft</span>}</div>
              <p className="font-heading font-semibold text-slate-900 mt-1 line-clamp-2 text-sm">{c.title}</p>
              <p className="text-xs text-slate-400 mt-1">{c.date}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => { setEditing(c); setForm({ ...EMPTY, ...c }); }} className="flex-1 border border-slate-200 rounded-lg py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1"><Pencil className="w-4 h-4" /> Edit</button>
                <button onClick={() => del(c.id)} className="border border-rose-200 text-rose-600 rounded-lg px-3 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing !== undefined && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditing(undefined)}>
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200"><h3 className="font-heading font-bold text-lg">{editing ? "Edit Konten" : "Tambah Konten"}</h3><button onClick={() => setEditing(undefined)}><X className="w-5 h-5" /></button></div>
            <div className="p-5 space-y-4">
              <div><label className="text-sm font-medium text-slate-700">Judul</label><input className={inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium text-slate-700">Kategori</label><select className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value)}>{CATS.map((c) => <option key={c.k} value={c.k}>{c.l}</option>)}</select></div>
                <div><label className="text-sm font-medium text-slate-700">Tanggal</label><input type="date" className={inputCls} value={form.date} onChange={(e) => set("date", e.target.value)} /></div>
              </div>
              <div><label className="text-sm font-medium text-slate-700">Gambar (URL)</label><input className={inputCls} value={form.image} onChange={(e) => set("image", e.target.value)} placeholder="/facilities/gsg-1.jpeg" /></div>
              <div><label className="text-sm font-medium text-slate-700">Ringkasan</label><textarea rows={2} className={inputCls} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} /></div>
              <div><label className="text-sm font-medium text-slate-700">Isi</label><textarea rows={5} className={inputCls} value={form.body} onChange={(e) => set("body", e.target.value)} /></div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} className="accent-amber-500 w-4 h-4" /> Publikasikan</label>
            </div>
            <div className="p-5 border-t border-slate-200 flex justify-end gap-3"><button onClick={() => setEditing(undefined)} className="px-5 py-2.5 rounded-lg border border-slate-300 font-semibold text-slate-700">Batal</button><button data-testid="content-save" onClick={save} className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold">Simpan</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError, formatRupiah } from "@/lib/api";

const EMPTY = { name: "", description: "", unit: "", price: "", price_information: "", building_ids: [], max_qty: 1, status: "active" };
const inputCls = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500";

export default function AdminAmenities() {
  const [list, setList] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [editing, setEditing] = useState(undefined);
  const [form, setForm] = useState(EMPTY);

  const load = () => api.get("/amenities", { params: { include_inactive: true } }).then((r) => setList(r.data));
  useEffect(() => {
    load();
    api.get("/facilities", { params: { include_inactive: true } }).then((r) => setBuildings(r.data));
  }, []);

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const open = (a) => { setEditing(a); setForm(a ? { ...EMPTY, ...a, price: a.price ?? "" } : EMPTY); };
  const toggleBuilding = (id) => set("building_ids", form.building_ids.includes(id) ? form.building_ids.filter((x) => x !== id) : [...form.building_ids, id]);
  const bName = (id) => buildings.find((b) => b.id === id)?.code || buildings.find((b) => b.id === id)?.name || "?";

  const save = async () => {
    if (!form.name.trim()) { toast.error("Nama wajib diisi"); return; }
    const payload = { ...form, price: form.price === "" ? null : parseInt(form.price, 10), max_qty: Math.max(parseInt(form.max_qty, 10) || 1, 1) };
    delete payload.id; delete payload.created_at;
    try {
      if (editing) await api.put(`/amenities/${editing.id}`, payload);
      else await api.post("/amenities", payload);
      toast.success("Fasilitas tambahan tersimpan");
      setEditing(undefined); load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };
  const del = async (a) => { if (!window.confirm(`Hapus ${a.name}?`)) return; await api.delete(`/amenities/${a.id}`); toast.success("Dihapus"); load(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Fasilitas Tambahan</h1>
          <p className="text-slate-500 text-sm mt-1">Kursi tambahan, layar, videotron, LCD, dll. Dipilih penyewa saat inquiry; biaya final dikonfirmasi BPU.</p>
        </div>
        <button data-testid="amenity-add" onClick={() => open(null)} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5"><Plus className="w-4 h-4" /> Tambah</button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400 border-b border-slate-100">
            <th className="p-4 font-medium">Nama</th><th className="p-4 font-medium">Harga</th><th className="p-4 font-medium">Berlaku untuk</th><th className="p-4 font-medium">Maks</th><th className="p-4 font-medium">Status</th><th className="p-4" />
          </tr></thead>
          <tbody>
            {list.length === 0 ? <tr><td colSpan={6} className="p-10 text-center text-slate-400">Belum ada data.</td></tr> : list.map((a) => (
              <tr key={a.id} className="border-b border-slate-50">
                <td className="p-4"><p className="font-semibold text-slate-800">{a.name}</p>{a.description && <p className="text-xs text-slate-500">{a.description}</p>}</td>
                <td className="p-4 text-slate-700">{a.price_information || (a.price ? `${formatRupiah(a.price)} / ${a.unit}` : "Konfirmasi BPU")}</td>
                <td className="p-4 text-slate-600 text-xs">{a.building_ids?.length ? a.building_ids.map(bName).join(", ") : "Semua gedung"}</td>
                <td className="p-4 text-slate-600">{a.max_qty}</td>
                <td className="p-4"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>{a.status === "active" ? "Aktif" : "Nonaktif"}</span></td>
                <td className="p-4 whitespace-nowrap">
                  <button aria-label={`Edit ${a.name}`} onClick={() => open(a)} className="text-slate-600 hover:text-amber-600 mr-3"><Pencil className="w-4 h-4" /></button>
                  <button aria-label={`Hapus ${a.name}`} onClick={() => del(a)} className="text-rose-500 hover:text-rose-700"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing !== undefined && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditing(undefined)}>
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="font-heading font-bold text-lg">{editing ? "Edit" : "Tambah"} Fasilitas Tambahan</h3>
              <button onClick={() => setEditing(undefined)} aria-label="Tutup"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="text-sm font-medium text-slate-700">Nama</label><input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
              <div><label className="text-sm font-medium text-slate-700">Deskripsi</label><input className={inputCls} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-sm font-medium text-slate-700">Harga (Rp)</label><input type="number" className={inputCls} value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="kosong = konfirmasi" /></div>
                <div><label className="text-sm font-medium text-slate-700">Satuan</label><input className={inputCls} value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="hari/unit" /></div>
                <div><label className="text-sm font-medium text-slate-700">Maks. jumlah</label><input type="number" min={1} className={inputCls} value={form.max_qty} onChange={(e) => set("max_qty", e.target.value)} /></div>
              </div>
              <div><label className="text-sm font-medium text-slate-700">Keterangan harga (tampil ke publik)</label><input className={inputCls} value={form.price_information} onChange={(e) => set("price_information", e.target.value)} placeholder="Rp3.000.000 per hari per unit" /></div>
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Berlaku untuk gedung <span className="text-slate-400 font-normal">(kosongkan = semua gedung)</span></p>
                <div className="flex flex-wrap gap-2">
                  {buildings.map((b) => (
                    <button key={b.id} type="button" onClick={() => toggleBuilding(b.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg border ${form.building_ids.includes(b.id) ? "bg-amber-500 text-slate-950 border-amber-500" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-amber-400"}`}>{b.code || b.name}</button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" className="accent-amber-500 w-4 h-4" checked={form.status === "active"} onChange={(e) => set("status", e.target.checked ? "active" : "inactive")} /> Aktif</label>
            </div>
            <div className="p-5 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setEditing(undefined)} className="px-5 py-2.5 rounded-lg border border-slate-300 font-semibold text-slate-700">Batal</button>
              <button data-testid="amenity-save" onClick={save} className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

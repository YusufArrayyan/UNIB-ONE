import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const ROLES = [
  { k: "super_admin", l: "Super Admin" },
  { k: "admin_bpu", l: "Admin BPU" },
  { k: "admin_internal", l: "Admin Rumah Tangga" },
];
const ROLE_STYLE = { super_admin: "bg-rose-100 text-rose-700", admin_bpu: "bg-amber-100 text-amber-700", admin_internal: "bg-indigo-100 text-indigo-700" };
const EMPTY = { name: "", email: "", password: "", role: "admin_bpu", status: "active" };

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(undefined);
  const [form, setForm] = useState(EMPTY);

  const load = () => api.get("/users").then((r) => setList(r.data));
  useEffect(() => { load(); }, []);
  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const save = async () => {
    try {
      if (editing) await api.put(`/users/${editing.id}`, { name: form.name, role: form.role, status: form.status, ...(form.password ? { password: form.password } : {}) });
      else await api.post("/users", form);
      toast.success("Akun tersimpan"); setEditing(undefined); load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };
  const del = async (id) => { if (!window.confirm("Hapus akun ini?")) return; await api.delete(`/users/${id}`); toast.success("Dihapus"); load(); };
  const inputCls = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500";
  const roleLabel = (k) => ROLES.find((r) => r.k === k)?.l || k;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-heading text-2xl font-bold text-slate-900">Users & Roles</h1><p className="text-slate-500 text-sm mt-1">Kelola akun admin dan hak akses.</p></div>
        <button data-testid="user-add" onClick={() => { setEditing(null); setForm(EMPTY); }} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5"><Plus className="w-4 h-4" /> Tambah Akun</button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400 border-b border-slate-100"><th className="p-4 font-medium">Nama</th><th className="p-4 font-medium">Email</th><th className="p-4 font-medium">Role</th><th className="p-4 font-medium">Status</th><th className="p-4"></th></tr></thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} className="border-b border-slate-50">
                <td className="p-4 font-medium text-slate-800 flex items-center gap-2">{u.role === "super_admin" && <ShieldCheck className="w-4 h-4 text-rose-500" />}{u.name}</td>
                <td className="p-4 text-slate-600">{u.email}</td>
                <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_STYLE[u.role]}`}>{roleLabel(u.role)}</span></td>
                <td className="p-4"><span className={`text-xs font-semibold ${u.status === "active" ? "text-emerald-600" : "text-slate-400"}`}>{u.status === "active" ? "Aktif" : "Nonaktif"}</span></td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => { setEditing(u); setForm({ ...u, password: "" }); }} className="text-slate-500 hover:text-amber-600"><Pencil className="w-4 h-4" /></button>
                  {u.id !== me?.id && <button onClick={() => del(u.id)} className="text-rose-500 hover:text-rose-700"><Trash2 className="w-4 h-4" /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing !== undefined && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditing(undefined)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200"><h3 className="font-heading font-bold text-lg">{editing ? "Edit Akun" : "Tambah Akun"}</h3><button onClick={() => setEditing(undefined)}><X className="w-5 h-5" /></button></div>
            <div className="p-5 space-y-4">
              <div><label className="text-sm font-medium text-slate-700">Nama</label><input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
              <div><label className="text-sm font-medium text-slate-700">Email</label><input type="email" className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} disabled={!!editing} /></div>
              <div><label className="text-sm font-medium text-slate-700">Password {editing && <span className="text-slate-400">(kosongkan jika tidak diubah)</span>}</label><input type="password" className={inputCls} value={form.password} onChange={(e) => set("password", e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium text-slate-700">Role</label><select className={inputCls} value={form.role} onChange={(e) => set("role", e.target.value)}>{ROLES.map((r) => <option key={r.k} value={r.k}>{r.l}</option>)}</select></div>
                <div><label className="text-sm font-medium text-slate-700">Status</label><select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}><option value="active">Aktif</option><option value="inactive">Nonaktif</option></select></div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 flex justify-end gap-3"><button onClick={() => setEditing(undefined)} className="px-5 py-2.5 rounded-lg border border-slate-300 font-semibold text-slate-700">Batal</button><button data-testid="user-save" onClick={save} className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold">Simpan</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

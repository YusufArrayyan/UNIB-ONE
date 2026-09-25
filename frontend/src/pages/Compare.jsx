import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, X, Check, Minus, Users } from "lucide-react";
import { api } from "@/lib/api";

const ROWS = [
  { key: "capacity", label: "Kapasitas", render: (f) => `${f.capacity} orang` },
  { key: "area", label: "Luas", render: (f) => f.area || "-" },
  { key: "operating_hours", label: "Jam Operasional", render: (f) => f.operating_hours },
  { key: "location", label: "Lokasi", render: (f) => f.location },
];
const FEATURE_ROWS = ["AC", "LCD Proyektor", "Sound System", "Panggung", "Wi-Fi", "Parkir", "Parkir Luas"];

export default function Compare() {
  const [facilities, setFacilities] = useState([]);
  const [selected, setSelected] = useState([]);
  const [picker, setPicker] = useState(false);

  useEffect(() => { api.get("/facilities").then((r) => setFacilities(r.data)); }, []);

  const add = (f) => { if (selected.length < 3 && !selected.find((x) => x.id === f.id)) setSelected([...selected, f]); setPicker(false); };
  const remove = (id) => setSelected(selected.filter((f) => f.id !== id));
  const hasFeature = (f, feat) => (f.features || []).some((x) => x === feat || (feat === "Parkir" && x === "Parkir Luas"));

  return (
    <div>
      <section className="bg-slate-900 text-white">
        <div className="container-unib py-10">
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold">Bandingkan Fasilitas</h1>
          <p className="text-slate-300 mt-2">Pilih hingga 3 fasilitas untuk melihat perbandingan secara detail.</p>
        </div>
      </section>

      <div className="container-unib py-10">
        <div className="grid gap-4" style={{ gridTemplateColumns: `180px repeat(${Math.max(selected.length + (selected.length < 3 ? 1 : 0), 1)}, minmax(0,1fr))` }}>
          <div />
          {selected.map((f) => (
            <div key={f.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden relative">
              <button onClick={() => remove(f.id)} className="absolute top-2 right-2 z-10 bg-white/90 rounded-full p-1 shadow"><X className="w-4 h-4" /></button>
              <img src={f.images?.[0]} alt={f.name} className="w-full h-28 object-cover" />
              <div className="p-3">
                <p className="font-heading font-semibold text-sm text-slate-900 line-clamp-2">{f.name}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Users className="w-3 h-3" /> {f.capacity} org</p>
              </div>
            </div>
          ))}
          {selected.length < 3 && (
            <button onClick={() => setPicker(true)} data-testid="compare-add"
              className="border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-amber-400 hover:text-amber-600 min-h-[180px] transition-colors">
              <Plus className="w-8 h-8" /><span className="text-sm font-medium">Tambah Fasilitas</span>
            </button>
          )}
        </div>

        {selected.length > 0 && (
          <div className="mt-8 bg-white border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {ROWS.map((row, i) => (
                  <tr key={row.key} className={i % 2 ? "bg-slate-50/50" : ""}>
                    <td className="p-4 font-semibold text-slate-700 w-44">{row.label}</td>
                    {selected.map((f) => <td key={f.id} className="p-4 text-slate-600">{row.render(f)}</td>)}
                  </tr>
                ))}
                {FEATURE_ROWS.map((feat, i) => (
                  <tr key={feat} className={(ROWS.length + i) % 2 ? "bg-slate-50/50" : ""}>
                    <td className="p-4 font-semibold text-slate-700">{feat}</td>
                    {selected.map((f) => (
                      <td key={f.id} className="p-4">
                        {hasFeature(f, feat) ? <Check className="w-5 h-5 text-emerald-500" /> : <Minus className="w-5 h-5 text-slate-300" />}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="p-4" />
                  {selected.map((f) => (
                    <td key={f.id} className="p-4">
                      <Link to={`/facility/${f.slug}`} className="inline-flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Pilih & Ajukan</Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {picker && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPicker(false)}>
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[70vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-heading font-bold text-lg mb-4">Pilih Fasilitas</h3>
              <div className="space-y-2">
                {facilities.filter((f) => !selected.find((s) => s.id === f.id)).map((f) => (
                  <button key={f.id} onClick={() => add(f)} className="w-full flex gap-3 p-3 rounded-xl border border-slate-200 hover:border-amber-400 text-left">
                    <img src={f.images?.[0]} alt={f.name} className="w-14 h-14 rounded-lg object-cover" />
                    <div><p className="font-semibold text-sm text-slate-900">{f.name}</p><p className="text-xs text-slate-500">{f.category} · {f.capacity} org</p></div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

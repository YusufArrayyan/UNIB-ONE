import { useEffect, useRef, useState } from "react";
import { UploadCloud, X, ArrowLeft, ArrowRight, Loader2, Play, Link2 } from "lucide-react";
import { toast } from "sonner";
import { api, mediaSrc, uploadMedia, formatApiError } from "@/lib/api";

const ACCEPT = {
  image: { mime: ["image/jpeg", "image/png", "image/webp"], attr: "image/jpeg,image/png,image/webp", label: "JPG, PNG, WEBP" },
  video: { mime: ["video/mp4", "video/webm", "video/quicktime"], attr: "video/mp4,video/webm,video/quicktime", label: "MP4, WEBM, MOV" },
};
let limitsPromise = null;
const getLimits = () => {
  if (!limitsPromise) limitsPromise = api.get("/uploads/limits").then((r) => r.data).catch(() => ({ image_mb: 5, video_mb: 50 }));
  return limitsPromise;
};

/**
 * Kelola daftar foto/video: upload file (dengan batas ukuran), urutkan, hapus, atau tempel URL.
 * value: string[] (URL), onChange(next), kind: "image" | "video", multiple: boolean
 */
export function MediaUploader({ kind = "image", value = [], onChange, multiple = true, testId }) {
  const [limits, setLimits] = useState({ image_mb: 5, video_mb: 50 });
  const [uploads, setUploads] = useState([]); // [{ name, progress }]
  const [url, setUrl] = useState("");
  const inputRef = useRef(null);
  const acc = ACCEPT[kind];
  const maxMb = kind === "image" ? limits.image_mb : limits.video_mb;

  useEffect(() => { getLimits().then(setLimits); }, []);

  const handleFiles = async (files) => {
    let list = [...files];
    if (!multiple) list = list.slice(0, 1);
    let next = multiple ? [...value] : [];
    for (const file of list) {
      if (!acc.mime.includes(file.type)) { toast.error(`${file.name}: format harus ${acc.label}`); continue; }
      if (file.size > maxMb * 1024 * 1024) { toast.error(`${file.name}: ${(file.size / 1048576).toFixed(1)} MB, maksimal ${maxMb} MB`); continue; }
      setUploads((u) => [...u, { name: file.name, progress: 0 }]);
      try {
        const res = await uploadMedia(file, (p) => setUploads((u) => u.map((x) => (x.name === file.name ? { ...x, progress: p } : x))));
        next = multiple ? [...next, res.url] : [res.url];
        onChange(next);
        toast.success(`${file.name} terupload`);
      } catch (e) {
        toast.error(`${file.name}: ${formatApiError(e.response?.data?.detail)}`);
      } finally {
        setUploads((u) => u.filter((x) => x.name !== file.name));
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const move = (i, d) => {
    const arr = [...value];
    const j = i + d;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onChange(arr);
  };
  const addUrl = () => {
    const u = url.trim();
    if (!u) return;
    onChange(multiple ? [...value, u] : [u]);
    setUrl("");
  };

  return (
    <div className="space-y-2" data-testid={testId}>
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {value.map((src, i) => (
            <div key={`${src}-${i}`} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-video">
              {kind === "image"
                ? <img src={mediaSrc(src)} alt="" className="w-full h-full object-cover" />
                : <video src={mediaSrc(src)} muted preload="metadata" className="w-full h-full object-cover bg-black" />}
              {kind === "video" && <Play className="absolute inset-0 m-auto w-7 h-7 text-white/90 pointer-events-none" />}
              {i === 0 && multiple && kind === "image" && <span className="absolute top-1 left-1 bg-white text-slate-900 text-[10px] font-semibold px-1.5 py-0.5 rounded">Sampul</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-between p-1 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <span className="flex gap-1">
                  {multiple && <button type="button" aria-label="Geser ke kiri" onClick={() => move(i, -1)} disabled={i === 0} className="w-6 h-6 rounded bg-white/90 flex items-center justify-center disabled:opacity-40"><ArrowLeft className="w-3.5 h-3.5" /></button>}
                  {multiple && <button type="button" aria-label="Geser ke kanan" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="w-6 h-6 rounded bg-white/90 flex items-center justify-center disabled:opacity-40"><ArrowRight className="w-3.5 h-3.5" /></button>}
                </span>
                <button type="button" aria-label="Hapus" onClick={() => onChange(value.filter((_, j) => j !== i))} className="w-6 h-6 rounded bg-rose-600 text-white flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {uploads.map((u) => (
        <div key={u.name} className="flex items-center gap-2 text-xs text-slate-600">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span className="truncate flex-1">{u.name}</span>
          <span className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden"><span className="block h-full bg-amber-500" style={{ width: `${u.progress}%` }} /></span>
          <span className="tabular-nums w-9 text-right">{u.progress}%</span>
        </div>
      ))}

      <button type="button" onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        className="w-full border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-lg px-3 py-4 text-center transition-colors">
        <UploadCloud className="w-5 h-5 mx-auto text-slate-400" />
        <span className="block text-sm font-medium text-slate-700 mt-1">Upload {kind === "image" ? "foto" : "video"}{multiple ? " (bisa beberapa sekaligus)" : ""}</span>
        <span className="block text-[11px] text-slate-500">{acc.label}, maksimal {maxMb} MB per file. Bisa juga seret file ke sini.</span>
      </button>
      <input ref={inputRef} type="file" accept={acc.attr} multiple={multiple} className="hidden" onChange={(e) => handleFiles(e.target.files)} />

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addUrl(); } }}
            placeholder={kind === "image" ? "atau tempel URL foto" : "atau tempel URL video / YouTube"}
            className="w-full border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <button type="button" onClick={addUrl} className="text-xs font-semibold px-3 rounded-lg border border-slate-300 hover:bg-slate-50">Tambah</button>
      </div>
    </div>
  );
}

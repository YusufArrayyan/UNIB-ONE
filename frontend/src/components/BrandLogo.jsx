import { cn } from "@/lib/utils";

/** Logo BPU UNIB (transparan) di atas badge putih agar kontras pada latar gelap. */
export function BrandLogo({ size = "md", className }) {
  const box = { sm: "w-9 h-9", md: "w-10 h-10", lg: "w-14 h-14" }[size];
  return (
    <span className={cn("rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden", box, className)}>
      <img src="/logo.png" alt="Logo BPU UNIB" className="w-full h-full object-contain p-0.5" />
    </span>
  );
}

/** Pengganti foto saat fasilitas belum memiliki dokumentasi. */
export function MediaFallback({ className, label }) {
  return (
    <div className={cn("w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-800 to-slate-950 text-slate-400", className)}>
      <img src="/logo.png" alt="" className="w-14 h-14 object-contain bg-white rounded-xl p-1 opacity-90" />
      {label && <span className="text-xs font-medium">{label}</span>}
    </div>
  );
}

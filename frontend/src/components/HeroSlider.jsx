import { useEffect, useState } from "react";
import { mediaSrc } from "@/lib/api";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin } from "lucide-react";

const INTERVAL = 5000;

/**
 * Banner hero dengan gambar yang berganti otomatis (tanpa tombol).
 * slides: [{ image, caption }] dikelola admin di menu Pengaturan.
 */
export function HeroSlider({ slides = [], children }) {
  const [idx, setIdx] = useState(0);
  const count = slides.length;

  useEffect(() => { if (idx >= count) setIdx(0); }, [count, idx]);

  useEffect(() => {
    if (count < 2) return undefined;
    const t = setInterval(() => setIdx((i) => (i + 1) % count), INTERVAL);
    return () => clearInterval(t);
  }, [count]);

  // Preload gambar berikutnya agar pergantian mulus.
  useEffect(() => {
    if (count < 2) return;
    const img = new Image();
    img.src = mediaSrc(slides[(idx + 1) % count].image);
  }, [idx, count, slides]);

  const slide = slides[idx];

  return (
    <section className="relative overflow-hidden text-white bg-slate-950" data-testid="hero-slider">
      <AnimatePresence initial={false}>
        {slide && (
          <motion.img key={slide.image + idx} src={mediaSrc(slide.image)} alt=""
            initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.2 }, scale: { duration: INTERVAL / 1000 + 1.2, ease: "linear" } }}
            className="absolute inset-0 w-full h-full object-cover" />
        )}
      </AnimatePresence>
      <div className="absolute inset-0 hero-overlay" />

      <div className="relative">{children}</div>

      {count > 0 && (
        <div className="container-unib relative pb-6 flex items-center justify-between gap-4" aria-hidden="true">
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <span key={i} className={`h-1 rounded-full transition-all duration-500 ${i === idx ? "w-8 bg-amber-400" : "w-3 bg-white/35"}`} />
            ))}
          </div>
          {slide?.caption && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-200 bg-black/30 backdrop-blur px-3 py-1.5 rounded-full border border-white/10">
              <MapPin className="w-3.5 h-3.5 text-amber-400" /> {slide.caption}
            </span>
          )}
        </div>
      )}
    </section>
  );
}

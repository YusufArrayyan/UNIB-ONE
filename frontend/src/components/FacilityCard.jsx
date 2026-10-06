import { Link } from "react-router-dom";
import { mediaSrc } from "@/lib/api";
import { MapPin } from "lucide-react";
import { MediaFallback } from "@/components/BrandLogo";

export function capacityText(f) {
  if (f.capacity_label) return f.capacity_label;
  if (f.capacity) return `Hingga ${f.capacity} orang`;
  return "Kapasitas dikonfirmasi BPU";
}

/** Kartu fasilitas berfokus foto (acuan: Airbnb property-card). */
export function FacilityCard({ facility }) {
  const img = facility.images?.[0];
  const price = facility.price_summary;
  const confirm = !price || price.mode === "confirm";
  const priceValue = price?.text?.replace(/^Mulai dari /, "");
  const units = facility.space_count || 0;
  return (
    <Link to={`/facility/${facility.slug}`} data-testid={`facility-card-${facility.slug}`} className="group flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] bg-slate-100">
        {img
          ? <img src={mediaSrc(img)} alt={facility.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          : <MediaFallback label="Foto segera hadir" />}
        <span className="absolute top-3 left-3 bg-white text-slate-900 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-float">
          {facility.featured ? "Paling sering disewa" : facility.category}
        </span>
        {units > 1 && (
          <span className="absolute bottom-3 left-3 bg-slate-900/75 backdrop-blur text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
            {units} unit dapat disewa
          </span>
        )}
      </div>
      <div className="pt-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-heading font-semibold text-[15px] text-slate-900 leading-snug group-hover:underline underline-offset-2">{facility.name}</h3>
          {facility.code && <span className="text-xs font-mono text-slate-400 shrink-0 mt-0.5">{facility.code}</span>}
        </div>
        <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1 truncate"><MapPin className="w-3.5 h-3.5 shrink-0" />{facility.location}</p>
        <p className="text-sm text-slate-500">{capacityText(facility)}</p>
        <p className="text-sm text-slate-900 mt-1.5" data-testid="facility-card-price">
          {confirm
            ? <span className="font-semibold">Tarif dikonfirmasi BPU</span>
            : <>{price.mode === "starting" && <span className="text-slate-500">Mulai </span>}<span className="font-semibold">{priceValue}</span></>}
        </p>
      </div>
    </Link>
  );
}

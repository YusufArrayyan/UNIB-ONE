import { Link } from "react-router-dom";
import { Users, MapPin, ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

export function FacilityCard({ facility, status = "available" }) {
  const img = facility.images?.[0] || "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=520&fit=crop";
  return (
    <Link
      to={`/facility/${facility.slug}`}
      data-testid={`facility-card-${facility.slug}`}
      className="group bg-white border border-slate-200 rounded-2xl overflow-hidden card-hover shadow-sm hover:shadow-xl flex flex-col"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img src={img} alt={facility.name} loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/10">
          {facility.category}
        </span>
        <div className="absolute top-3 right-3">
          <StatusBadge status={status} />
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-heading font-bold text-lg text-slate-900 leading-snug group-hover:text-amber-600 transition-colors">
            {facility.name}
          </h3>
          <p className="mt-2 text-sm text-slate-500 line-clamp-2">{facility.description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(facility.features || []).slice(0, 4).map((f) => (
              <span key={f} className="text-[11px] font-medium bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md">{f}</span>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{facility.capacity} org</span>
            <span className="flex items-center gap-1 truncate max-w-[120px]"><MapPin className="w-3.5 h-3.5" />{facility.location}</span>
          </div>
          <span className="flex items-center gap-1 text-sm font-semibold text-amber-600">
            Detail <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}

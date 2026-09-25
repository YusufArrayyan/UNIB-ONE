import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Wrench } from "lucide-react";

const STATUS = {
  available: { label: "Tersedia", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
  unavailable: { label: "Tidak Tersedia", cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: Clock },
  maintenance: { label: "Pemeliharaan", cls: "bg-rose-50 text-rose-700 border-rose-200", Icon: Wrench },
  internal: { label: "Jadwal Internal", cls: "bg-indigo-50 text-indigo-700 border-indigo-200", Icon: Clock },
  external: { label: "Terbooking", cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: Clock },
};

export function StatusBadge({ status = "available", className }) {
  const s = STATUS[status] || STATUS.available;
  const { Icon } = s;
  return (
    <span
      data-testid={`status-badge-${status}`}
      className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md", s.cls, className)}
    >
      <Icon className="w-3.5 h-3.5" />
      {s.label}
    </span>
  );
}

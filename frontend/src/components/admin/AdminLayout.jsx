import { NavLink, Outlet, useNavigate, Navigate } from "react-router-dom";
import { LayoutDashboard, Building2, CalendarRange, Inbox, FileText, Users, LogOut, CalendarClock, ShieldBan, ExternalLink } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { to: "/admin", label: "Dashboard", Icon: LayoutDashboard, end: true, roles: ["super_admin", "admin_bpu", "admin_internal"] },
  { to: "/admin/facilities", label: "Fasilitas", Icon: Building2, roles: ["super_admin", "admin_bpu"] },
  { to: "/admin/requests", label: "External Requests", Icon: Inbox, roles: ["super_admin", "admin_bpu"] },
  { to: "/admin/content", label: "Content & Stories", Icon: FileText, roles: ["super_admin", "admin_bpu"] },
  { to: "/admin/schedule", label: "Internal & Block Schedule", Icon: CalendarClock, roles: ["super_admin", "admin_internal", "admin_bpu"] },
  { to: "/admin/availability", label: "Kalender Fasilitas", Icon: CalendarRange, roles: ["super_admin", "admin_internal", "admin_bpu"] },
  { to: "/admin/users", label: "Users & Roles", Icon: Users, roles: ["super_admin"] },
];

const ROLE_LABEL = { super_admin: "Super Admin", admin_bpu: "Admin BPU", admin_internal: "Admin Rumah Tangga" };

export function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const nav = useNavigate();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Memuat...</div>;
  if (!user) return <Navigate to="/admin/login" replace />;

  const items = NAV.filter((n) => n.roles.includes(user.role) || user.role === "super_admin");

  return (
    <div className="min-h-screen bg-slate-50 lg:pl-64">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 z-40">
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5 text-white">
            <span className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center"><Building2 className="w-5 h-5 text-slate-950" /></span>
            <div className="leading-none"><span className="font-heading font-extrabold">UNIB ONE</span><span className="block text-[10px] text-slate-400 mt-0.5">Admin Panel</span></div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 no-scrollbar">
          {items.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} data-testid={`admin-nav-${label.split(" ")[0].toLowerCase()}`}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}>
              <Icon className="w-5 h-5 shrink-0" /> <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800 space-y-1">
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800"><ExternalLink className="w-5 h-5" /> Lihat Situs</a>
          <button data-testid="admin-logout" onClick={() => { logout(); nav("/admin/login"); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-300 hover:bg-rose-500/10"><LogOut className="w-5 h-5" /> Keluar</button>
        </div>
      </aside>

      <div>
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="px-5 lg:px-8 h-16 flex items-center justify-between">
            <div className="lg:hidden font-heading font-bold text-slate-900">UNIB ONE</div>
            <p className="hidden lg:block text-sm text-slate-500">{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
            <div className="flex items-center gap-3">
              <div className="text-right"><p className="text-sm font-semibold text-slate-900 leading-none">{user.name}</p><p className="text-xs text-slate-500 mt-1">{ROLE_LABEL[user.role] || user.role}</p></div>
              <span className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center">{user.name?.[0]}</span>
            </div>
          </div>
        </header>
        <main className="p-5 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}

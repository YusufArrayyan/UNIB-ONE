import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Search, LayoutDashboard, Building2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/explore", label: "Explore" },
  { to: "/discover", label: "Discover" },
  { to: "/map", label: "UNIB Map" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/about", label: "About BPU" },
];

export function PublicNav() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const { user } = useAuth();

  const doSearch = (e) => {
    e.preventDefault();
    nav(`/explore?q=${encodeURIComponent(q)}`);
    setOpen(false);
  };

  return (
    <header className="bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 sticky top-0 z-50">
      <div className="container-unib flex items-center justify-between h-16">
        <Link to="/" data-testid="nav-logo" className="flex items-center gap-2.5 shrink-0">
          <span className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-slate-950" />
          </span>
          <div className="leading-none">
            <span className="font-heading font-extrabold text-lg tracking-tight">UNIB ONE</span>
            <span className="block text-[10px] text-slate-400 font-medium">One Campus, One Access</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}
              data-testid={`nav-link-${l.label.toLowerCase().replace(/ /g, "-")}`}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? "text-amber-400" : "text-slate-300 hover:text-amber-400"}`
              }>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <form onSubmit={doSearch} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input data-testid="nav-search-input" value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Cari fasilitas..."
              className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm w-44 focus:w-56 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/40 placeholder:text-slate-500" />
          </form>
          <Link to="/request" data-testid="nav-cta-request"
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors">
            Ajukan Peminjaman
          </Link>
          <Link to={user ? "/admin" : "/admin/login"} data-testid="nav-admin"
            className="text-slate-300 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors" title="Admin">
            <LayoutDashboard className="w-5 h-5" />
          </Link>
        </div>

        <button data-testid="nav-mobile-toggle" onClick={() => setOpen(!open)} className="lg:hidden p-2">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-4 py-4 space-y-3">
          <form onSubmit={doSearch} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari fasilitas..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none" />
          </form>
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)}
              className={({ isActive }) => `block py-1.5 text-sm font-medium ${isActive ? "text-amber-400" : "text-slate-300"}`}>
              {l.label}
            </NavLink>
          ))}
          <Link to="/request" onClick={() => setOpen(false)}
            className="block text-center bg-amber-500 text-slate-950 font-semibold text-sm px-4 py-2.5 rounded-lg">
            Ajukan Peminjaman
          </Link>
          <Link to={user ? "/admin" : "/admin/login"} onClick={() => setOpen(false)}
            className="block text-center border border-slate-700 text-slate-200 font-medium text-sm px-4 py-2.5 rounded-lg">
            Admin Login
          </Link>
        </div>
      )}
    </header>
  );
}

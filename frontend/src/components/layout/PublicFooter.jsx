import { Link } from "react-router-dom";
import { Building2, Mail, Phone, MapPin, Instagram, Facebook, Twitter } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800">
      <div className="container-unib py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <Link to="/" className="flex items-center gap-2.5 text-white">
            <span className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-slate-950" />
            </span>
            <span className="font-heading font-extrabold text-lg">UNIB ONE</span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed">
            One Integrated University Facility System. Satu fasilitas, satu data, satu kalender.
          </p>
          <div className="flex gap-3 mt-5">
            {[Instagram, Facebook, Twitter].map((Icon, i) => (
              <a key={i} href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 flex items-center justify-center transition-colors">
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-white font-heading font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/explore" className="hover:text-amber-400">Explore Fasilitas</Link></li>
            <li><Link to="/map" className="hover:text-amber-400">Peta Kampus</Link></li>
            <li><Link to="/discover" className="hover:text-amber-400">Stories & Info</Link></li>
            <li><Link to="/how-it-works" className="hover:text-amber-400">Cara Kerja</Link></li>
            <li><Link to="/compare" className="hover:text-amber-400">Bandingkan Fasilitas</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-heading font-semibold mb-4">Kontak BPU</h4>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 shrink-0" /> Jl. WR. Supratman, Kandang Limun, Kota Bengkulu</li>
            <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +62 821-8502-8768</li>
            <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> bpu@unib.ac.id</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-heading font-semibold mb-4">Newsletter</h4>
          <p className="text-sm mb-3">Dapatkan info terbaru fasilitas UNIB.</p>
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
            <input placeholder="Email anda" className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40" />
            <button className="bg-amber-500 text-slate-950 font-semibold text-sm px-4 rounded-lg hover:bg-amber-600 transition-colors">Kirim</button>
          </form>
        </div>
      </div>
      <div className="border-t border-slate-800 py-5 text-center text-xs text-slate-500">
        © 2026 UNIB ONE - Universitas Bengkulu. One Campus, One Access, One Ecosystem.
      </div>
    </footer>
  );
}

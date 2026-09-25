import { Building2, Target, ShieldCheck, MessageCircle, MapPin, Mail, Phone } from "lucide-react";
import { buildWaLink } from "@/lib/api";

export default function About() {
  return (
    <div>
      <section className="relative overflow-hidden text-white">
        <img src="/facilities/gsg-2.jpeg" alt="BPU UNIB" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 hero-overlay" />
        <div className="container-unib relative py-16">
          <span className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center"><Building2 className="w-6 h-6 text-slate-950" /></span>
          <h1 className="mt-5 font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold">Tentang BPU Universitas Bengkulu</h1>
          <p className="mt-4 text-slate-300 max-w-2xl">Badan Pengelola Usaha (BPU) mengelola pemanfaatan dan penyewaan fasilitas Universitas Bengkulu untuk civitas akademika maupun pihak eksternal.</p>
        </div>
      </section>

      <section className="container-unib py-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { Icon: Target, t: "Misi Kami", d: "Membangun pusat informasi digital fasilitas UNIB yang transparan, terintegrasi, dan mudah diakses semua pihak." },
          { Icon: ShieldCheck, t: "Nilai Kami", d: "Public by default, private by design — informasi fasilitas terbuka, namun identitas pengguna internal tetap terlindungi." },
          { Icon: Building2, t: "Yang Kami Kelola", d: "Gedung, ruang, aula, laboratorium, hunian, lapangan, dan berbagai fasilitas pendukung kampus." },
        ].map(({ Icon, t, d }) => (
          <div key={t} className="bg-white border border-slate-200 rounded-2xl p-6 card-hover hover:shadow-lg">
            <span className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center"><Icon className="w-6 h-6 text-amber-600" /></span>
            <h3 className="font-heading text-xl font-bold text-slate-900 mt-4">{t}</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">{d}</p>
          </div>
        ))}
      </section>

      <section className="bg-white border-y border-slate-200">
        <div className="container-unib py-16 max-w-3xl">
          <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6">Hubungi Kami</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl border border-slate-200 flex items-start gap-3"><MapPin className="w-5 h-5 text-amber-600 mt-0.5" /><div><p className="font-semibold text-slate-900 text-sm">Alamat</p><p className="text-sm text-slate-500 mt-1">Jl. WR. Supratman, Kandang Limun, Kota Bengkulu</p></div></div>
            <div className="p-5 rounded-xl border border-slate-200 flex items-start gap-3"><Phone className="w-5 h-5 text-amber-600 mt-0.5" /><div><p className="font-semibold text-slate-900 text-sm">Telepon</p><p className="text-sm text-slate-500 mt-1">+62 821-8502-8768</p></div></div>
            <div className="p-5 rounded-xl border border-slate-200 flex items-start gap-3"><Mail className="w-5 h-5 text-amber-600 mt-0.5" /><div><p className="font-semibold text-slate-900 text-sm">Email</p><p className="text-sm text-slate-500 mt-1">bpu@unib.ac.id</p></div></div>
          </div>
          <a href={buildWaLink("6282185028768", "Halo Admin BPU UNIB, saya ingin bertanya mengenai pemanfaatan fasilitas kampus.")} target="_blank" rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
            <MessageCircle className="w-5 h-5" /> Chat WhatsApp BPU
          </a>
        </div>
      </section>
    </div>
  );
}

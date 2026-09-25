import { Link } from "react-router-dom";
import { Search, Eye, Send, MessageCircle, ArrowRight } from "lucide-react";

const STEPS = [
  { n: "01", t: "Discover", title: "Temukan", d: "Jelajahi fasilitas dan ruang kampus UNIB melalui pencarian dan kategori yang intuitif.", Icon: Search },
  { n: "02", t: "Explore", title: "Eksplorasi", d: "Lihat detail, fasilitas, lokasi, ketersediaan, dan bandingkan ruang sesuai kebutuhan.", Icon: Eye },
  { n: "03", t: "Request", title: "Ajukan", d: "Kirim permohonan pemanfaatan fasilitas melalui formulir yang sederhana dan terstruktur.", Icon: Send },
  { n: "04", t: "Connect", title: "Terhubung", d: "Lanjutkan konfirmasi langsung melalui WhatsApp bersama tim BPU fasilitas kami.", Icon: MessageCircle },
];

export default function HowItWorks() {
  return (
    <div>
      <section className="bg-slate-900 text-white">
        <div className="container-unib py-14 text-center">
          <p className="text-xs font-semibold tracking-wide uppercase text-amber-400">Cara Kerja</p>
          <h1 className="mt-2 font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold">Mudah dalam 4 Langkah</h1>
          <p className="text-slate-300 mt-3 max-w-2xl mx-auto">Proses yang sederhana dan transparan — dari penemuan hingga pemanfaatan fasilitas.</p>
        </div>
      </section>

      <section className="container-unib py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map(({ n, t, title, d, Icon }) => (
            <div key={n} className="relative bg-white border border-slate-200 rounded-2xl p-6 card-hover hover:shadow-lg">
              <span className="font-heading text-5xl font-extrabold text-slate-100 absolute top-4 right-5">{n}</span>
              <span className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center"><Icon className="w-6 h-6 text-slate-950" /></span>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-amber-600">{t}</p>
              <h3 className="font-heading text-xl font-bold text-slate-900 mt-1">{title}</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border-y border-slate-200">
        <div className="container-unib py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900">Satu Kalender, Dua Jalur Pemanfaatan</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">UNIB ONE menyatukan penggunaan internal (dicatat Admin Rumah Tangga) dan penyewaan eksternal (dikelola BPU) ke dalam satu kalender fasilitas terintegrasi — sehingga ketersediaan selalu akurat dan risiko double booking diminimalkan.</p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                <p className="font-heading font-semibold text-indigo-800">Internal Use</p>
                <p className="text-sm text-indigo-700 mt-1">Mahasiswa/Unit → Rumah Tangga → Block Schedule → Kalender</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                <p className="font-heading font-semibold text-amber-800">External Rental</p>
                <p className="text-sm text-amber-700 mt-1">Explore → Request → BPU → WhatsApp → Konfirmasi → Kalender</p>
              </div>
            </div>
            <Link to="/request" className="mt-7 inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-6 py-3 rounded-xl transition-colors">
              Mulai Ajukan <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <img src="/facilities/glt-1.jpeg" alt="Fasilitas UNIB" className="rounded-2xl border border-slate-200 aspect-[4/3] object-cover w-full" />
        </div>
      </section>
    </div>
  );
}

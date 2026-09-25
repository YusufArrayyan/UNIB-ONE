import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, Calendar } from "lucide-react";
import { api } from "@/lib/api";

export default function DiscoverDetail() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [more, setMore] = useState([]);

  useEffect(() => {
    api.get(`/content/${slug}`).then((r) => {
      setItem(r.data);
      api.get("/content").then((c) => setMore(c.data.filter((x) => x.slug !== slug).slice(0, 3)));
    });
  }, [slug]);

  if (!item) return <div className="container-unib py-24 text-center text-slate-400">Memuat...</div>;

  return (
    <div>
      <div className="container-unib pt-6">
        <nav className="flex items-center gap-1.5 text-sm text-slate-500">
          <Link to="/" className="hover:text-amber-600">Home</Link><ChevronRight className="w-4 h-4" />
          <Link to="/discover" className="hover:text-amber-600">Discover</Link><ChevronRight className="w-4 h-4" />
          <span className="text-slate-900 font-medium truncate max-w-[200px]">{item.title}</span>
        </nav>
      </div>
      <article className="container-unib py-8 max-w-3xl">
        <span className="text-xs font-bold tracking-wide uppercase text-amber-600">{item.category}</span>
        <h1 className="mt-3 font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">{item.title}</h1>
        <p className="mt-3 text-sm text-slate-400 flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {item.date}</p>
        <div className="mt-6 aspect-[16/9] rounded-2xl overflow-hidden">
          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
        </div>
        <p className="mt-6 text-lg text-slate-600 font-medium leading-relaxed">{item.excerpt}</p>
        <div className="mt-4 text-slate-700 leading-relaxed whitespace-pre-line">{item.body}</div>
      </article>

      {more.length > 0 && (
        <section className="container-unib py-12 border-t border-slate-200">
          <h3 className="font-heading text-2xl font-bold text-slate-900 mb-6">Cerita Lainnya</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {more.map((s) => (
              <Link key={s.id} to={`/discover/${s.slug}`} className="group bg-white rounded-2xl overflow-hidden border border-slate-200 card-hover hover:shadow-lg">
                <img src={s.image} alt={s.title} className="aspect-[16/10] w-full object-cover" />
                <div className="p-4">
                  <span className="text-[10px] font-bold uppercase text-amber-600">{s.category}</span>
                  <h4 className="font-heading font-semibold text-slate-900 mt-1 line-clamp-2 group-hover:text-amber-600">{s.title}</h4>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

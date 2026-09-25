import { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { Building2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/lib/api";

export default function AdminLogin() {
  const { user, login, loading } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Login berhasil");
      nav("/admin");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  const inputCls = "w-full border border-slate-300 rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500";

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2.5 text-white mb-8">
          <span className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center"><Building2 className="w-6 h-6 text-slate-950" /></span>
          <span className="font-heading font-extrabold text-2xl">UNIB ONE</span>
        </Link>
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h1 className="font-heading text-2xl font-bold text-slate-900">Admin Login</h1>
          <p className="text-sm text-slate-500 mt-1">Masuk ke dashboard pengelolaan fasilitas.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="relative"><Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input data-testid="login-email" type="email" required className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email admin" /></div>
            <div className="relative"><Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input data-testid="login-password" type="password" required className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" /></div>
            <button data-testid="login-submit" disabled={busy} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold py-3 rounded-lg transition-colors disabled:opacity-60">
              {busy ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
        <Link to="/" className="block text-center text-slate-400 hover:text-white text-sm mt-6">← Kembali ke Beranda</Link>
      </div>
    </div>
  );
}

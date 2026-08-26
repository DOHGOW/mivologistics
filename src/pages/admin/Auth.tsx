import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, Loader2, LayoutDashboard } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { loginWithEmail, isDemoMode } from '../../firebase';
import { getUserProfile } from '../../lib/firestore';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, isDemoMode: demo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ((location.state as { denied?: boolean } | null)?.denied) {
      setError('That account does not have admin access.');
    }
  }, [location.state]);

  useEffect(() => {
    if (profile?.role === 'admin') navigate('/admin/dashboard');
  }, [profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isDemoMode) {
      toast.info('Demo mode — connect Firebase to enable real admin login.');
      navigate('/admin/dashboard');
      return;
    }

    setLoading(true);
    try {
      const user = await loginWithEmail(email, password);
      const p = await getUserProfile(user.uid);
      if (p?.role !== 'admin') {
        setError('This account is not authorized for the admin panel.');
        setLoading(false);
        return;
      }
      toast.success('Welcome back, admin.');
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-[420px] flex flex-col items-center">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-10 text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-black/30 border border-white/10">
            <LayoutDashboard className="w-8 h-8" />
          </div>
          <h1 className="font-display font-black text-3xl tracking-tighter text-white mb-2">Admin Panel</h1>
          <p className="text-gray-500 font-medium text-sm uppercase tracking-widest">Restricted access</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="w-full bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl border border-white/5 space-y-5">
          {error && (
            <div className="bg-red-500/10 text-red-400 p-3 rounded-2xl text-sm font-medium border border-red-500/20">
              {error}
            </div>
          )}
          {demo && (
            <div className="bg-amber-500/10 text-amber-400 p-3 rounded-2xl text-xs font-medium border border-amber-500/20">
              Demo mode: any submission opens the dashboard with sample data.
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2 ml-1">Admin email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@mivo.com"
              required
              className="w-full bg-gray-800 border border-white/10 rounded-2xl px-4 h-14 text-white placeholder:text-gray-600 font-medium focus:ring-2 focus:ring-orange-500/40 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2 ml-1">Password</label>
            <div className="flex items-center bg-gray-800 rounded-2xl px-4 h-14 border border-white/10 focus-within:ring-2 focus-within:ring-orange-500/40 transition-all">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-transparent border-none w-full focus:ring-0 text-white placeholder:text-gray-600 font-medium"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-white transition-colors">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-gradient-to-br from-orange-600 to-[#ff8c00] text-white font-display font-bold text-lg rounded-2xl shadow-lg shadow-orange-950/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
            {loading ? 'Verifying…' : 'Sign in to dashboard'}
          </button>
        </form>

        <p className="mt-8 text-[11px] text-gray-600 font-medium text-center leading-relaxed max-w-xs">
          Admin roles are granted manually in Firestore, not through self-signup. Contact a super-admin if you need access.
        </p>
      </div>
    </div>
  );
}

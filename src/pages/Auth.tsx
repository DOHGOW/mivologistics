import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Loader2, User as UserIcon } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  sendResetEmail,
  isDemoMode,
} from '../firebase';
import { createUserProfile, getUserProfile } from '../lib/firestore';

export default function Auth() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const afterAuth = async (uid: string, fallbackName: string, fallbackEmail: string) => {
    let profile = await getUserProfile(uid);
    if (!profile) {
      await createUserProfile({
        uid,
        displayName: fallbackName || 'Mivo Customer',
        email: fallbackEmail,
        role: 'user',
        status: 'active',
      });
    } else if (profile.role !== 'user') {
      setError(`This account is registered as a ${profile.role}. Use the right portal to sign in.`);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isDemoMode) {
      toast.info('Demo mode — connect Firebase to enable real accounts.');
      navigate('/home');
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        const user = await registerWithEmail(email, password, name);
        await createUserProfile({ uid: user.uid, displayName: name, email, role: 'user', status: 'active' });
        toast.success(`Welcome to Mivo, ${name.split(' ')[0]}!`);
        navigate('/home');
      } else {
        const user = await loginWithEmail(email, password);
        const ok = await afterAuth(user.uid, user.displayName || '', user.email || email);
        if (ok) {
          toast.success('Welcome back!');
          navigate('/home');
        }
      }
    } catch (err) {
      setError(humanizeAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    if (isDemoMode) {
      toast.info('Demo mode — connect Firebase to enable Google sign-in.');
      navigate('/home');
      return;
    }
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      const ok = await afterAuth(user.uid, user.displayName || '', user.email || '');
      if (ok) {
        toast.success('Welcome!');
        navigate('/home');
      }
    } catch (err) {
      setError(humanizeAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email above first, then tap "Forgot Password?"');
      return;
    }
    if (isDemoMode) {
      toast.info('Demo mode — password reset needs a live Firebase project.');
      return;
    }
    try {
      await sendResetEmail(email);
      toast.success('Password reset email sent.');
    } catch (err) {
      setError(humanizeAuthError(err));
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-[440px] flex flex-col items-center">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8 text-center"
        >
          <h1 className="font-display font-black text-5xl tracking-tighter text-[#ff8c00] mb-2">Mivo</h1>
          <p className="text-gray-500 font-medium text-lg">Logistics at your fingertips</p>
        </motion.div>

        <div className="flex bg-white p-1.5 rounded-2xl mb-6 shadow-sm border border-gray-100 w-full max-w-[280px]">
          <button
            type="button"
            onClick={() => setIsSignup(false)}
            className={`flex-1 py-2.5 rounded-xl font-display font-bold text-sm transition-all ${!isSignup ? 'bg-[#ff8c00] text-white shadow-sm' : 'text-gray-400'}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setIsSignup(true)}
            className={`flex-1 py-2.5 rounded-xl font-display font-bold text-sm transition-all ${isSignup ? 'bg-[#ff8c00] text-white shadow-sm' : 'text-gray-400'}`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <AnimatePresence>
              {isSignup && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <label className="block text-sm font-semibold text-gray-500 mb-2 ml-1">Full name</label>
                  <div className="flex items-center bg-white rounded-2xl px-4 h-14 border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-[#ff8c00]/20 transition-all">
                    <UserIcon className="w-5 h-5 text-gray-300 mr-3" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="bg-transparent border-none w-full focus:ring-0 text-gray-900 placeholder:text-gray-300 font-medium"
                      required={isSignup}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-2 ml-1">Email address</label>
              <div className="flex items-center bg-white rounded-2xl px-4 h-14 border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-[#ff8c00]/20 transition-all">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-transparent border-none w-full focus:ring-0 text-gray-900 placeholder:text-gray-300 font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-sm font-semibold text-gray-500">Password</label>
                {!isSignup && (
                  <button type="button" onClick={handleForgotPassword} className="text-[#ff8c00] text-xs font-bold hover:underline">
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="flex items-center bg-white rounded-2xl px-4 h-14 border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-[#ff8c00]/20 transition-all">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="bg-transparent border-none w-full focus:ring-0 text-gray-900 placeholder:text-gray-300 font-medium"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-[#ff8c00] transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-gradient-to-br from-[#904d00] to-[#ff8c00] text-white font-display font-bold text-lg rounded-2xl shadow-lg shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{isSignup ? 'Create account' : 'Continue'}<ArrowRight className="w-5 h-5" /></>}
          </button>

          <div className="relative py-4 flex items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-xs font-bold text-gray-400 uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <div className="grid grid-cols-1 gap-4 w-full">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-14 bg-white border border-gray-100 shadow-sm hover:bg-gray-50 text-gray-900 font-semibold rounded-2xl flex items-center justify-center gap-3 transition-colors disabled:opacity-60"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>
          </div>
        </form>

        <div className="mt-10 text-center px-8">
          <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
            By continuing, you agree to Mivo's <button className="underline">Terms of Service</button> and acknowledge you have read our <button className="underline">Privacy Policy</button>.
          </p>
        </div>
      </div>
    </div>
  );
}

function humanizeAuthError(err: unknown): string {
  const code = err instanceof Error ? err.message : String(err);
  if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password')) return 'Incorrect email or password.';
  if (code.includes('auth/user-not-found')) return 'No account found with that email.';
  if (code.includes('auth/email-already-in-use')) return 'An account already exists with that email.';
  if (code.includes('auth/weak-password')) return 'Password should be at least 6 characters.';
  if (code.includes('auth/invalid-email')) return 'Enter a valid email address.';
  if (code.includes('auth/popup-closed-by-user')) return 'Google sign-in was cancelled.';
  return 'Something went wrong. Please try again.';
}

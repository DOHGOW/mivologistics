import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Truck, User, Phone, ShieldCheck, Loader2, Mail } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { loginWithEmail, registerWithEmail, loginWithGoogle, isDemoMode } from '../../firebase';
import { createUserProfile, createDriverProfile, getUserProfile, getDriverProfile } from '../../lib/firestore';

const VEHICLE_TYPES = ['Mini Truck', 'Flatbed Truck', 'Box Truck', 'Heavy Duty'];

export default function DriverAuth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState(VEHICLE_TYPES[0]);
  const [password, setPassword] = useState('');

  const routeAfterLogin = async (uid: string) => {
    const driverProfile = await getDriverProfile(uid);
    if (!driverProfile || driverProfile.documentsStatus === 'pending') {
      navigate('/driver/documents');
    } else {
      navigate('/driver/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isDemoMode) {
      toast.info('Demo mode — connect Firebase to enable real driver accounts.');
      navigate(isLogin ? '/driver/dashboard' : '/driver/documents');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const user = await loginWithEmail(email, password);
        const profile = await getUserProfile(user.uid);
        if (profile && profile.role !== 'driver') {
          setError(`This account is registered as a ${profile.role}. Use the right portal to sign in.`);
          return;
        }
        toast.success('Welcome back!');
        await routeAfterLogin(user.uid);
      } else {
        const user = await registerWithEmail(email, password, name);
        await createUserProfile({ uid: user.uid, displayName: name, email, phoneNumber: phone, role: 'driver', status: 'active' });
        await createDriverProfile(user.uid, {
          displayName: name,
          email,
          vehicleType,
          plateNumber: '',
          vehicleModel: '',
          vehicleColor: '',
          isOnline: false,
          isVerified: false,
          documentsStatus: 'pending',
          rating: 0,
          totalTrips: 0,
          totalEarnings: 0,
        });
        toast.success('Account created — let\'s verify your documents.');
        navigate('/driver/documents');
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
      navigate(isLogin ? '/driver/dashboard' : '/driver/documents');
      return;
    }
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      let profile = await getUserProfile(user.uid);
      if (!profile) {
        await createUserProfile({ uid: user.uid, displayName: user.displayName || 'Driver', email: user.email || '', role: 'driver', status: 'active' });
        await createDriverProfile(user.uid, {
          displayName: user.displayName || 'Driver',
          email: user.email || '',
          vehicleType: VEHICLE_TYPES[0],
          plateNumber: '',
          vehicleModel: '',
          vehicleColor: '',
          isOnline: false,
          isVerified: false,
          documentsStatus: 'pending',
          rating: 0,
          totalTrips: 0,
          totalEarnings: 0,
        });
        navigate('/driver/documents');
        return;
      }
      if (profile.role !== 'driver') {
        setError(`This account is registered as a ${profile.role}. Use the right portal to sign in.`);
        return;
      }
      await routeAfterLogin(user.uid);
    } catch (err) {
      setError(humanizeAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-[440px] flex flex-col items-center">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-10 text-center"
        >
          <div className="w-16 h-16 bg-[#ff8c00] rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-orange-100">
            <Truck className="w-8 h-8" />
          </div>
          <h1 className="font-display font-black text-4xl tracking-tighter text-gray-900 mb-2">Driver Portal</h1>
          <p className="text-gray-500 font-medium text-sm uppercase tracking-widest">
            {isLogin ? 'Welcome Back' : 'Join the Fleet'}
          </p>
        </motion.div>

        <div className="w-full bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-100 border border-gray-50">
          <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-8">
            <button type="button" onClick={() => setIsLogin(true)} className={`flex-1 py-3 rounded-xl font-display font-bold text-sm transition-all ${isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>
              Login
            </button>
            <button type="button" onClick={() => setIsLogin(false)} className={`flex-1 py-3 rounded-xl font-display font-bold text-sm transition-all ${!isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-5 overflow-hidden"
                >
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                    <div className="flex items-center bg-gray-50 rounded-2xl px-4 h-14 border border-transparent focus-within:bg-white focus-within:border-orange-100 transition-all">
                      <User className="w-5 h-5 text-gray-300 mr-3" />
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="bg-transparent border-none w-full focus:ring-0 text-gray-900 placeholder:text-gray-300 font-medium" required={!isLogin} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Vehicle Type</label>
                    <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className="w-full bg-gray-50 rounded-2xl px-4 h-14 border border-transparent focus-within:bg-white focus-within:border-orange-100 transition-all text-gray-900 font-medium appearance-none">
                      {VEHICLE_TYPES.map((v) => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                    <div className="flex items-center bg-gray-50 rounded-2xl px-4 h-14 border border-transparent focus-within:bg-white focus-within:border-orange-100 transition-all">
                      <Phone className="w-5 h-5 text-gray-300 mr-3" />
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0801 234 5678" className="bg-transparent border-none w-full focus:ring-0 text-gray-900 placeholder:text-gray-300 font-medium" required={!isLogin} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Email address</label>
              <div className="flex items-center bg-gray-50 rounded-2xl px-4 h-14 border border-transparent focus-within:bg-white focus-within:border-orange-100 transition-all">
                <Mail className="w-5 h-5 text-gray-300 mr-3" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="bg-transparent border-none w-full focus:ring-0 text-gray-900 placeholder:text-gray-300 font-medium" required />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Password</label>
              </div>
              <div className="flex items-center bg-gray-50 rounded-2xl px-4 h-14 border border-transparent focus-within:bg-white focus-within:border-orange-100 transition-all">
                <ShieldCheck className="w-5 h-5 text-gray-300 mr-3" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} className="bg-transparent border-none w-full focus:ring-0 text-gray-900 placeholder:text-gray-300 font-medium" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-[#ff8c00] transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full h-14 bg-gradient-to-br from-[#904d00] to-[#ff8c00] text-white font-display font-bold text-lg rounded-2xl shadow-lg shadow-orange-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{isLogin ? 'Login' : 'Create Account'}<ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <div className="relative py-6 flex items-center">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink mx-4 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">or</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          <button type="button" onClick={handleGoogleLogin} disabled={loading} className="w-full h-14 bg-white border border-gray-100 shadow-sm hover:bg-gray-50 text-gray-900 font-display font-bold text-sm rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-60">
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>
        </div>

        <div className="mt-10 text-center px-8">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
            By continuing, you agree to Mivo's <button className="text-gray-600 underline">Terms</button> and <button className="text-gray-600 underline">Privacy Policy</button>.
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

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  TrendingUp,
  Truck,
  MapPin,
  ChevronRight,
  Star,
  Wallet,
  User,
  Settings,
  AlertCircle,
  X,
  CheckCircle2,
  FileText,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { logout, isDemoMode } from '../../firebase';
import {
  watchPendingBookings,
  updateBooking,
  updateDriverProfile,
  getDriverProfile,
  getDriverStats,
  getDriverRating,
  type Booking,
  type DriverProfile,
} from '../../lib/firestore';
import { distanceKm } from '../../lib/geocode';

const BACKHAUL_RADIUS_KM = 15;

const DEMO_JOBS: Booking[] = [
  { id: 'MV-9021', userId: 'u1', userName: 'Oluwaseun A.', truckId: '2', truckName: 'Medium', pickupLocation: 'Ikeja City Mall, Lagos', pickupCoords: { lat: 6.6, lng: 3.35 }, destination: 'Lekki Phase 1, Lagos', destinationCoords: { lat: 6.45, lng: 3.47 }, distanceKm: 18.5, price: 12500, paymentStatus: 'paid', status: 'pending' },
  { id: 'MV-9022', userId: 'u2', userName: 'Chidi E.', truckId: '3', truckName: 'Large', pickupLocation: 'Apapa Port, Lagos', pickupCoords: { lat: 6.44, lng: 3.36 }, destination: 'Surulere, Lagos', destinationCoords: { lat: 6.5, lng: 3.35 }, distanceKm: 12.2, price: 25000, paymentStatus: 'paid', status: 'pending' },
];

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { user, profile, isDemoMode: demo } = useAuth();
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [driverStats, setDriverStats] = useState<{ totalTrips: number; totalEarnings: number } | null>(null);
  const [driverRating, setDriverRating] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [jobs, setJobs] = useState<Booking[]>(isDemoMode ? DEMO_JOBS : []);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (isDemoMode || !user) return;
    getDriverProfile(user.uid).then((p) => {
      setDriverProfile(p);
      setIsOnline(p?.isOnline || false);
    });
    // totalTrips/totalEarnings on DriverProfile are never actually written
    // (firestore.rules doesn't allow a driver to self-update them) -- derive
    // the real numbers live from delivered bookings instead.
    getDriverStats(user.uid).then(setDriverStats);
    // DriverProfile.rating is never actually written -- derive it live
    // from the reviews collection instead.
    getDriverRating(user.uid).then((r) => setDriverRating(r.rating || 4.9));
  }, [user]);

  useEffect(() => {
    if (isDemoMode) return;
    const unsub = watchPendingBookings(setJobs);
    return () => unsub();
  }, []);

  // One-off backhaul matching: when the driver goes online, grab a single
  // position fix (free -- browser geolocation, no API cost) and use it to
  // sort/highlight the nearest pending jobs, so a driver who just dropped
  // off cargo sees return-leg work near them instead of an arbitrary list.
  useEffect(() => {
    if (isDemoMode || !isOnline || !('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setDriverPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}, // permission denied or unavailable -- jobs just show in default order
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 8000 }
    );
  }, [isOnline]);

  const isVerified = isDemoMode || driverProfile?.isVerified;

  const jobsWithDistance = jobs
    .map((job) => ({
      ...job,
      distanceFromDriver: driverPos && job.pickupCoords ? distanceKm(driverPos, job.pickupCoords) : undefined,
    }))
    .sort((a, b) => (a.distanceFromDriver ?? Infinity) - (b.distanceFromDriver ?? Infinity));

  const toggleOnline = async () => {
    const next = !isOnline;
    setIsOnline(next);
    if (!isDemoMode && user) {
      await updateDriverProfile(user.uid, { isOnline: next });
    }
  };

  const handleAccept = async (job: Booking) => {
    if (isDemoMode || !user || !profile) {
      navigate(`/driver/trip/${job.id}`);
      return;
    }
    setAccepting(job.id!);
    try {
      await updateBooking(job.id!, { driverId: user.uid, driverName: profile.displayName, driverPhone: profile.phoneNumber || null, status: 'assigned' });
      toast.success('Job accepted — head to pickup.');
      navigate(`/driver/trip/${job.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not accept this job — it may already be taken.');
    } finally {
      setAccepting(null);
    }
  };

  const handleSignOut = async () => {
    if (!demo) await logout();
    navigate('/driver/auth');
  };

  const stats = [
    { label: 'Total Earnings', value: `₦${(isDemoMode ? 45000 : driverStats?.totalEarnings ?? 0).toLocaleString()}`, icon: <Wallet className="w-5 h-5" />, color: 'text-green-600 bg-green-50' },
    { label: 'Trips Completed', value: String(isDemoMode ? 12 : driverStats?.totalTrips ?? 0), icon: <Truck className="w-5 h-5" />, color: 'text-blue-600 bg-blue-50' },
    { label: 'Rating', value: (driverRating ?? 4.9).toFixed(1), icon: <Star className="w-5 h-5" />, color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-24">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 flex justify-between items-center border-b border-gray-50">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMenuOpen(true)} className="p-2 rounded-2xl bg-gray-50 text-gray-900 active:scale-90 transition-all">
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h1 className="font-display font-black text-xl text-gray-900 tracking-tight">Driver Panel</h1>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {isOnline ? 'Online & Ready' : 'Offline'}
              </span>
              <span className="mx-1 text-gray-200">•</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isVerified ? 'text-green-500' : 'text-orange-400'}`}>
                {isVerified ? 'Verified' : 'Pending Review'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/notifications')} className="p-2 rounded-2xl bg-gray-50 text-gray-900 relative">
            <Bell className="w-6 h-6" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#ff8c00] rounded-full border-2 border-white" />
          </button>
          <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-sm bg-gray-100 flex items-center justify-center text-gray-400 font-display font-bold">
            {profile?.displayName?.[0] || 'D'}
          </button>
        </div>
      </header>

      <main className="px-6 pt-8">
        {!isVerified && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-5 bg-orange-50 border border-orange-100 rounded-3xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-display font-bold text-orange-900 text-sm">Your documents are under review</p>
              <p className="text-xs text-orange-600 mt-1">You can browse the dashboard, but you can't go online or accept jobs until an admin verifies your documents.</p>
            </div>
          </motion.div>
        )}

        <div className="mb-8 bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-50 overflow-hidden relative h-64">
          <div className="absolute inset-0 bg-[#f0f2f5] opacity-50">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200">
              <path d="M 50 150 Q 150 100 200 80 T 350 30" fill="none" stroke="#ff8c00" strokeWidth="6" strokeLinecap="round" strokeDasharray="12 8" />
              <circle cx="50" cy="150" r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
              <circle cx="350" cy="30" r="5" fill="#ff8c00" stroke="white" strokeWidth="2" />
              <motion.g animate={{ x: [50, 350], y: [150, 30] }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}>
                <circle r="10" fill="white" />
                <Truck className="w-4 h-4 text-[#ff8c00] -translate-x-2 -translate-y-2" />
              </motion.g>
            </svg>
          </div>
          <div className="relative z-10 h-full flex flex-col justify-end">
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg inline-flex items-center gap-3 self-start">
              <div className="w-10 h-10 rounded-xl bg-[#ff8c00] flex items-center justify-center text-white">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Area</p>
                <p className="text-sm font-bold text-gray-900">Lagos Mainland & Island</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-50 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isOnline ? 'bg-orange-50 text-[#ff8c00]' : 'bg-gray-50 text-gray-400'}`}>
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Current Status</p>
              <p className="font-display font-bold text-gray-900">{isOnline ? 'Accepting Jobs' : 'Resting'}</p>
            </div>
          </div>
          <button
            onClick={toggleOnline}
            disabled={!isVerified}
            className={`w-16 h-8 rounded-full relative transition-all duration-300 disabled:opacity-40 ${isOnline ? 'bg-[#ff8c00]' : 'bg-gray-200'}`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-300 ${isOnline ? 'left-9' : 'left-1'}`} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-4 rounded-3xl border border-gray-50 shadow-sm">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${stat.color}`}>
                {stat.icon}
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="font-display font-black text-sm text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 flex justify-between items-center">
          <h2 className="font-display font-black text-2xl text-gray-900 tracking-tight">Available Requests</h2>
          <button onClick={() => navigate('/driver/history')} className="text-[#ff8c00] text-sm font-bold flex items-center gap-1">
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {isOnline && isVerified && jobs.length === 0 && (
            <div className="bg-white p-8 rounded-[2rem] border border-gray-50 text-center text-gray-400 text-sm font-medium">
              No requests nearby right now — you'll be notified the moment one comes in.
            </div>
          )}
          {(!isOnline || !isVerified) && (
            <div className="bg-white p-8 rounded-[2rem] border border-gray-50 text-center text-gray-400 text-sm font-medium">
              Go online to start seeing job requests.
            </div>
          )}
          {isOnline && isVerified && jobsWithDistance.map((job) => {
            const isBackhaul = job.distanceFromDriver != null && job.distanceFromDriver <= BACKHAUL_RADIUS_KM;
            return (
            <motion.div key={job.id} whileHover={{ scale: 1.01 }} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              <div className="relative z-10">
                {isBackhaul && (
                  <div className="inline-flex items-center gap-1.5 bg-orange-50 text-[#ff8c00] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                    <Flame className="w-3 h-3" />
                    Backhaul Match · {job.distanceFromDriver!.toFixed(1)} km from you
                  </div>
                )}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-gray-900">{job.userName}</h3>
                      <p className="text-xs text-gray-400 font-medium">{job.distanceKm} km • {job.truckName}</p>
                    </div>
                  </div>
                  <p className="font-display font-black text-xl text-[#ff8c00] tracking-tighter">₦{job.price.toLocaleString()}</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pickup</p>
                      <p className="text-sm font-bold text-gray-900">{job.pickupLocation}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-orange-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Destination</p>
                      <p className="text-sm font-bold text-gray-900">{job.destination}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleAccept(job)}
                    disabled={accepting === job.id}
                    className="flex-1 bg-[#ff8c00] text-white py-4 rounded-2xl font-display font-bold text-sm shadow-lg shadow-orange-100 active:scale-95 transition-all disabled:opacity-60"
                  >
                    {accepting === job.id ? 'Accepting…' : 'Accept Job'}
                  </button>
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>
      </main>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50" />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 left-0 bottom-0 w-[80%] max-w-sm bg-white z-50 flex flex-col shadow-2xl">
              <div className="p-8 pt-12">
                <div className="flex flex-col items-start gap-4 mb-8">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 ring-4 ring-orange-50 flex items-center justify-center text-gray-400 font-display font-bold text-2xl">
                      {profile?.displayName?.[0] || 'D'}
                    </div>
                    {isVerified && (
                      <div className="absolute -bottom-2 -right-2 bg-[#ff8c00] text-white p-1.5 rounded-lg shadow-lg">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-gray-900">{profile?.displayName || 'Driver'}</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#ff8c00] bg-orange-50 px-2 py-0.5 rounded">{isVerified ? 'Verified Driver' : 'Pending'}</span>
                      <span className="text-xs font-medium text-gray-400">★ {(driverRating ?? 4.9).toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <nav className="space-y-2">
                  {[
                    { icon: <TrendingUp className="w-5 h-5" />, label: 'Dashboard', path: '/driver/dashboard', active: true },
                    { icon: <Truck className="w-5 h-5" />, label: 'My Trips', path: '/driver/history' },
                    { icon: <FileText className="w-5 h-5" />, label: 'Documents', path: '/driver/documents' },
                    { icon: <Wallet className="w-5 h-5" />, label: 'Earnings', path: '/driver/earnings' },
                    { icon: <User className="w-5 h-5" />, label: 'Vehicle Info', path: '/driver/vehicle' },
                    { icon: <Settings className="w-5 h-5" />, label: 'Settings', path: '/settings' },
                    { icon: <AlertCircle className="w-5 h-5" />, label: 'Switch to User', path: '/role-selection', color: 'text-blue-600' },
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={() => { navigate(item.path); setIsMenuOpen(false); }}
                      className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${item.active ? 'bg-orange-50 text-[#ff8c00]' : 'text-gray-500 hover:bg-gray-50'} ${item.color || ''}`}
                    >
                      {item.icon}
                      <span className="font-display text-sm font-bold">{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="mt-auto p-8 border-t border-gray-50">
                <button onClick={handleSignOut} className="flex items-center gap-4 text-red-500 font-bold text-sm">
                  <X className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Mic,
  MapPin,
  Navigation,
  Calendar,
  Clock,
  ArrowRight,
  Layers,
  LocateFixed,
  History,
  MessageCircle,
  User,
  Truck,
  Bell
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useBooking } from '../contexts/BookingContext';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../firebase';
import { geocodeAddress, distanceKm } from '../lib/geocode';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';

export default function Home() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const { booking, setBooking } = useBooking();
  const { user: authUser, profile, isDemoMode } = useAuth();
  const unreadCount = useUnreadNotifications(authUser?.uid);

  const user = {
    displayName: profile?.displayName || 'Guest User',
    photoURL: profile?.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100',
  };
  const userProfile = { role: profile?.role || 'user', displayName: profile?.displayName || 'Guest User' };

  const handleFindTruck = async () => {
    if (!booking.destination) {
      toast.error('Please enter a destination');
      return;
    }
    setLocating(true);
    try {
      const [pickup, dest] = await Promise.all([
        booking.pickupLocation && booking.pickupLocation !== 'Current Location'
          ? geocodeAddress(booking.pickupLocation)
          : Promise.resolve(null),
        geocodeAddress(booking.destination),
      ]);

      if (!dest) {
        toast.error("Couldn't locate that destination. Try a more specific address.");
        return;
      }

      const pickupCoords = pickup ? { lat: pickup.lat, lng: pickup.lng } : { lat: 6.5244, lng: 3.3792 };
      const destinationCoords = { lat: dest.lat, lng: dest.lng };

      setBooking({
        ...booking,
        pickupCoords,
        destinationCoords,
        distanceKm: Number(distanceKm(pickupCoords, destinationCoords).toFixed(1)),
      });
      navigate('/select-truck');
    } catch {
      toast.error('Could not verify locations. Check your connection and try again.');
    } finally {
      setLocating(false);
    }
  };

  const handleLogout = async () => {
    if (!isDemoMode) await logout();
    navigate('/auth');
  };

  return (
    <div className="relative h-screen bg-[#fcf9f8] overflow-hidden">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2000" 
          alt="Map"
          className="w-full h-full object-cover grayscale opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#fcf9f8]/40 via-transparent to-[#fcf9f8]" />
      </div>

      {/* Header */}
      <header className="relative z-50 flex justify-between items-center px-6 h-16 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-500" />
          </button>
          <span className="font-display font-black text-2xl tracking-tighter text-[#ff8c00]">Mivo</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-6 items-center mr-4">
            <button className="text-[#ff8c00] font-bold text-sm">Book</button>
            <button className="text-gray-500 text-sm hover:text-[#ff8c00]">Activity</button>
            <button className="text-gray-500 text-sm hover:text-[#ff8c00]">Chat</button>
          </div>
          <button
            onClick={() => navigate('/notifications')}
            className="p-2 rounded-full bg-gray-50 text-gray-900 relative hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ff8c00] rounded-full border-2 border-white" />}
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-sm"
          >
            <img src={user?.photoURL || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100"} alt="Profile" />
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="relative z-40 px-6 mt-4">
        <div className="max-w-lg mx-auto bg-white/90 backdrop-blur-md rounded-2xl p-2 shadow-xl border border-white/20 flex items-center gap-3 px-4 h-14">
          <MapPin className="w-5 h-5 text-[#ff8c00]" />
          <input
            type="text"
            value={booking.destination}
            onChange={(e) => setBooking({ ...booking, destination: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleFindTruck()}
            placeholder="Where are you shipping to?"
            className="bg-transparent border-none focus:ring-0 w-full text-gray-900 placeholder:text-gray-400 font-medium"
          />
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute right-6 top-40 z-10 flex flex-col gap-3">
        <button className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-gray-600 hover:text-[#ff8c00] transition-colors">
          <Layers className="w-6 h-6" />
        </button>
        <button className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-gray-600 hover:text-[#ff8c00] transition-colors">
          <LocateFixed className="w-6 h-6" />
        </button>
      </div>

      {/* Booking Panel */}
      <main className="absolute bottom-0 left-0 w-full z-40 flex flex-col items-center">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-3" />
        <section className="w-full max-w-2xl bg-white rounded-t-[3rem] shadow-2xl p-6 pb-28 md:pb-12 max-h-[85vh] overflow-y-auto no-scrollbar">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h1 className="font-display font-extrabold text-2xl text-gray-900 tracking-tight leading-tight">Select your route</h1>
              <p className="text-gray-500 text-xs mt-1">Reliable shipping starts here.</p>
            </div>
            <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Fastest Route
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative group">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-4">Pickup Location</label>
              <div className="bg-gray-50 rounded-2xl flex items-center px-4 h-12 border border-transparent focus-within:border-[#ff8c00]/20 focus-within:bg-white transition-all">
                <Navigation className="w-4 h-4 text-[#ff8c00] mr-3" />
                <input 
                  type="text" 
                  value={booking.pickupLocation}
                  onChange={(e) => setBooking({ ...booking, pickupLocation: e.target.value })}
                  className="bg-transparent border-none focus:ring-0 w-full font-semibold text-sm text-gray-900"
                />
              </div>
            </div>

            <div className="ml-[2.1rem] h-3 w-0.5 bg-gradient-to-b from-[#ff8c00] to-orange-100" />

            <div className="relative group">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-4">Destination</label>
              <div className="bg-gray-50 rounded-2xl flex items-center px-4 h-12 border border-transparent focus-within:border-[#ff8c00]/20 focus-within:bg-white transition-all">
                <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                <input 
                  type="text" 
                  placeholder="Destination"
                  value={booking.destination}
                  onChange={(e) => setBooking({ ...booking, destination: e.target.value })}
                  className="bg-transparent border-none focus:ring-0 w-full font-medium text-sm text-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-4">Select Date</label>
                <div className="bg-gray-50 rounded-2xl flex items-center px-4 h-12">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                  <select 
                    value={booking.date}
                    onChange={(e) => setBooking({ ...booking, date: e.target.value })}
                    className="bg-transparent border-none focus:ring-0 w-full font-medium text-xs text-gray-900 appearance-none"
                  >
                    <option>Now</option>
                    <option>Custom Date</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-4">Select Time</label>
                <div className="bg-gray-50 rounded-2xl flex items-center px-4 h-12">
                  <Clock className="w-4 h-4 text-gray-400 mr-2" />
                  <select 
                    value={booking.time}
                    onChange={(e) => setBooking({ ...booking, time: e.target.value })}
                    className="bg-transparent border-none focus:ring-0 w-full font-medium text-xs text-gray-900 appearance-none"
                  >
                    <option>ASAP</option>
                    <option>Schedule</option>
                  </select>
                </div>
              </div>
            </div>

            <button 
              onClick={handleFindTruck}
              disabled={locating}
              className="w-full mt-6 h-14 bg-[#ff8c00] rounded-2xl text-white font-display font-bold text-base shadow-xl shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {locating ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Find Truck<ArrowRight className="w-5 h-5" /></>}
            </button>
          </div>
        </section>
      </main>

      {/* Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-white/80 backdrop-blur-xl flex justify-around items-center px-4 pb-6 pt-3 shadow-lg rounded-t-[2rem]">
        <button className="flex flex-col items-center justify-center bg-orange-50 text-[#ff8c00] rounded-2xl px-4 py-1.5">
          <Truck className="w-6 h-6" />
          <span className="font-medium text-[11px]">Book</span>
        </button>
        <button 
          onClick={() => navigate('/history')}
          className="flex flex-col items-center justify-center text-gray-400 px-4 py-1.5 hover:text-[#ff8c00]"
        >
          <History className="w-6 h-6" />
          <span className="font-medium text-[11px]">Activity</span>
        </button>
        <button 
          onClick={() => navigate('/chat')}
          className="flex flex-col items-center justify-center text-gray-400 px-4 py-1.5 hover:text-[#ff8c00]"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="font-medium text-[11px]">Chat</span>
        </button>
        <button 
          onClick={() => navigate('/profile')}
          className="flex flex-col items-center justify-center text-gray-400 px-4 py-1.5 hover:text-[#ff8c00]"
        >
          <User className="w-6 h-6" />
          <span className="font-medium text-[11px]">Account</span>
        </button>
      </nav>

      {/* Side Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 z-[70] h-full w-80 rounded-r-3xl bg-white shadow-2xl flex flex-col py-8 px-4"
            >
              <div className="flex flex-col items-start px-4 mb-8 gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 ring-4 ring-orange-50">
                    <img src={user?.photoURL || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200"} alt="User" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-[#ff8c00] text-white p-1 rounded-lg shadow-lg">
                    <Truck className="w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <h2 className="font-display text-xl font-bold text-gray-900">{user?.displayName || userProfile?.displayName || "Guest User"}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#ff8c00] bg-orange-50 px-2 py-0.5 rounded">{userProfile?.role === 'admin' ? 'Admin' : 'Gold Member'}</span>
                    <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                      ★ 4.98 Rating
                    </span>
                  </div>
                </div>
              </div>

              <nav className="flex-1 space-y-1">
                {[
                  { icon: <User />, label: "My Profile", path: "/profile" },
                  { icon: <History />, label: "Shipping History", path: "/history" },
                  { icon: <Calendar />, label: "Payment Methods", path: "/wallet" },
                  { icon: <Mic />, label: "Support Center", path: "/support" },
                  { icon: <Search />, label: "Settings", path: "/settings" },
                ].map((item, i) => (
                  <button 
                    key={i}
                    onClick={() => { navigate(item.path); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-600 hover:bg-orange-50 hover:text-[#ff8c00] transition-all"
                  >
                    <span className="w-5 h-5">{item.icon}</span>
                    <span className="font-display text-sm font-semibold">{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="mt-auto border-t border-gray-100 pt-6 px-4">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 transition-all"
                >
                  <ArrowRight className="w-5 h-5" />
                  <span className="font-display text-sm font-bold">Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

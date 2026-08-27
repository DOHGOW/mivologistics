import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Settings, Shield, CreditCard, Bell, HelpCircle, LogOut, ChevronRight, Truck, Star, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { logout, isDemoMode } from '../firebase';
import { countUserBookings, getDriverStats, getDriverRating } from '../lib/firestore';

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, isDemoMode: demo } = useAuth();
  const [stat, setStat] = useState<{ trips: number; rating: number }>({ trips: 124, rating: 4.9 });

  useEffect(() => {
    if (isDemoMode || !user || !profile) return;
    if (profile.role === 'driver') {
      // DriverProfile's own totalTrips/rating fields are never actually
      // written -- derive both live from delivered bookings / reviews.
      Promise.all([getDriverStats(user.uid), getDriverRating(user.uid)]).then(([stats, rating]) => {
        setStat({ trips: stats.totalTrips, rating: rating.rating || 4.9 });
      });
    } else {
      countUserBookings(user.uid).then((count) => setStat((s) => ({ ...s, trips: count })));
    }
  }, [user, profile]);

  const handleLogout = async () => {
    if (!demo) await logout();
    navigate(profile?.role === 'driver' ? '/driver/auth' : '/auth');
  };

  const menuItems = profile?.role === 'driver'
    ? [
        { icon: <Truck className="w-5 h-5" />, label: 'My Trips', path: '/driver/history', color: 'text-blue-600 bg-blue-50' },
        { icon: <CreditCard className="w-5 h-5" />, label: 'Earnings', path: '/driver/earnings', color: 'text-orange-600 bg-orange-50' },
        { icon: <Bell className="w-5 h-5" />, label: 'Notifications', path: '/notifications', color: 'text-purple-600 bg-purple-50' },
        { icon: <Shield className="w-5 h-5" />, label: 'Vehicle Info', path: '/driver/vehicle', color: 'text-green-600 bg-green-50' },
        { icon: <HelpCircle className="w-5 h-5" />, label: 'Support Center', path: '/support', color: 'text-red-600 bg-red-50' },
      ]
    : [
        { icon: <Truck className="w-5 h-5" />, label: 'My Bookings', path: '/history', color: 'text-blue-600 bg-blue-50' },
        { icon: <CreditCard className="w-5 h-5" />, label: 'Wallet', path: '/wallet', color: 'text-orange-600 bg-orange-50' },
        { icon: <Bell className="w-5 h-5" />, label: 'Notifications', path: '/notifications', color: 'text-purple-600 bg-purple-50' },
        { icon: <Shield className="w-5 h-5" />, label: 'Privacy & Security', path: '/settings', color: 'text-green-600 bg-green-50' },
        { icon: <HelpCircle className="w-5 h-5" />, label: 'Support Center', path: '/support', color: 'text-red-600 bg-red-50' },
      ];

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-12">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 flex justify-between items-center w-full px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="font-display font-bold text-lg text-gray-900">Profile</h1>
        </div>
        <button onClick={() => navigate('/settings')} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <Settings className="w-5 h-5 text-gray-900" />
        </button>
      </header>

      <main className="max-w-screen-md mx-auto px-6 pt-8">
        <div className="flex flex-col items-center mb-10">
          <div className="relative">
            <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden ring-4 ring-white shadow-2xl bg-gray-100 flex items-center justify-center text-gray-400 font-display font-black text-4xl">
              {profile?.displayName?.[0] || 'G'}
            </div>
            <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#ff8c00] text-white rounded-2xl flex items-center justify-center shadow-lg border-4 border-white">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
          <h2 className="mt-6 font-display font-black text-3xl text-gray-900 tracking-tighter">{profile?.displayName || 'Guest User'}</h2>
          <p className="text-gray-500 font-medium">{profile?.phoneNumber || profile?.email || 'No contact info'}</p>

          <div className="mt-6 flex gap-4">
            <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-50 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trips</p>
              <p className="font-display font-bold text-xl text-gray-900">{stat.trips}</p>
            </div>
            <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-50 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rating</p>
              <div className="flex items-center gap-1 justify-center">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <p className="font-display font-bold text-xl text-gray-900">{stat.rating.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {menuItems.map((item, i) => (
            <button key={i} onClick={() => navigate(item.path)} className="w-full bg-white p-5 rounded-3xl shadow-sm border border-gray-50 flex items-center justify-between group hover:border-[#ff8c00]/20 transition-all">
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.color}`}>
                  {item.icon}
                </div>
                <span className="font-display font-bold text-gray-900 text-lg">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#ff8c00] transition-colors" />
            </button>
          ))}
        </div>

        <button onClick={handleLogout} className="w-full mt-10 p-5 rounded-3xl bg-red-50 text-red-600 font-display font-bold text-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </main>
    </div>
  );
}

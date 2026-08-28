import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Truck, Map, BarChart3, Settings, Bell, Search, Menu, X,
  ArrowUpRight, DollarSign, Clock, CheckCircle2, AlertCircle, ChevronRight, LogOut,
  Star, ClipboardList, Activity, MapPin, ShieldCheck, MessageCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { logout, isDemoMode } from '../../firebase';
import { getAdminBookingStats, getAdminFleetStats, listAllBookingsPage, type AdminBookingStats, type AdminFleetStats, type Booking } from '../../lib/firestore';
import { useUnreadNotifications } from '../../hooks/useUnreadNotifications';

const DEMO_STATS: AdminBookingStats = { totalRevenue: 12500000, totalBookings: 8420, activeShipments: 342, pendingRequests: 124 };
const DEMO_FLEET: AdminFleetStats = { availableTrucks: 18, totalTrucks: 24, onlineDrivers: 32, totalDrivers: 47, avgDriverRating: 4.8, pendingVerifications: 6 };
const DEMO_TRIPS: Booking[] = [
  { id: 'MV-9021', userId: 'u1', userName: 'Oluwaseun A.', driverName: 'John Driver', truckId: '2', truckName: 'Medium', pickupLocation: '', pickupCoords: { lat: 0, lng: 0 }, destination: '', destinationCoords: { lat: 0, lng: 0 }, distanceKm: 0, price: 12500, paymentStatus: 'paid', status: 'in-transit' },
  { id: 'MV-9020', userId: 'u2', userName: 'Fatima B.', driverName: 'Chidi E.', truckId: '3', truckName: 'Large', pickupLocation: '', pickupCoords: { lat: 0, lng: 0 }, destination: '', destinationCoords: { lat: 0, lng: 0 }, distanceKm: 0, price: 25000, paymentStatus: 'paid', status: 'delivered' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const unreadCount = useUnreadNotifications(user?.uid);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stats, setStats] = useState<AdminBookingStats>(isDemoMode ? DEMO_STATS : { totalRevenue: 0, totalBookings: 0, activeShipments: 0, pendingRequests: 0 });
  const [fleet, setFleet] = useState<AdminFleetStats>(isDemoMode ? DEMO_FLEET : { availableTrucks: 0, totalTrucks: 0, onlineDrivers: 0, totalDrivers: 0, avgDriverRating: 0, pendingVerifications: 0 });
  const [recentTrips, setRecentTrips] = useState<Booking[]>(isDemoMode ? DEMO_TRIPS : []);
  const [loading, setLoading] = useState(!isDemoMode);

  useEffect(() => {
    if (isDemoMode) return;
    Promise.all([getAdminBookingStats(), getAdminFleetStats(), listAllBookingsPage(5)])
      .then(([s, f, trips]) => {
        setStats(s);
        setFleet(f);
        setRecentTrips(trips.items);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    if (!isDemoMode) await logout();
    navigate('/admin/auth');
  };

  const statCards = [
    { label: 'Total Revenue', value: `₦${(stats.totalRevenue / 1000000).toFixed(1)}M`, icon: <DollarSign className="w-6 h-6" />, color: 'bg-orange-50 text-orange-600' },
    { label: 'Total Bookings', value: stats.totalBookings.toLocaleString(), icon: <BarChart3 className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600' },
    { label: 'Active Shipments', value: stats.activeShipments.toLocaleString(), icon: <MapPin className="w-6 h-6" />, color: 'bg-purple-50 text-purple-600' },
    { label: 'Pending Requests', value: stats.pendingRequests.toLocaleString(), icon: <Clock className="w-6 h-6" />, color: 'bg-green-50 text-green-600' },
  ];

  const fleetBars = [
    { label: 'Available Trucks', value: fleet.availableTrucks, total: fleet.totalTrucks, color: 'bg-green-500' },
    { label: 'Online Drivers', value: fleet.onlineDrivers, total: fleet.totalDrivers, color: 'bg-blue-500' },
  ];

  const menuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Overview', path: '/admin/dashboard', active: true },
    { icon: <Users className="w-5 h-5" />, label: 'User Management', path: '/admin/users' },
    { icon: <Truck className="w-5 h-5" />, label: 'Driver Management', path: '/admin/drivers' },
    { icon: <ClipboardList className="w-5 h-5" />, label: 'Dispatch Center', path: '/admin/dispatch' },
    { icon: <Map className="w-5 h-5" />, label: 'Live Tracking', path: '/admin/live-tracking' },
    { icon: <Activity className="w-5 h-5" />, label: 'Fleet Management', path: '/admin/fleet' },
    { icon: <DollarSign className="w-5 h-5" />, label: 'Financials', path: '/admin/financials' },
    { icon: <ShieldCheck className="w-5 h-5" />, label: 'Compliance', path: '/admin/compliance' },
    { icon: <MessageCircle className="w-5 h-5" />, label: 'Support Center', path: '/admin/support' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Analytics', path: '/admin/analytics' },
    { icon: <Settings className="w-5 h-5" />, label: 'System Settings', path: '/admin/settings' },
  ];

  const sidebar = (
    <>
      <nav className="flex-1 space-y-2">
        {menuItems.map((item, i) => (
          <button
            key={i}
            onClick={() => { navigate(item.path); setIsMenuOpen(false); }}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${item.active ? 'bg-orange-50 text-[#ff8c00]' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            {item.icon}
            <span className="font-display text-sm font-bold">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="pt-8 border-t border-gray-50">
        <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all">
          <LogOut className="w-5 h-5" />
          <span className="font-display text-sm font-bold">Exit Admin</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex">
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-gray-100 p-8 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-[#ff8c00] rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-100">
            <Truck className="w-6 h-6" />
          </div>
          <h1 className="font-display font-black text-2xl tracking-tighter text-gray-900">Mivo Admin</h1>
        </div>
        {sidebar}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 px-6 lg:px-10 py-4 flex justify-between items-center border-b border-gray-50">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2 rounded-2xl bg-gray-50 text-gray-900">
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex items-center bg-gray-50 rounded-2xl px-4 h-11 w-80 border border-transparent focus-within:bg-white focus-within:border-orange-100 transition-all">
              <Search className="w-4 h-4 text-gray-400 mr-3" />
              <input type="text" placeholder="Search users, drivers, trips..." className="bg-transparent border-none w-full focus:ring-0 text-sm font-medium text-gray-900 placeholder:text-gray-300" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/notifications')} className="p-2.5 rounded-2xl bg-gray-50 text-gray-900 relative hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-[#ff8c00] rounded-full border-2 border-white" />}
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">{profile?.displayName || 'Admin'}</p>
                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Admin</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-[#ff8c00] font-bold">
                {profile?.displayName?.[0] || 'A'}
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 lg:p-10 space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-display font-black text-3xl text-gray-900 tracking-tight">Dashboard Overview</h2>
              <p className="text-gray-500 font-medium">{loading ? 'Loading live data…' : "Here's what's happening with Mivo today."}</p>
            </div>
            <button onClick={() => navigate('/admin/fleet')} className="bg-[#ff8c00] text-white px-6 py-3 rounded-2xl font-display font-bold text-sm shadow-lg shadow-orange-100 hover:scale-105 transition-all">
              Manage Fleet
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {statCards.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <h3 className="font-display font-black text-2xl text-gray-900">{stat.value}</h3>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="font-display font-black text-xl text-gray-900">Recent Trips</h3>
                </div>
                <button onClick={() => navigate('/admin/trips')} className="text-[#ff8c00] text-sm font-bold flex items-center gap-1 hover:underline">
                  View All Trips
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-50">
                      <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trip ID</th>
                      <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Driver</th>
                      <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">User</th>
                      <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price</th>
                      <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentTrips.length === 0 && (
                      <tr><td colSpan={5} className="py-10 text-center text-gray-400 font-medium">No trips yet.</td></tr>
                    )}
                    {recentTrips.map((trip) => (
                      <tr key={trip.id} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 font-display font-bold text-sm text-gray-900">#{(trip.id || '').slice(-6)}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                              {(trip.driverName || '—').charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-gray-600">{trip.driverName || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-[10px] font-bold">
                              {trip.userName.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-gray-600">{trip.userName}</span>
                          </div>
                        </td>
                        <td className="py-4 font-display font-bold text-sm text-[#ff8c00]">₦{trip.price.toLocaleString()}</td>
                        <td className="py-4">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                            trip.status === 'delivered' ? 'bg-green-50 text-green-600' :
                            trip.status === 'in-transit' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                          }`}>
                            {trip.status.replace('-', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50">
              <h3 className="font-display font-black text-xl text-gray-900 mb-8">Fleet Overview</h3>
              <div className="space-y-6">
                {fleetBars.map((bar, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-bold text-gray-500">{bar.label}</span>
                      <span className="text-xs font-bold text-gray-900">{bar.value}/{bar.total}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`${bar.color} h-full transition-all`} style={{ width: `${bar.total ? (bar.value / bar.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
                <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Star className="w-4 h-4" />
                    <span className="text-xs font-medium">Avg. Driver Rating</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{fleet.avgDriverRating.toFixed(1)}/5</span>
                </div>

                {fleet.pendingVerifications > 0 && (
                  <button onClick={() => navigate('/admin/drivers')} className="w-full flex items-center gap-4 p-4 bg-orange-50 rounded-2xl mt-4 text-left hover:bg-orange-100 transition-colors">
                    <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
                    <div>
                      <p className="font-display font-bold text-sm text-orange-900">{fleet.pendingVerifications} drivers awaiting review</p>
                      <p className="text-xs text-orange-600">Tap to open Driver Management</p>
                    </div>
                  </button>
                )}
                {fleet.pendingVerifications === 0 && !loading && (
                  <div className="w-full flex items-center gap-4 p-4 bg-green-50 rounded-2xl mt-4">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <p className="font-display font-bold text-sm text-green-900">All drivers reviewed</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 lg:hidden" />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 left-0 bottom-0 w-[80%] max-w-sm bg-white z-50 flex flex-col shadow-2xl lg:hidden">
              <div className="p-8 pt-12 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#ff8c00] rounded-xl flex items-center justify-center text-white">
                      <Truck className="w-6 h-6" />
                    </div>
                    <h1 className="font-display font-black text-2xl tracking-tighter text-gray-900">Mivo Admin</h1>
                  </div>
                  <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-xl bg-gray-50 text-gray-400">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                {sidebar}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

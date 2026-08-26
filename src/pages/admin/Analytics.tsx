import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, TrendingUp, Percent, Truck } from 'lucide-react';
import { getAdminBookingStats, getBookingStatusCounts, type AdminBookingStats, type BookingStatusCounts } from '../../lib/firestore';
import { isDemoMode } from '../../firebase';

const DEMO_STATS: AdminBookingStats = { totalRevenue: 8400000, totalBookings: 452, activeShipments: 18, pendingRequests: 6 };
const DEMO_STATUS: BookingStatusCounts = { pending: 6, assigned: 9, 'in-transit': 9, delivered: 410, cancelled: 18 };

const STATUS_COLORS: Record<keyof BookingStatusCounts, string> = {
  pending: 'bg-orange-400',
  assigned: 'bg-purple-400',
  'in-transit': 'bg-blue-400',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-400',
};

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminBookingStats>(isDemoMode ? DEMO_STATS : { totalRevenue: 0, totalBookings: 0, activeShipments: 0, pendingRequests: 0 });
  const [statusCounts, setStatusCounts] = useState<BookingStatusCounts>(isDemoMode ? DEMO_STATUS : { pending: 0, assigned: 0, 'in-transit': 0, delivered: 0, cancelled: 0 });
  const [loading, setLoading] = useState(!isDemoMode);

  useEffect(() => {
    if (isDemoMode) return;
    Promise.all([getAdminBookingStats(), getBookingStatusCounts()])
      .then(([s, c]) => { setStats(s); setStatusCounts(c); })
      .finally(() => setLoading(false));
  }, []);

  const totalTrips = statusCounts.pending + statusCounts.assigned + statusCounts['in-transit'] + statusCounts.delivered + statusCounts.cancelled;
  const cancellationRate = totalTrips ? ((statusCounts.cancelled / totalTrips) * 100).toFixed(1) : '0.0';
  const avgTripValue = stats.totalBookings ? Math.round(stats.totalRevenue / stats.totalBookings) : 0;

  const metrics = [
    { label: 'Total Revenue', value: `₦${(stats.totalRevenue / 1000000).toFixed(2)}M`, icon: <DollarSign className="w-5 h-5" /> },
    { label: 'Avg. Trip Value', value: `₦${avgTripValue.toLocaleString()}`, icon: <TrendingUp className="w-5 h-5" /> },
    { label: 'Cancellation Rate', value: `${cancellationRate}%`, icon: <Percent className="w-5 h-5" /> },
    { label: 'Total Trips', value: totalTrips.toLocaleString(), icon: <Truck className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-12">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 border-b border-gray-50">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="font-display font-bold text-lg text-gray-900">Analytics & Reports</h1>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 pt-8 space-y-8">
        {loading && <p className="text-gray-400 font-medium">Loading real-time data…</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, i) => (
            <div key={i} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#ff8c00] flex items-center justify-center mb-4">{metric.icon}</div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{metric.label}</p>
              <h3 className="font-display font-black text-2xl text-gray-900">{metric.value}</h3>
            </div>
          ))}
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50">
          <h3 className="font-display font-black text-xl text-gray-900 mb-8">Booking Status Distribution</h3>
          <div className="space-y-5">
            {(Object.keys(statusCounts) as (keyof BookingStatusCounts)[]).map((key) => (
              <div key={key}>
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500 capitalize">{key.replace('-', ' ')}</span>
                  <span className="text-xs font-bold text-gray-900">{statusCounts[key]}</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`${STATUS_COLORS[key]} h-full transition-all`} style={{ width: `${totalTrips ? (statusCounts[key] / totalTrips) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

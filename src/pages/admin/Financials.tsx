import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, TrendingUp, Truck } from 'lucide-react';
import { usePaginatedQuery } from '../../hooks/usePaginatedQuery';
import { getAdminBookingStats, listAllBookingsPage, type AdminBookingStats, type Booking } from '../../lib/firestore';
import { isDemoMode } from '../../firebase';
import Pagination from '../../components/Pagination';

const DEMO_STATS: AdminBookingStats = { totalRevenue: 8400000, totalBookings: 452, activeShipments: 18, pendingRequests: 6 };
const DEMO_TX: Booking[] = [
  { id: 'TXN-001', userId: 'u1', userName: 'Oluwaseun A.', driverName: 'John Driver', truckId: '2', truckName: 'Medium', pickupLocation: '', pickupCoords: { lat: 0, lng: 0 }, destination: '', destinationCoords: { lat: 0, lng: 0 }, distanceKm: 0, price: 12500, paymentMethod: 'paystack', paymentStatus: 'paid', status: 'delivered' },
  { id: 'TXN-002', userId: 'u2', userName: 'Fatima B.', driverName: 'Chidi E.', truckId: '3', truckName: 'Large', pickupLocation: '', pickupCoords: { lat: 0, lng: 0 }, destination: '', destinationCoords: { lat: 0, lng: 0 }, distanceKm: 0, price: 25000, paymentMethod: 'flutterwave', paymentStatus: 'paid', status: 'delivered' },
];

export default function AdminFinancials() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminBookingStats>(isDemoMode ? DEMO_STATS : { totalRevenue: 0, totalBookings: 0, activeShipments: 0, pendingRequests: 0 });

  const { items, page, hasMore, loading, next, prev } = usePaginatedQuery<Booking>(
    (pageSize, cursor) => listAllBookingsPage(pageSize, cursor),
    10
  );

  useEffect(() => {
    if (isDemoMode) return;
    getAdminBookingStats().then(setStats);
  }, []);

  const transactions = isDemoMode ? DEMO_TX : items.filter((b) => b.paymentStatus === 'paid');
  const avgTripValue = stats.totalBookings ? Math.round(stats.totalRevenue / stats.totalBookings) : 0;

  const metrics = [
    { label: 'Total Revenue (Delivered)', value: `₦${(stats.totalRevenue / 1000000).toFixed(2)}M`, icon: <DollarSign className="w-5 h-5" /> },
    { label: 'Total Bookings', value: stats.totalBookings.toLocaleString(), icon: <Truck className="w-5 h-5" /> },
    { label: 'Avg. Trip Value', value: `₦${avgTripValue.toLocaleString()}`, icon: <TrendingUp className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-12">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 border-b border-gray-50">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="font-display font-bold text-lg text-gray-900">Financial Overview</h1>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 pt-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {metrics.map((metric, i) => (
            <div key={i} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#ff8c00] flex items-center justify-center mb-4">{metric.icon}</div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{metric.label}</p>
              <h3 className="font-display font-black text-2xl text-gray-900">{metric.value}</h3>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden">
          <div className="p-8 border-b border-gray-50">
            <h3 className="font-display font-black text-xl text-gray-900">Paid Transactions</h3>
            <p className="text-xs text-gray-400 font-medium mt-1">Real payments recorded through Paystack, Flutterwave, and wallet.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-50">
                  <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Booking</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Method</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.length === 0 && !loading && (
                  <tr><td colSpan={5} className="text-center py-16 text-gray-400 font-medium">No paid transactions yet.</td></tr>
                )}
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-5 font-display font-bold text-sm text-gray-900">#{(tx.id || '').slice(-6)}</td>
                    <td className="px-8 py-5 text-sm font-medium text-gray-600">{tx.userName}</td>
                    <td className="px-8 py-5 text-sm font-medium text-gray-600 capitalize">{tx.paymentMethod || 'cash'}</td>
                    <td className="px-8 py-5 font-display font-bold text-sm text-[#ff8c00]">₦{tx.price.toLocaleString()}</td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider bg-green-50 text-green-600">Paid</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!isDemoMode && (
            <div className="px-8">
              <Pagination page={page} hasMore={hasMore} loading={loading} onPrev={prev} onNext={next} itemCount={transactions.length} totalLabel="transactions" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

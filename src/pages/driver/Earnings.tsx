import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Wallet, ArrowDownLeft, Truck, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { getDriverProfile, listDriverBookingsPage, type DriverProfile, type Booking } from '../../lib/firestore';
import { isDemoMode } from '../../firebase';

const DEMO_PROFILE: Partial<DriverProfile> = { totalEarnings: 124500, totalTrips: 14, rating: 4.9 };
const DEMO_TX: Booking[] = [
  { id: 'MV-9021', userId: 'u1', userName: 'Oluwaseun A.', truckId: '2', truckName: 'Medium', pickupLocation: '', pickupCoords: { lat: 0, lng: 0 }, destination: '', destinationCoords: { lat: 0, lng: 0 }, distanceKm: 0, price: 12500, paymentStatus: 'paid', status: 'delivered' },
  { id: 'MV-9018', userId: 'u2', userName: 'Chidi E.', truckId: '3', truckName: 'Large', pickupLocation: '', pickupCoords: { lat: 0, lng: 0 }, destination: '', destinationCoords: { lat: 0, lng: 0 }, distanceKm: 0, price: 25000, paymentStatus: 'paid', status: 'delivered' },
];

export default function DriverEarnings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Partial<DriverProfile>>(isDemoMode ? DEMO_PROFILE : {});
  const [transactions, setTransactions] = useState<Booking[]>(isDemoMode ? DEMO_TX : []);

  useEffect(() => {
    if (isDemoMode || !user) return;
    getDriverProfile(user.uid).then((p) => p && setProfile(p));
    listDriverBookingsPage(user.uid, 10).then((res) => setTransactions(res.items.filter((b) => b.status === 'delivered')));
  }, [user]);

  const totalEarnings = profile.totalEarnings || 0;
  const avgPerTrip = profile.totalTrips ? Math.round(totalEarnings / profile.totalTrips) : 0;

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-12">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="font-display font-bold text-lg text-gray-900">Earnings & Wallet</h1>
        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-6 pt-8">
        <div className="bg-gradient-to-br from-[#904d00] to-[#ff8c00] rounded-[2.5rem] p-8 text-white shadow-xl shadow-orange-100 relative overflow-hidden mb-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="relative z-10">
            <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">Total Earnings</p>
            <h2 className="font-display font-black text-5xl tracking-tighter mb-8">₦{totalEarnings.toLocaleString()}</h2>
            <div className="flex gap-3">
              <button
                onClick={() => toast.info('Payout requests are processed by the Mivo team — contact support to withdraw.')}
                className="flex-1 bg-white text-[#ff8c00] py-4 rounded-2xl font-display font-bold text-sm active:scale-95 transition-all"
              >
                Request Withdrawal
              </button>
              <button className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center active:scale-95 transition-all">
                <TrendingUp className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 mb-4">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Trips Completed</p>
            <p className="font-display font-black text-xl text-gray-900 tracking-tight">{profile.totalTrips || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
              <Wallet className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Avg. Per Trip</p>
            <p className="font-display font-black text-xl text-gray-900 tracking-tight">₦{avgPerTrip.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display font-black text-2xl text-gray-900 tracking-tight">Recent Activity</h2>
        </div>

        <div className="space-y-3">
          {transactions.length === 0 && <p className="text-center py-10 text-gray-400 font-medium">No completed trips yet.</p>}
          {transactions.map((tx) => (
            <div key={tx.id} className="bg-white p-5 rounded-3xl border border-gray-50 flex items-center justify-between group active:scale-[0.98] transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-orange-50 text-[#ff8c00]">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-gray-900">Trip #{(tx.id || '').slice(-6)}</h4>
                  <p className="text-xs text-gray-400 font-medium">{tx.userName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display font-black text-lg tracking-tight text-green-600">+₦{tx.price.toLocaleString()}</p>
                <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <Clock className="w-3 h-3" />
                  delivered
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

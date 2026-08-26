import type { ReactElement } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Truck, CheckCircle2, XCircle, Clock, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePaginatedQuery } from '../../hooks/usePaginatedQuery';
import { listDriverBookingsPage, type Booking } from '../../lib/firestore';
import { isDemoMode } from '../../firebase';
import Pagination from '../../components/Pagination';

const DEMO_TRIPS: Booking[] = [
  { id: 'MV-9021', userId: 'u1', userName: 'Oluwaseun A.', truckId: '2', truckName: 'Medium', pickupLocation: 'Ikeja City Mall, Lagos', pickupCoords: { lat: 0, lng: 0 }, destination: 'Lekki Phase 1, Lagos', destinationCoords: { lat: 0, lng: 0 }, distanceKm: 18.5, price: 12500, paymentStatus: 'paid', status: 'delivered' },
  { id: 'MV-9018', userId: 'u2', userName: 'Chidi E.', truckId: '3', truckName: 'Large', pickupLocation: 'Apapa Port, Lagos', pickupCoords: { lat: 0, lng: 0 }, destination: 'Surulere, Lagos', destinationCoords: { lat: 0, lng: 0 }, distanceKm: 12.2, price: 25000, paymentStatus: 'paid', status: 'delivered' },
  { id: 'MV-8992', userId: 'u3', userName: 'Fatima B.', truckId: '1', truckName: 'Small', pickupLocation: 'Victoria Island, Lagos', pickupCoords: { lat: 0, lng: 0 }, destination: 'Ikorodu, Lagos', destinationCoords: { lat: 0, lng: 0 }, distanceKm: 24.1, price: 18200, paymentStatus: 'paid', status: 'cancelled' },
];

const STATUS_META: Record<string, { label: string; color: string; icon: ReactElement }> = {
  delivered: { label: 'Completed', color: 'bg-green-50 text-green-600', icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-500', icon: <XCircle className="w-3 h-3" /> },
  'in-transit': { label: 'In Transit', color: 'bg-blue-50 text-blue-600', icon: <Clock className="w-3 h-3" /> },
  assigned: { label: 'Assigned', color: 'bg-orange-50 text-orange-500', icon: <Clock className="w-3 h-3" /> },
  pending: { label: 'Pending', color: 'bg-gray-50 text-gray-500', icon: <Clock className="w-3 h-3" /> },
};

export default function DriverHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { items, page, hasMore, loading, next, prev } = usePaginatedQuery<Booking>(
    (pageSize, cursor) => listDriverBookingsPage(user?.uid || '', pageSize, cursor),
    8,
    [user?.uid]
  );

  const trips = isDemoMode ? DEMO_TRIPS : items;

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-12">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="font-display font-bold text-lg text-gray-900">Trip History</h1>
        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-6 pt-8">
        {trips.length === 0 && !loading && (
          <div className="text-center py-20 text-gray-400 font-medium">No trips yet — accepted jobs will show up here.</div>
        )}
        <div className="space-y-4">
          {trips.map((trip) => {
            const meta = STATUS_META[trip.status] || STATUS_META.pending;
            return (
              <motion.div key={trip.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 relative overflow-hidden group">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#ff8c00]">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-gray-900">Job #{(trip.id || '').slice(-6)}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{trip.truckName}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${meta.color}`}>
                    {meta.icon}
                    <span className="text-[10px] font-bold uppercase tracking-widest">{meta.label}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-blue-400 mt-0.5" />
                    <p className="text-sm font-medium text-gray-600">{trip.pickupLocation}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-orange-400 mt-0.5" />
                    <p className="text-sm font-medium text-gray-600">{trip.destination}</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-gray-900">{trip.userName}</span>
                  </div>
                  <p className="font-display font-black text-lg text-[#ff8c00] tracking-tighter">₦{trip.price.toLocaleString()}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {!isDemoMode && (
          <Pagination page={page} hasMore={hasMore} loading={loading} onPrev={prev} onNext={next} itemCount={trips.length} totalLabel="trips" />
        )}
      </main>
    </div>
  );
}

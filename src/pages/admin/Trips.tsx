import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, MapPin, Truck, User, Navigation } from 'lucide-react';
import { usePaginatedQuery } from '../../hooks/usePaginatedQuery';
import { listAllBookingsPage, type Booking } from '../../lib/firestore';
import { isDemoMode } from '../../firebase';
import Pagination from '../../components/Pagination';

const DEMO_TRIPS: Booking[] = [
  { id: 'MV-9021', userId: 'u1', userName: 'Oluwaseun A.', driverName: 'John Driver', truckId: '2', truckName: 'Medium', pickupLocation: 'Ikeja City Mall', pickupCoords: { lat: 0, lng: 0 }, destination: 'Lekki Phase 1', destinationCoords: { lat: 0, lng: 0 }, distanceKm: 18, price: 12500, paymentStatus: 'paid', status: 'in-transit' },
  { id: 'MV-9020', userId: 'u2', userName: 'Fatima B.', driverName: 'Chidi E.', truckId: '3', truckName: 'Large', pickupLocation: 'Apapa Port', pickupCoords: { lat: 0, lng: 0 }, destination: 'Surulere', destinationCoords: { lat: 0, lng: 0 }, distanceKm: 12, price: 25000, paymentStatus: 'paid', status: 'delivered' },
  { id: 'MV-9019', userId: 'u3', userName: 'Tunde J.', driverName: null, truckId: '1', truckName: 'Small', pickupLocation: 'Victoria Island', pickupCoords: { lat: 0, lng: 0 }, destination: 'Ikorodu', destinationCoords: { lat: 0, lng: 0 }, distanceKm: 24, price: 18200, paymentStatus: 'paid', status: 'pending' },
];

const STATUS_STYLE: Record<string, string> = {
  delivered: 'bg-green-50 text-green-600',
  'in-transit': 'bg-blue-50 text-blue-600',
  cancelled: 'bg-red-50 text-red-600',
  assigned: 'bg-purple-50 text-purple-600',
  pending: 'bg-orange-50 text-orange-600',
};

export default function AdminTrips() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { items, page, hasMore, loading, next, prev } = usePaginatedQuery<Booking>(
    (pageSize, cursor) => listAllBookingsPage(pageSize, cursor),
    9
  );

  const trips = (isDemoMode ? DEMO_TRIPS : items).filter((t) =>
    !searchQuery.trim() ||
    t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.driverName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-12">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 border-b border-gray-50">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="font-display font-bold text-lg text-gray-900">Trip Monitoring</h1>
          </div>
          <div className="hidden sm:flex items-center bg-gray-50 rounded-xl px-4 h-10 border border-transparent focus-within:bg-white focus-within:border-orange-100 transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-3" />
            <input type="text" placeholder="Search trips..." className="bg-transparent border-none w-full focus:ring-0 text-sm font-medium text-gray-900" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 pt-8">
        {trips.length === 0 && !loading && <p className="text-center py-20 text-gray-400 font-medium">No trips found.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <motion.div key={trip.id} whileHover={{ y: -5 }} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-display font-black text-lg text-gray-900">Trip #{(trip.id || '').slice(-6)}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{trip.truckName}</p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${STATUS_STYLE[trip.status] || STATUS_STYLE.pending}`}>
                  {trip.status.replace('-', ' ')}
                </span>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pickup</p>
                    <p className="text-sm font-bold text-gray-900">{trip.pickupLocation}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-orange-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Destination</p>
                    <p className="text-sm font-bold text-gray-900">{trip.destination}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 pt-6 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">User</p>
                    <p className="text-xs font-bold text-gray-900 truncate">{trip.userName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Driver</p>
                    <p className="text-xs font-bold text-gray-900 truncate">{trip.driverName || 'Unassigned'}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                <p className="font-display font-black text-xl text-[#ff8c00] tracking-tighter">₦{trip.price.toLocaleString()}</p>
                {(trip.status === 'in-transit' || trip.status === 'assigned') && (
                  <button onClick={() => navigate('/admin/live-tracking')} className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-blue-600 transition-all" title="View on live map">
                    <Navigation className="w-5 h-5" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
        {!isDemoMode && (
          <Pagination page={page} hasMore={hasMore} loading={loading} onPrev={prev} onNext={next} itemCount={trips.length} totalLabel="trips" />
        )}
      </main>
    </div>
  );
}

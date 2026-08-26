import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, MapPin, Calendar, ChevronRight, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePaginatedQuery } from '../hooks/usePaginatedQuery';
import { listUserBookingsPage, type Booking } from '../lib/firestore';
import { isDemoMode } from '../firebase';
import Pagination from '../components/Pagination';

const DEMO_HISTORY: Booking[] = [
  { id: '1', userId: 'demo', userName: 'You', truckId: '3', truckName: 'Heavy Duty', pickupLocation: 'Ikeja Hub', pickupCoords: { lat: 0, lng: 0 }, destination: 'Apapa Port', destinationCoords: { lat: 0, lng: 0 }, distanceKm: 20, price: 45000, paymentStatus: 'paid', status: 'delivered' },
  { id: '2', userId: 'demo', userName: 'You', truckId: '3', truckName: 'Flatbed', pickupLocation: 'Lekki Phase 1', pickupCoords: { lat: 0, lng: 0 }, destination: 'Victoria Island', destinationCoords: { lat: 0, lng: 0 }, distanceKm: 8, price: 32000, paymentStatus: 'paid', status: 'delivered' },
  { id: '3', userId: 'demo', userName: 'You', truckId: '1', truckName: 'Cargo Van', pickupLocation: 'Surulere', pickupCoords: { lat: 0, lng: 0 }, destination: 'Yaba', destinationCoords: { lat: 0, lng: 0 }, distanceKm: 6, price: 12000, paymentStatus: 'failed', status: 'cancelled' },
];

export default function History() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const { items, page, hasMore, loading, next, prev } = usePaginatedQuery<Booking>(
    (pageSize, cursor) => listUserBookingsPage(user?.uid || '', pageSize, cursor),
    8,
    [user?.uid]
  );

  const bookings = isDemoMode ? DEMO_HISTORY : items;
  const filtered = useMemo(() => {
    if (!search.trim()) return bookings;
    const q = search.toLowerCase();
    return bookings.filter((b) => b.pickupLocation.toLowerCase().includes(q) || b.destination.toLowerCase().includes(q) || b.truckName.toLowerCase().includes(q));
  }, [bookings, search]);

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-12">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 w-full px-6 py-4 border-b border-gray-50">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="font-display font-bold text-lg text-gray-900">Shipping History</h1>
          </div>
        </div>
        <div className="bg-gray-50 rounded-2xl flex items-center px-4 h-12 border border-gray-100">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shipments..."
            className="bg-transparent border-none focus:ring-0 w-full text-sm font-medium"
          />
        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-6 pt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#ff8c00] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Loading shipments...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300 mb-6">
              <Truck className="w-10 h-10" />
            </div>
            <h3 className="font-display font-bold text-xl text-gray-900 mb-2">No shipments yet</h3>
            <p className="text-gray-500 max-w-xs mx-auto mb-8">Your shipping history will appear here once you make your first booking.</p>
            <button onClick={() => navigate('/home')} className="bg-[#ff8c00] text-white px-8 py-4 rounded-2xl font-display font-bold shadow-lg shadow-orange-200">
              Book a Truck
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filtered.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => navigate('/shipment-status', { state: { bookingId: item.id } })}
                  className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 flex flex-col gap-4 group cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-50 text-[#ff8c00] rounded-2xl flex items-center justify-center">
                        <Truck className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-gray-900">{item.truckName || 'Standard Truck'}</h3>
                        <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                          <Calendar className="w-3 h-3" />
                          {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Recent'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-black text-xl text-gray-900 tracking-tighter">₦{item.price?.toLocaleString() || '0'}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        item.status === 'delivered' ? 'bg-green-50 text-green-600' :
                        item.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-orange-200" />
                      <p className="text-sm text-gray-500 font-medium truncate">{item.pickupLocation}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-300" />
                      <p className="text-sm text-gray-900 font-bold truncate">{item.destination}</p>
                    </div>
                  </div>

                  <button className="mt-2 w-full py-3 rounded-xl bg-gray-50 text-gray-900 font-display font-bold text-sm flex items-center justify-center gap-2 group-hover:bg-orange-50 group-hover:text-[#ff8c00] transition-all">
                    View Details
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
            {!isDemoMode && !search && (
              <Pagination page={page} hasMore={hasMore} loading={loading} onPrev={prev} onNext={next} itemCount={filtered.length} totalLabel="shipments" />
            )}
          </>
        )}
      </main>
    </div>
  );
}

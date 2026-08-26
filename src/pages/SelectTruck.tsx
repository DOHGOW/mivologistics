import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Star, Zap, Truck, Package, Shield, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useBooking } from '../contexts/BookingContext';
import { useAuth } from '../contexts/AuthContext';
import { listTrucks, seedTrucksIfEmpty, type Truck as TruckDoc } from '../lib/firestore';
import { isDemoMode } from '../firebase';

const FALLBACK_TRUCKS: Omit<TruckDoc, 'id'>[] = [
  { name: 'Small', category: 'Instant', capacity: 'Up to 500kg', pricePerKm: 350, available: true, image: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=200' },
  { name: 'Medium', category: 'Top Rated', capacity: 'Up to 2 Tons', pricePerKm: 600, available: true, image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=200' },
  { name: 'Large', category: 'Heavy Duty', capacity: 'Up to 10 Tons', pricePerKm: 950, available: true, image: 'https://images.unsplash.com/photo-1501700493788-fa1a4fc9fe62?auto=format&fit=crop&q=80&w=200' },
  { name: 'XL Cargo', category: 'High Demand', capacity: 'Bulk Cargo', pricePerKm: 1400, available: true, image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=200' },
];

const BASE_FARE = 3000;
const MIN_DISTANCE_KM = 5;

interface DisplayTruck extends TruckDoc {
  rating: number;
  priceDisplay: string;
  price: number;
}

function priceFor(pricePerKm: number, distanceKm: number) {
  return Math.round(BASE_FARE + pricePerKm * Math.max(distanceKm, MIN_DISTANCE_KM));
}

export default function SelectTruck() {
  const navigate = useNavigate();
  const { booking, setBooking } = useBooking();
  const { profile } = useAuth();
  const [trucks, setTrucks] = useState<DisplayTruck[]>([]);
  const [loading, setLoading] = useState(true);
  const distance = booking.distanceKm ?? MIN_DISTANCE_KM;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (!isDemoMode) {
          // Seeding writes to `trucks`, which firestore.rules restricts to
          // admins — only attempt it when the signed-in user actually is
          // one, so a regular customer never triggers (and eats) a
          // permission-denied here.
          if (profile?.role === 'admin') {
            await seedTrucksIfEmpty(FALLBACK_TRUCKS);
          }
          const docs = await listTrucks();
          if (!cancelled && docs.length > 0) {
            setTrucks(docs.filter((t) => t.available).map((t) => ({
              ...t,
              rating: 4.7 + (t.pricePerKm % 30) / 100,
              price: priceFor(t.pricePerKm, distance),
              priceDisplay: `₦${priceFor(t.pricePerKm, distance).toLocaleString()}`,
            })));
            return;
          }
        }
        if (!cancelled) {
          setTrucks(FALLBACK_TRUCKS.map((t, i) => ({
            ...t,
            id: String(i + 1),
            rating: [4.8, 4.9, 4.7, 5.0][i],
            price: priceFor(t.pricePerKm, distance),
            priceDisplay: `₦${priceFor(t.pricePerKm, distance).toLocaleString()}`,
          })));
        }
      } catch {
        // Firestore unreachable/denied for any reason — still show
        // customers something bookable instead of a blank screen.
        if (!cancelled) {
          setTrucks(FALLBACK_TRUCKS.map((t, i) => ({
            ...t,
            id: String(i + 1),
            rating: [4.8, 4.9, 4.7, 5.0][i],
            price: priceFor(t.pricePerKm, distance),
            priceDisplay: `₦${priceFor(t.pricePerKm, distance).toLocaleString()}`,
          })));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [distance, profile?.role]);

  const handleSelectTruck = (truck: DisplayTruck) => {
    setBooking({
      ...booking,
      truckId: truck.id!,
      truckName: truck.name,
      price: truck.price,
    });
    navigate(`/truck-details/${truck.id}`);
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-32">
      <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 flex justify-between items-center w-full px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/home')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="font-display font-bold text-lg text-gray-900">Select Trucks</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-500 text-sm font-medium">
            <span>Sort by</span>
            <ChevronRight className="w-4 h-4 rotate-90" />
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-orange-100">
            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100" alt="Profile" />
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 pt-6">
        <div className="mb-8 p-6 rounded-[2rem] bg-gradient-to-br from-[#904d00] to-[#ff8c00] text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10">
            <p className="text-white/80 text-sm font-medium mb-1">Recommended for you</p>
            <h2 className="text-2xl font-display font-extrabold leading-tight mb-4">Fastest Pick-up Available</h2>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">
              <Zap className="w-3 h-3 fill-current" />
              Ready in 5 mins
            </div>
          </div>
          <Truck className="absolute -right-4 -bottom-4 w-40 h-40 text-white/10 rotate-12" />
        </div>

        {booking.distanceKm != null && (
          <p className="text-xs font-semibold text-gray-400 mb-4 -mt-4">
            {booking.distanceKm} km trip · prices below include distance
          </p>
        )}

        <div className="flex flex-col gap-4">
          {loading && (
            <>
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center p-4 bg-white rounded-[1.5rem] border border-gray-50 animate-pulse">
                  <div className="w-24 h-24 rounded-2xl bg-gray-100" />
                  <div className="ml-5 flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </>
          )}
          {!loading && trucks.map((truck) => (
            <motion.div 
              key={truck.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectTruck(truck)}
              className="group relative flex items-center p-4 bg-white rounded-[1.5rem] shadow-sm border border-gray-50 cursor-pointer transition-all hover:shadow-md"
            >
              <div className="w-24 h-24 rounded-2xl bg-gray-50 flex items-center justify-center p-2 overflow-hidden">
                <img src={truck.image} alt={truck.name} className="w-full h-full object-cover rounded-xl" />
              </div>
              <div className="ml-5 flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-display font-bold text-lg text-gray-900">{truck.name}</h3>
                  <span className="font-display font-extrabold text-[#ff8c00] text-lg">{truck.priceDisplay}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-500">{truck.capacity}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <div className="flex items-center text-yellow-500">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-xs font-bold ml-1 text-gray-900">{truck.rating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter ${truck.category === 'High Demand' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                    {truck.category}
                  </span>
                </div>
              </div>
              <ChevronRight className="ml-2 w-5 h-5 text-gray-300 group-hover:text-[#ff8c00] transition-colors" />
            </motion.div>
          ))}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 w-full z-50 bg-white/80 backdrop-blur-xl flex justify-around items-center px-4 pb-6 pt-3 shadow-lg rounded-t-[2rem]">
        <button className="flex flex-col items-center justify-center bg-orange-50 text-[#ff8c00] rounded-2xl px-4 py-1.5">
          <Truck className="w-6 h-6" />
          <span className="font-medium text-[11px]">Book</span>
        </button>
        <button onClick={() => navigate('/history')} className="flex flex-col items-center justify-center text-gray-400 px-4 py-1.5 hover:text-[#ff8c00]">
          <Package className="w-6 h-6" />
          <span className="font-medium text-[11px]">Shipments</span>
        </button>
        <button onClick={() => navigate('/wallet')} className="flex flex-col items-center justify-center text-gray-400 px-4 py-1.5 hover:text-[#ff8c00]">
          <Shield className="w-6 h-6" />
          <span className="font-medium text-[11px]">Wallet</span>
        </button>
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center justify-center text-gray-400 px-4 py-1.5 hover:text-[#ff8c00]">
          <User className="w-6 h-6" />
          <span className="font-medium text-[11px]">Profile</span>
        </button>
      </nav>
    </div>
  );
}

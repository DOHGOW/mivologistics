import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, MapPin, X, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { watchPendingBookings, listOnlineDrivers, updateBooking, getDriverRating, type Booking, type DriverProfile } from '../../lib/firestore';
import { isDemoMode } from '../../firebase';

const DEMO_PENDING: Booking[] = [
  { id: 'MV-9019', userId: 'u3', userName: 'Tunde J.', truckId: '1', truckName: 'Small', pickupLocation: 'Victoria Island, Lagos', pickupCoords: { lat: 0, lng: 0 }, destination: 'Ikorodu, Lagos', destinationCoords: { lat: 0, lng: 0 }, distanceKm: 24, price: 18200, paymentStatus: 'paid', status: 'pending' },
];
const DEMO_DRIVERS: DriverProfile[] = [
  { uid: 'd1', displayName: 'John Driver', email: '', vehicleModel: 'Mercedes Actros', plateNumber: 'LAG-123-XY', vehicleType: 'Heavy Duty', vehicleColor: 'White', rating: 4.9, isVerified: true, documentsStatus: 'verified', isOnline: true, totalTrips: 142, totalEarnings: 0 },
  { uid: 'd2', displayName: 'Ahmed K.', email: '', vehicleModel: 'Scania R500', plateNumber: 'KND-789-AA', vehicleType: 'Heavy Duty', vehicleColor: 'Grey', rating: 4.8, isVerified: true, documentsStatus: 'verified', isOnline: true, totalTrips: 210, totalEarnings: 0 },
];

export default function AdminDispatch() {
  const navigate = useNavigate();
  const [pending, setPending] = useState<Booking[]>(isDemoMode ? DEMO_PENDING : []);
  const [drivers, setDrivers] = useState<DriverProfile[]>(isDemoMode ? DEMO_DRIVERS : []);
  const [assigning, setAssigning] = useState<Booking | null>(null);
  const [busy, setBusy] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isDemoMode) return;
    const unsub = watchPendingBookings(setPending);
    listOnlineDrivers().then((list) => {
      setDrivers(list);
      // DriverProfile.rating is never actually written -- derive it live
      // from the reviews collection instead.
      list.forEach((d) => {
        getDriverRating(d.uid).then((r) => setRatings((prev) => ({ ...prev, [d.uid]: r.rating || 4.9 })));
      });
    });
    return () => unsub();
  }, []);

  const handleAssign = async (driver: DriverProfile) => {
    if (!assigning) return;
    if (isDemoMode) {
      toast.info('Demo mode — connect Firebase to dispatch real drivers.');
      setAssigning(null);
      return;
    }
    setBusy(true);
    try {
      await updateBooking(assigning.id!, { driverId: driver.uid, driverName: driver.displayName, status: 'assigned' });
      toast.success(`${driver.displayName} assigned to trip #${(assigning.id || '').slice(-6)}.`);
      setAssigning(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not assign driver.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-12">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 border-b border-gray-50">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="font-display font-bold text-lg text-gray-900">Dispatch Center</h1>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 pt-8">
        <p className="text-sm text-gray-500 font-medium mb-6">
          Bookings normally get picked up by online drivers automatically. Use this to manually assign a driver to any booking that's been waiting.
        </p>

        {pending.length === 0 && (
          <div className="bg-white p-12 rounded-[2.5rem] border border-gray-50 text-center text-gray-400 font-medium">
            No unmatched bookings right now — everything's flowing smoothly.
          </div>
        )}

        <div className="space-y-4">
          {pending.map((b) => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#ff8c00] flex items-center justify-center">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-gray-900">#{(b.id || '').slice(-6)} · {b.userName}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                    <MapPin className="w-3 h-3" />
                    {b.pickupLocation} → {b.destination}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-display font-black text-lg text-[#ff8c00]">₦{b.price.toLocaleString()}</span>
                <button onClick={() => setAssigning(b)} className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-display font-bold text-sm hover:bg-gray-800 transition-all">
                  Assign Driver
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <AnimatePresence>
        {assigning && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !busy && setAssigning(null)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] p-8 w-full max-w-md relative z-10 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="font-display font-black text-xl text-gray-900">Assign a driver</h2>
                <button onClick={() => setAssigning(null)} className="p-1 text-gray-400"><X className="w-5 h-5" /></button>
              </div>
              {drivers.length === 0 && <p className="text-center text-gray-400 py-10 font-medium">No online, verified drivers right now.</p>}
              <div className="space-y-3">
                {drivers.map((d) => (
                  <button key={d.uid} onClick={() => handleAssign(d)} disabled={busy} className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-orange-50 transition-all disabled:opacity-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 font-display font-bold">{d.displayName[0]}</div>
                      <div className="text-left">
                        <p className="font-display font-bold text-sm text-gray-900">{d.displayName}</p>
                        <p className="text-xs text-gray-400">{d.vehicleModel || d.vehicleType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-orange-400">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-xs font-bold text-gray-900">{(isDemoMode ? d.rating : ratings[d.uid] ?? 4.9).toFixed(1)}</span>
                    </div>
                  </button>
                ))}
              </div>
              {busy && <div className="flex justify-center mt-4"><Loader2 className="w-5 h-5 animate-spin text-[#ff8c00]" /></div>}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

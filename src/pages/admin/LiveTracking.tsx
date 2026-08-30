import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Navigation, Truck, Search, ChevronRight, MapPin, User } from 'lucide-react';
import LiveMap from '../../components/LiveMap';
import MovementBadge from '../../components/MovementBadge';
import { watchAllDriverLocations, watchAllCustomerLocations, listAllBookingsPage, type Booking, type DriverLocation } from '../../lib/firestore';
import { useMovementStatus } from '../../hooks/useMovementStatus';
import { isDemoMode } from '../../firebase';

const DEMO_ACTIVE: Booking[] = [
  { id: 'MV-9021', userId: 'u1', userName: 'Oluwaseun A.', driverName: 'John Driver', truckId: '2', truckName: 'Medium', pickupLocation: 'Ikeja City Mall, Lagos', pickupCoords: { lat: 6.6, lng: 3.35 }, destination: 'Lekki Phase 1, Lagos', destinationCoords: { lat: 6.45, lng: 3.47 }, distanceKm: 18, price: 12500, paymentStatus: 'paid', status: 'in-transit' },
  { id: 'MV-9022', userId: 'u2', userName: 'Chidi E.', driverName: 'Blessing O.', truckId: '3', truckName: 'Large', pickupLocation: 'Apapa Port, Lagos', pickupCoords: { lat: 6.44, lng: 3.36 }, destination: 'Surulere, Lagos', destinationCoords: { lat: 6.5, lng: 3.35 }, distanceKm: 12, price: 25000, paymentStatus: 'paid', status: 'assigned' },
];
const DEMO_LOCATIONS: Record<string, DriverLocation> = {
  'MV-9021': { lat: 6.52, lng: 3.41, speedKmh: 32 },
  'MV-9022': { lat: 6.46, lng: 3.36, speedKmh: 0 },
};
const DEMO_CUSTOMER_LOCATIONS: Record<string, DriverLocation> = {
  'MV-9021': { lat: 6.6, lng: 3.35, speedKmh: 0 },
  'MV-9022': { lat: 6.44, lng: 3.36, speedKmh: 0 },
};

// Pulled out as its own component (not inlined in the .map() below) purely
// so useMovementStatus -- a hook -- can be called once per fleet row without
// breaking the rules of hooks.
function FleetRowBadge({ loc }: { loc: DriverLocation | null }) {
  const { status, speedKmh } = useMovementStatus(loc);
  return <MovementBadge status={status} speedKmh={speedKmh} className="scale-90 origin-left" />;
}

export default function AdminLiveTracking() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Booking | null>(null);
  const [activeBookings, setActiveBookings] = useState<Booking[]>(isDemoMode ? DEMO_ACTIVE : []);
  const [locations, setLocations] = useState<Record<string, DriverLocation>>(isDemoMode ? DEMO_LOCATIONS : {});
  const [customerLocations, setCustomerLocations] = useState<Record<string, DriverLocation>>(isDemoMode ? DEMO_CUSTOMER_LOCATIONS : {});

  useEffect(() => {
    if (isDemoMode) return;
    // Active fleet = anything assigned or in-transit right now.
    listAllBookingsPage(50).then((res) => {
      setActiveBookings(res.items.filter((b) => b.status === 'assigned' || b.status === 'in-transit'));
    });
    const unsubLocations = watchAllDriverLocations(setLocations);
    const unsubCustomerLocations = watchAllCustomerLocations(setCustomerLocations);
    return () => { unsubLocations(); unsubCustomerLocations(); };
  }, []);

  const fleetMarkers = activeBookings
    .map((b) => {
      const loc = b.id ? locations[b.id] : null;
      return loc ? { id: b.id!, lat: loc.lat, lng: loc.lng, label: `${b.driverName} — ${b.truckName}` } : null;
    })
    .filter(Boolean) as { id: string; lat: number; lng: number; label: string }[];

  const customerMarkers = activeBookings
    .map((b) => {
      const loc = b.id ? customerLocations[b.id] : null;
      return loc ? { id: b.id!, lat: loc.lat, lng: loc.lng, label: `${b.userName} (customer)` } : null;
    })
    .filter(Boolean) as { id: string; lat: number; lng: number; label: string }[];

  const selectedDriverMovement = useMovementStatus(selected?.id ? locations[selected.id] || null : null);
  const selectedCustomerMovement = useMovementStatus(selected?.id ? customerLocations[selected.id] || null : null);

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex flex-col h-screen overflow-hidden">
      <header className="bg-white/80 backdrop-blur-xl px-6 py-4 border-b border-gray-50 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="font-display font-bold text-lg text-gray-900">Live Fleet Tracking</h1>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 bg-white border-r border-gray-100 flex flex-col shrink-0">
          <div className="p-6 border-b border-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display font-black text-xl text-gray-900">Active Fleet</h2>
              <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-widest">{activeBookings.length} Active</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeBookings.length === 0 && (
              <p className="text-center text-gray-400 text-sm font-medium py-10">No trips in progress right now.</p>
            )}
            {activeBookings.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelected(b)}
                className={`w-full p-4 rounded-3xl border transition-all text-left group ${selected?.id === b.id ? 'bg-orange-50 border-orange-100 shadow-sm' : 'bg-white border-gray-50 hover:border-gray-200'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${b.status === 'in-transit' ? 'bg-blue-50 text-blue-500' : 'bg-gray-50 text-gray-400'}`}>
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-gray-900 text-sm">#{(b.id || '').slice(-6)}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{b.driverName || 'Unassigned'}</p>
                    </div>
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${b.status === 'in-transit' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                    {b.status.replace('-', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500 mb-2">
                  <Navigation className="w-3 h-3" />
                  <span className="truncate">{b.destination}</span>
                </div>
                <FleetRowBadge loc={(b.id && locations[b.id]) || null} />
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 relative bg-[#f0f2f5]">
          <LiveMap
            pickup={selected?.pickupCoords}
            destination={selected?.destinationCoords}
            driverPosition={selected?.id ? locations[selected.id] : null}
            customerPosition={selected?.id ? customerLocations[selected.id] : null}
            fleetMarkers={!selected ? fleetMarkers : undefined}
            customerMarkers={!selected ? customerMarkers : undefined}
            height="100%"
          />

          <div className="absolute top-6 left-6 z-10 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 px-4 py-3 flex gap-4 text-xs font-semibold text-gray-600">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ff8c00]" />Driver</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" />Customer</span>
          </div>

          <AnimatePresence>
            {selected && (
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="absolute top-6 right-6 bottom-6 w-96 bg-white rounded-[2.5rem] shadow-2xl border border-gray-50 p-8 flex flex-col overflow-y-auto">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#ff8c00] flex items-center justify-center shadow-sm">
                      <Truck className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-display font-black text-2xl text-gray-900">#{(selected.id || '').slice(-6)}</h3>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selected.driverName}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="p-2 rounded-xl bg-gray-50 text-gray-400">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6 flex-1">
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Live Status</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-gray-50 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2 text-gray-400">
                          <Truck className="w-3.5 h-3.5" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">Driver</p>
                        </div>
                        <MovementBadge status={selectedDriverMovement.status} speedKmh={selectedDriverMovement.speedKmh} />
                      </div>
                      <div className="p-4 bg-gray-50 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2 text-gray-400">
                          <User className="w-3.5 h-3.5" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">Customer</p>
                        </div>
                        <MovementBadge status={selectedCustomerMovement.status} speedKmh={selectedCustomerMovement.speedKmh} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Trip Details</h4>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pickup</p>
                          <p className="text-sm font-bold text-gray-900">{selected.pickupLocation}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-[#ff8c00] mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Destination</p>
                          <p className="text-sm font-bold text-gray-900">{selected.destination}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-2xl">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Customer</p>
                      <p className="font-display font-bold text-gray-900 text-sm">{selected.userName}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Fare</p>
                      <p className="font-display font-bold text-gray-900 text-sm">₦{selected.price.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

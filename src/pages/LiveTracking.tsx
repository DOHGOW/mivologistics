import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Clock,
  MapPin,
  ShieldCheck,
  ChevronRight,
  Radar,
  CheckCircle2,
  Star,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import LiveMap from '../components/LiveMap';
import MovementBadge from '../components/MovementBadge';
import { watchBooking, watchDriverLocation, hasReviewedBooking, type Booking, type DriverLocation } from '../lib/firestore';
import { useCustomerLocationBroadcast } from '../hooks/useCustomerLocationBroadcast';
import { useMovementStatus } from '../hooks/useMovementStatus';
import { isDemoMode } from '../firebase';

const AVG_SPEED_KMH = 35;

export default function LiveTracking() {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingId = (location.state as { bookingId?: string } | null)?.bookingId;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [driverLoc, setDriverLoc] = useState<DriverLocation | null>(null);
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);

  useEffect(() => {
    if (!bookingId || isDemoMode) return;
    const unsub = watchBooking(bookingId, setBooking);
    return () => unsub();
  }, [bookingId]);

  // Proactively surface the rating prompt the moment this trip shows as
  // delivered, instead of leaving it to the customer to dig it up later via
  // History -> Shipment Status.
  useEffect(() => {
    if (!bookingId || isDemoMode || promptDismissed || booking?.status !== 'delivered') return;
    hasReviewedBooking(bookingId).then((already) => {
      if (!already) setShowRatingPrompt(true);
    });
  }, [bookingId, booking?.status, promptDismissed]);

  useEffect(() => {
    if (!bookingId || isDemoMode) return;
    const unsub = watchDriverLocation(bookingId, setDriverLoc);
    return () => unsub();
  }, [bookingId]);

  // Share the customer's own position back while the trip is active, so the
  // driver can find them at the pickup point and admin can see both parties
  // on one map -- mirrors the driver's own broadcast in ActiveTrip.tsx.
  const sharingLocation = !isDemoMode && !!bookingId && !!booking && booking.status !== 'delivered' && booking.status !== 'cancelled';
  useCustomerLocationBroadcast(bookingId, sharingLocation);

  const demoBooking: Booking | null = isDemoMode
    ? {
        userId: 'demo', userName: 'You', truckId: '1', truckName: 'Medium Truck',
        pickupLocation: 'Ikeja, Lagos', pickupCoords: { lat: 6.6018, lng: 3.3515 },
        destination: 'Apapa Port, Lagos', destinationCoords: { lat: 6.4432, lng: 3.3592 },
        distanceKm: 22, price: 18500, paymentStatus: 'paid', status: 'in-transit',
        driverId: 'demo-driver', driverName: 'Marcus Rodriguez',
      }
    : null;

  const activeBooking = booking || demoBooking;
  const activeDriverLoc: DriverLocation | null = isDemoMode && demoBooking
    ? { lat: 6.52, lng: 3.355, speedKmh: 28 }
    : driverLoc;

  const driverMovement = useMovementStatus(activeDriverLoc);

  const remainingKm = useMemo(() => {
    if (!activeBooking?.destinationCoords || !activeDriverLoc) return activeBooking?.distanceKm ?? 0;
    const R = 6371;
    const dLat = ((activeBooking.destinationCoords.lat - activeDriverLoc.lat) * Math.PI) / 180;
    const dLng = ((activeBooking.destinationCoords.lng - activeDriverLoc.lng) * Math.PI) / 180;
    const lat1 = (activeDriverLoc.lat * Math.PI) / 180;
    const lat2 = (activeBooking.destinationCoords.lat * Math.PI) / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }, [activeBooking, activeDriverLoc]);

  const etaLabel = useMemo(() => {
    const hours = remainingKm / AVG_SPEED_KMH;
    const arrival = new Date(Date.now() + hours * 3600 * 1000);
    return arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [remainingKm]);

  const hasDriver = !!activeBooking?.driverId;

  return (
    <div className="relative h-screen bg-[#fcf9f8] overflow-hidden">
      <div className="absolute inset-0 z-0">
        <LiveMap
          pickup={activeBooking?.pickupCoords}
          destination={activeBooking?.destinationCoords}
          driverPosition={hasDriver ? activeDriverLoc : null}
          height="100%"
        />
      </div>

      <header className="relative z-50 flex justify-between items-center px-6 h-16 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="font-display font-bold text-lg text-gray-900">Live Tracking</h1>
        </div>
      </header>

      <div className="absolute top-20 left-6 right-6 z-40">
        <AnimatePresence mode="wait">
          {!hasDriver ? (
            <motion.div
              key="searching"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white/95 backdrop-blur-xl p-5 rounded-[2rem] shadow-2xl border border-white/20 flex items-center gap-4"
            >
              <div className="relative w-12 h-12 shrink-0">
                <motion.div
                  className="absolute inset-0 rounded-full bg-orange-200"
                  animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                />
                <div className="relative w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-[#ff8c00]">
                  <Radar className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="font-display font-bold text-gray-900">Finding your driver…</h3>
                <p className="text-xs text-gray-400 font-medium">Matching you with a nearby {activeBooking?.truckName?.toLowerCase() || 'truck'}</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="driver"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white/90 backdrop-blur-xl p-5 rounded-[2rem] shadow-2xl border border-white/20 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-orange-100 bg-gray-100 flex items-center justify-center text-gray-400 font-display font-bold text-lg">
                    {activeBooking?.driverName?.[0] || 'D'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-gray-900">{activeBooking?.driverName}</h3>
                  <p className="text-xs font-bold text-[#ff8c00] uppercase tracking-wider mb-1">{activeBooking?.truckName}</p>
                  <MovementBadge status={driverMovement.status} speedKmh={driverMovement.speedKmh} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate('/call', { state: { name: activeBooking?.driverName, phone: activeBooking?.driverPhone, bookingId } })} className="w-12 h-12 bg-orange-50 text-[#ff8c00] rounded-2xl flex items-center justify-center hover:bg-orange-100 transition-colors">
                  <Phone className="w-5 h-5" />
                </button>
                <button onClick={() => navigate('/chat', { state: { bookingId } })} className="w-12 h-12 bg-orange-50 text-[#ff8c00] rounded-2xl flex items-center justify-center hover:bg-orange-100 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <main className="absolute bottom-0 left-0 w-full z-40">
        <div className="w-full max-w-2xl mx-auto bg-white rounded-t-[3rem] shadow-2xl p-8 pb-12 border-t border-gray-50">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Estimated Arrival</p>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-black text-4xl text-gray-900 tracking-tighter">{hasDriver ? etaLabel : '—'}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-green-600 font-bold text-sm mb-1">
                <Clock className="w-4 h-4" />
                <span>
                  {activeBooking?.status === 'delivered' ? 'Delivered' :
                   activeBooking?.status === 'in-transit' ? 'In Transit' :
                   activeBooking?.status === 'assigned' ? 'Driver Assigned' : 'Awaiting Pickup'}
                </span>
              </div>
              <p className="text-gray-400 text-xs font-medium">Distance: {remainingKm.toFixed(1)} km left</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <div className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-gray-100" />

              <div className="flex gap-4 relative">
                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center z-10">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff8c00]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pickup Point</p>
                  <p className="font-display font-bold text-gray-900">{activeBooking?.pickupLocation}</p>
                </div>
              </div>

              <div className="mt-8 flex gap-4 relative">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center z-10">
                  <MapPin className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Destination</p>
                  <p className="font-display font-bold text-gray-900">{activeBooking?.destination}</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Cargo Insurance Active</p>
                  <p className="text-[10px] text-gray-400 font-medium">Policy #MIVO-{(bookingId || '00000').slice(-5).toUpperCase()}</p>
                </div>
              </div>
              <button onClick={() => navigate('/shipment-status', { state: { bookingId } })} className="text-[#ff8c00] font-bold text-sm flex items-center gap-1 hover:underline">
                Details
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {sharingLocation && (
              <div className="pt-4 flex items-center gap-2 text-gray-400">
                <Radar className="w-3.5 h-3.5" />
                <p className="text-[10px] font-medium">Your location is shared with your driver and Mivo support for this trip only.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showRatingPrompt && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-white rounded-[3rem] p-10 w-full max-w-sm relative z-10 text-center">
              <div className="w-24 h-24 bg-green-50 rounded-[2.5rem] flex items-center justify-center text-green-500 mx-auto mb-8">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="font-display font-black text-3xl text-gray-900 mb-2">Delivered!</h2>
              <p className="text-gray-500 font-medium mb-8">
                Your cargo made it to {activeBooking?.destination}. How was {activeBooking?.driverName || 'your driver'}?
              </p>
              <button
                onClick={() => navigate('/reviews', { state: { bookingId } })}
                className="w-full bg-gradient-to-r from-[#904d00] to-[#ff8c00] text-white py-5 rounded-2xl font-display font-bold text-sm shadow-xl shadow-orange-200 active:scale-95 transition-all flex items-center justify-center gap-2 mb-3"
              >
                <Star className="w-4 h-4" />
                Rate This Trip
              </button>
              <button
                onClick={() => { setShowRatingPrompt(false); setPromptDismissed(true); }}
                className="w-full text-gray-400 font-bold text-sm py-2"
              >
                Maybe Later
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

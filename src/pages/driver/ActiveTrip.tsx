import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Phone,
  MessageCircle,
  User,
  Clock,
  Shield,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import LiveMap from '../../components/LiveMap';
import { useAuth } from '../../contexts/AuthContext';
import { useLiveLocationBroadcast } from '../../hooks/useLiveLocationBroadcast';
import { getBooking, updateBooking, updateDriverProfile, getDriverProfile, type Booking } from '../../lib/firestore';
import { isDemoMode } from '../../firebase';

type LocalStep = 'accepted' | 'arrived_pickup' | 'picked_up' | 'arrived_destination' | 'completed';

const DEMO_TRIP: Booking = {
  userId: 'u1', userName: 'Oluwaseun A.', truckId: '2', truckName: 'Medium',
  pickupLocation: 'Ikeja City Mall, Lagos', pickupCoords: { lat: 6.6018, lng: 3.3515 },
  destination: 'Lekki Phase 1, Lagos', destinationCoords: { lat: 6.4474, lng: 3.4726 },
  distanceKm: 18.5, price: 12500, paymentStatus: 'paid', status: 'assigned',
};

export default function ActiveTrip() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trip, setTrip] = useState<Booking | null>(isDemoMode ? DEMO_TRIP : null);
  const [step, setStep] = useState<LocalStep>('accepted');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const broadcasting = step === 'picked_up' || step === 'arrived_destination';
  useLiveLocationBroadcast(id, broadcasting && !isDemoMode);

  useEffect(() => {
    if (!id || isDemoMode) return;
    getBooking(id).then((b) => {
      if (b) {
        setTrip(b);
        if (b.status === 'in-transit') setStep('picked_up');
        if (b.status === 'delivered') setStep('completed');
      }
    });
  }, [id]);

  const handleNextStep = async () => {
    if (step === 'accepted') { setStep('arrived_pickup'); return; }
    if (step === 'arrived_pickup') {
      setStep('picked_up');
      if (!isDemoMode && id) {
        setSaving(true);
        try {
          await updateBooking(id, { status: 'in-transit' });
        } catch {
          toast.error('Could not update trip status.');
        } finally {
          setSaving(false);
        }
      }
      return;
    }
    if (step === 'picked_up') { setStep('arrived_destination'); return; }
    if (step === 'arrived_destination') {
      setStep('completed');
      if (!isDemoMode && id && user && trip) {
        setSaving(true);
        try {
          await updateBooking(id, { status: 'delivered' });
          const dp = await getDriverProfile(user.uid);
          await updateDriverProfile(user.uid, {
            totalTrips: (dp?.totalTrips || 0) + 1,
            totalEarnings: (dp?.totalEarnings || 0) + trip.price,
          });
        } catch {
          toast.error('Trip marked delivered, but stats update failed.');
        } finally {
          setSaving(false);
        }
      }
      setShowCompleteModal(true);
    }
  };

  const getButtonText = () => {
    switch (step) {
      case 'accepted': return 'Arrived at Pickup';
      case 'arrived_pickup': return 'Confirm Pickup';
      case 'picked_up': return 'Arrived at Destination';
      case 'arrived_destination': return 'Confirm Delivery';
      case 'completed': return 'Back to Dashboard';
    }
  };

  const statusSteps = [
    { key: 'accepted', label: 'Accepted', icon: <CheckCircle2 className="w-4 h-4" /> },
    { key: 'picked_up', label: 'Picked Up', icon: <Truck className="w-4 h-4" /> },
    { key: 'completed', label: 'Delivered', icon: <MapPin className="w-4 h-4" /> },
  ];

  if (!trip) {
    return <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center text-gray-400">Loading trip…</div>;
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-32">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <div>
              <h1 className="font-display font-bold text-lg text-gray-900">Active Trip</h1>
              <p className="text-[10px] font-bold text-[#ff8c00] uppercase tracking-widest">Job #{(id || '').slice(-6) || 'DEMO'}</p>
            </div>
          </div>
          <button onClick={() => navigate('/support')} className="p-2 rounded-full bg-red-50 text-red-500">
            <AlertCircle className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="relative h-[40vh] bg-gray-100 overflow-hidden">
        <LiveMap
          pickup={trip.pickupCoords}
          destination={trip.destinationCoords}
          driverPosition={step === 'accepted' || step === 'arrived_pickup' ? trip.pickupCoords : null}
          height="100%"
        />
      </div>

      <main className="px-6 -mt-12 relative z-10">
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-100 p-8 border border-gray-50">
          <div className="flex justify-between mb-10 relative">
            <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-100 -z-10" />
            <div
              className="absolute top-4 left-0 h-0.5 bg-[#ff8c00] transition-all duration-500 -z-10"
              style={{ width: step === 'completed' ? '100%' : (step === 'picked_up' || step === 'arrived_destination') ? '50%' : '0%' }}
            />
            {statusSteps.map((s, i) => {
              const isDone = (s.key === 'accepted' && step !== 'accepted' && step !== 'arrived_pickup') || (s.key === 'picked_up' && (step === 'arrived_destination' || step === 'completed'));
              const isActive = step === s.key || (s.key === 'accepted' && (step === 'accepted' || step === 'arrived_pickup')) || (s.key === 'picked_up' && step === 'arrived_destination');
              return (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                    isDone ? 'bg-[#ff8c00] border-[#ff8c00] text-white' : isActive ? 'bg-white border-[#ff8c00] text-[#ff8c00]' : 'bg-white border-gray-100 text-gray-300'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.icon}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive || isDone ? 'text-gray-900' : 'text-gray-300'}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
                <User className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-gray-900">{trip.userName}</h3>
                <p className="text-xs font-medium text-gray-400">{trip.truckName} · ₦{trip.price.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate('/call', { state: { name: trip.userName, phone: trip.userPhone, bookingId: id } })} className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center active:scale-90 transition-all">
                <Phone className="w-5 h-5" />
              </button>
              <button onClick={() => navigate('/chat', { state: { bookingId: id } })} className="w-12 h-12 rounded-2xl bg-orange-50 text-[#ff8c00] flex items-center justify-center active:scale-90 transition-all">
                <MessageCircle className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-4 mb-8">
            <div className="flex flex-col items-center gap-1">
              <div className="w-3 h-3 rounded-full border-2 border-blue-400" />
              <div className="w-0.5 h-10 bg-gray-100" />
              <MapPin className="w-4 h-4 text-[#ff8c00]" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Pickup Location</p>
                <p className="text-sm font-bold text-gray-900">{trip.pickupLocation}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Destination</p>
                <p className="text-sm font-bold text-gray-900">{trip.destination}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-5 bg-gray-50 rounded-3xl border border-gray-100">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Distance</p>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-bold text-gray-900">{trip.distanceKm} km</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Payment</p>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-bold text-gray-900 capitalize">{trip.paymentStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-2xl z-50 pb-8 pt-4 px-6 shadow-2xl rounded-t-[2.5rem] border-t border-gray-50">
        <div className="max-w-screen-md mx-auto">
          <button
            onClick={step === 'completed' ? () => navigate('/driver/dashboard') : handleNextStep}
            disabled={saving}
            className="w-full bg-gradient-to-r from-[#904d00] to-[#ff8c00] text-white py-5 rounded-2xl font-display font-extrabold text-lg shadow-xl shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {getButtonText()}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </footer>

      <AnimatePresence>
        {showCompleteModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-white rounded-[3rem] p-10 w-full max-w-sm relative z-10 text-center">
              <div className="w-24 h-24 bg-green-50 rounded-[2.5rem] flex items-center justify-center text-green-500 mx-auto mb-8">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="font-display font-black text-3xl text-gray-900 mb-2">Trip Completed!</h2>
              <p className="text-gray-500 font-medium mb-8">You've successfully delivered the cargo to {trip.destination}.</p>

              <div className="bg-gray-50 p-6 rounded-3xl mb-8">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Earnings Added</p>
                <p className="font-display font-black text-3xl text-[#ff8c00] tracking-tighter">₦{trip.price.toLocaleString()}</p>
              </div>

              <button onClick={() => navigate('/driver/dashboard')} className="w-full bg-gray-900 text-white py-5 rounded-2xl font-display font-bold text-sm active:scale-95 transition-all">
                Go to Dashboard
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

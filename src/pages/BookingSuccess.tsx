import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, Truck, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getBooking, type Booking } from '../lib/firestore';
import { isDemoMode } from '../firebase';

export default function BookingSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as { bookingId?: string; booking?: Partial<Booking>; demo?: boolean };
  const [booking, setBooking] = useState<Partial<Booking> | undefined>(state.booking);

  useEffect(() => {
    if (state.bookingId && !isDemoMode) {
      getBooking(state.bookingId).then((b) => b && setBooking(b));
    }
  }, [state.bookingId]);

  const goToTracking = () => {
    navigate('/tracking', { state: { bookingId: state.bookingId } });
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex flex-col items-center justify-center px-6 py-12">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl shadow-orange-100 flex flex-col items-center text-center relative overflow-hidden"
      >
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#904d00] to-[#ff8c00]" />
        
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-8">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
        </div>

        <h1 className="font-display font-black text-4xl text-gray-900 tracking-tighter mb-4">Booking Successful!</h1>
        <p className="text-gray-500 font-medium text-lg leading-relaxed mb-10">
          Your truck is scheduled and the driver is being notified. Get ready for a seamless delivery.
        </p>

        <div className="w-full space-y-4 mb-10">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#ff8c00] shadow-sm">
              <Truck className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Truck Type</p>
              <p className="font-display font-bold text-gray-900">{booking?.truckName || 'Flatbed Heavy Duty'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#ff8c00] shadow-sm">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scheduled Date</p>
              <p className="font-display font-bold text-gray-900">Today • ASAP</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#ff8c00] shadow-sm">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Destination</p>
              <p className="font-display font-bold text-gray-900 truncate max-w-[180px]">{booking?.destination || 'Lagos Port Complex, Apapa'}</p>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col gap-4">
          <button 
            onClick={goToTracking}
            className="w-full bg-[#ff8c00] text-white py-5 rounded-2xl font-display font-extrabold text-lg shadow-xl shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            Track My Truck
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <button 
          onClick={() => navigate('/home')}
          className="mt-8 text-gray-400 font-bold text-sm hover:text-[#ff8c00] transition-colors"
        >
          Back to Home
        </button>
      </motion.div>
    </div>
  );
}

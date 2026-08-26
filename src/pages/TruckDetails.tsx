import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  Weight,
  Truck,
  Maximize,
  Calendar,
  ShieldCheck,
  Route,
  Sparkles,
} from 'lucide-react';
import { useBooking } from '../contexts/BookingContext';

const SPECS: Record<string, { weight: string; size: string }> = {
  Small: { weight: 'Up to 500 kg', size: '4.2 x 1.8 m' },
  Medium: { weight: 'Up to 2,000 kg', size: '6.5 x 2.1 m' },
  Large: { weight: 'Up to 10,000 kg', size: '9.8 x 2.4 m' },
  'XL Cargo': { weight: 'Bulk cargo', size: '12.5 x 2.4 m' },
};

export default function TruckDetails() {
  const navigate = useNavigate();
  const { booking } = useBooking();
  const spec = SPECS[booking.truckName || 'Medium'] || SPECS.Medium;

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-40">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 flex justify-between items-center w-full px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="font-display font-bold text-lg text-gray-900">Truck Details</h1>
        </div>
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <Share2 className="w-5 h-5 text-gray-900" />
        </button>
      </header>

      <main className="max-w-screen-md mx-auto px-4">
        <section className="mt-4">
          <div className="relative overflow-hidden rounded-3xl aspect-[16/10] shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1200"
              alt="Truck"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 bg-[#ff8c00] text-white px-3 py-1 rounded-full font-display font-bold text-sm shadow-lg">
              {booking.truckName || 'Truck'}
            </div>
          </div>
        </section>

        {(booking.pickupLocation || booking.destination) && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex items-center gap-3"
          >
            <Route className="w-5 h-5 text-[#ff8c00] shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{booking.pickupLocation} → {booking.destination}</p>
              {booking.distanceKm != null && <p className="text-xs text-gray-400">{booking.distanceKm} km trip</p>}
            </div>
          </motion.section>
        )}

        <section className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-extrabold text-2xl tracking-tight text-gray-900">Cargo Specifications</h2>
            <div className="flex items-center gap-1 text-blue-600">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Certified Shipper</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-4 flex flex-col gap-1 shadow-sm border border-gray-50">
              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Loading Capacity</span>
              <div className="flex items-center gap-2 mt-1">
                <Weight className="w-5 h-5 text-[#ff8c00]" />
                <span className="font-display font-bold text-lg">{spec.weight}</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 flex flex-col gap-1 shadow-sm border border-gray-50">
              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Truck Type</span>
              <div className="flex items-center gap-2 mt-1">
                <Truck className="w-5 h-5 text-[#ff8c00]" />
                <span className="font-display font-bold text-lg">{booking.truckName || 'Flatbed Heavy'}</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 flex flex-col gap-1 shadow-sm border border-gray-50">
              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Truck Size</span>
              <div className="flex items-center gap-2 mt-1">
                <Maximize className="w-5 h-5 text-[#ff8c00]" />
                <span className="font-display font-bold text-lg">{spec.size}</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 flex flex-col gap-1 shadow-sm border border-[#ff8c00]/10">
              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Estimated Price</span>
              <div className="flex items-center gap-1 mt-1">
                <span className="font-display font-extrabold text-2xl text-[#ff8c00]">₦{booking.price?.toLocaleString() || '0'}</span>
                <span className="text-gray-400 text-sm font-medium">/trip</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="bg-gradient-to-br from-orange-50 to-white rounded-3xl p-6 border border-orange-100 flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-[#ff8c00] flex items-center justify-center text-white shrink-0 shadow-lg shadow-orange-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-gray-900 mb-1">Driver matched after booking</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Once you confirm and pay, we'll match you with the nearest verified {booking.truckName?.toLowerCase() || 'available'} driver.
                You'll see their name, rating, plate number and live location right away — and can call or chat with them directly.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 px-2">
          <h3 className="font-display font-bold text-lg mb-2">Service Description</h3>
          <p className="text-gray-500 leading-relaxed">
            Reliable transport with real-time GPS tracking. All Mivo drivers are document-verified before going live, and every trip includes in-app chat and support.
          </p>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-2xl z-50 pb-8 pt-4 px-6 shadow-2xl rounded-t-[2.5rem] border-t border-gray-50">
        <div className="max-w-screen-md mx-auto">
          <button
            onClick={() => navigate('/payment')}
            className="w-full bg-gradient-to-r from-[#904d00] to-[#ff8c00] text-white py-5 rounded-2xl font-display font-extrabold text-lg shadow-xl shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <Calendar className="w-5 h-5" />
            Book Now
          </button>
        </div>
      </footer>
    </div>
  );
}

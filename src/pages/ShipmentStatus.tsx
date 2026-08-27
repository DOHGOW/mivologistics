import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, FileText, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getBooking, type Booking, type BookingStatus } from '../lib/firestore';
import { isDemoMode } from '../firebase';

const STEPS: { key: BookingStatus; label: string; note: string }[] = [
  { key: 'pending', label: 'Order Placed', note: 'Payment confirmed, matching a driver.' },
  { key: 'assigned', label: 'Truck Assigned', note: 'Your driver is heading to the pickup point.' },
  { key: 'in-transit', label: 'In Transit', note: 'Your cargo is on the move.' },
  { key: 'delivered', label: 'Delivered', note: 'Cargo delivered successfully.' },
];

const STATUS_ORDER: BookingStatus[] = ['pending', 'assigned', 'in-transit', 'delivered'];

export default function ShipmentStatus() {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingId = (location.state as { bookingId?: string } | null)?.bookingId;
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!bookingId || isDemoMode) return;
    getBooking(bookingId).then(setBooking);
  }, [bookingId]);

  const currentIndex = booking ? STATUS_ORDER.indexOf(booking.status) : isDemoMode ? 2 : 0;
  const trackingNumber = `MIVO-${(bookingId || 'DEMO0000').slice(-8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-12">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 flex justify-between items-center w-full px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="font-display font-bold text-lg text-gray-900">Shipment Status</h1>
        </div>
        <button onClick={() => navigate('/support')} className="text-[#ff8c00] font-bold text-sm">Help</button>
      </header>

      <main className="max-w-screen-md mx-auto px-6 pt-8">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50 mb-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Tracking Number</p>
              <h2 className="font-display font-black text-2xl text-gray-900 tracking-tighter">#{trackingNumber}</h2>
            </div>
            <div className="bg-orange-50 text-[#ff8c00] px-4 py-2 rounded-2xl font-display font-bold text-sm capitalize">
              {(booking?.status || (isDemoMode ? 'in-transit' : 'pending')).replace('-', ' ')}
            </div>
          </div>

          <div className="space-y-8">
            {STEPS.map((step, i) => {
              const completed = i < currentIndex;
              const current = i === currentIndex;
              return (
                <div key={step.key} className="flex gap-6 relative">
                  {i !== STEPS.length - 1 && (
                    <div className={`absolute left-[15px] top-8 bottom-[-2rem] w-0.5 ${completed ? 'bg-[#ff8c00]' : 'bg-gray-100'}`} />
                  )}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                    completed ? 'bg-[#ff8c00] text-white' :
                    current ? 'bg-orange-100 text-[#ff8c00] ring-4 ring-orange-50' :
                    'bg-gray-100 text-gray-300'
                  }`}>
                    {completed ? <CheckCircle2 className="w-5 h-5" /> :
                     current ? <Clock className="w-5 h-5" /> :
                     <div className="w-2 h-2 rounded-full bg-current" />}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-display font-bold text-lg ${current ? 'text-[#ff8c00]' : 'text-gray-900'}`}>
                      {step.label}
                    </h3>
                    {current && <p className="text-sm text-gray-500 mt-1">{step.note}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {booking?.status === 'delivered' && booking?.driverId && (
            <button
              onClick={() => navigate('/reviews', { state: { bookingId } })}
              className="bg-[#ff8c00] p-6 rounded-3xl shadow-sm flex items-center gap-4 text-left active:scale-[0.98] transition-all"
            >
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                <Star className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-display font-bold text-white">Rate This Trip</h4>
                <p className="text-xs text-white/80">Tell us how {booking.driverName || 'your driver'} did</p>
              </div>
            </button>
          )}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-display font-bold text-gray-900">Shipping Documents</h4>
              <p className="text-xs text-gray-400">Waybill, Invoice, Insurance</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

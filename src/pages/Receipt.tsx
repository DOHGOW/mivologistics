import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Printer, Share2, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getBooking, type Booking } from '../lib/firestore';
import { isDemoMode } from '../firebase';

const PAYMENT_LABELS: Record<string, string> = {
  paystack: 'Paystack',
  flutterwave: 'Flutterwave',
  wallet: 'Mivo Wallet',
};

export default function Receipt() {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingId = (location.state as { bookingId?: string } | null)?.bookingId;
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!bookingId || isDemoMode) return;
    getBooking(bookingId).then(setBooking);
  }, [bookingId]);

  const trackingNumber = `MIVO-${(bookingId || 'DEMO0000').slice(-8).toUpperCase()}`;
  const issuedOn = booking?.createdAt ? booking.createdAt.toDate() : new Date();
  const paymentLabel = booking?.paymentMethod ? PAYMENT_LABELS[booking.paymentMethod] : 'Cash on Delivery';

  const handleShare = async () => {
    const text = `Mivo receipt ${trackingNumber} — ${booking?.pickupLocation} to ${booking?.destination}, ₦${(booking?.price || 0).toLocaleString()}, ${booking?.paymentStatus}.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Mivo Receipt ${trackingNumber}`, text });
      } catch {
        // user cancelled the share sheet -- nothing to do
      }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-12">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 flex justify-between items-center w-full px-6 py-4 border-b border-gray-50 print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="font-display font-bold text-lg text-gray-900">Receipt</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleShare} className="p-2.5 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors" title="Share receipt">
            <Share2 className="w-4 h-4" />
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors">
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </button>
        </div>
      </header>

      <main className="max-w-screen-sm mx-auto px-6 pt-8 print:pt-0 print:px-0">
        <div className="bg-white rounded-[2.5rem] print:rounded-none print:shadow-none shadow-sm border border-gray-50 print:border-none p-8">
          <div className="flex items-center justify-between mb-8 pb-8 border-b border-dashed border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#ff8c00] rounded-xl flex items-center justify-center text-white">
                <Truck className="w-5 h-5" />
              </div>
              <span className="font-display font-black text-xl tracking-tighter text-gray-900">Mivo</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Receipt</p>
              <p className="font-display font-bold text-gray-900">#{trackingNumber}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Billed To</p>
              <p className="font-semibold text-gray-900">{booking?.userName || '—'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Date Issued</p>
              <p className="font-semibold text-gray-900">{issuedOn.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400 font-medium">Pickup Location</span>
              <span className="text-gray-900 font-semibold text-right max-w-[60%]">{booking?.pickupLocation || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400 font-medium">Destination</span>
              <span className="text-gray-900 font-semibold text-right max-w-[60%]">{booking?.destination || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400 font-medium">Distance</span>
              <span className="text-gray-900 font-semibold">{booking?.distanceKm ?? '—'} km</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400 font-medium">Truck Type</span>
              <span className="text-gray-900 font-semibold">{booking?.truckName || '—'}</span>
            </div>
            {booking?.driverName && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-medium">Driver</span>
                <span className="text-gray-900 font-semibold">{booking.driverName}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-400 font-medium">Status</span>
              <span className="text-gray-900 font-semibold capitalize">{(booking?.status || '—').replace('-', ' ')}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-200 pt-6 space-y-2 mb-8">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400 font-medium">Payment Method</span>
              <span className="text-gray-900 font-semibold">{paymentLabel}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400 font-medium">Payment Status</span>
              <span className={`font-semibold capitalize ${booking?.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>{booking?.paymentStatus || '—'}</span>
            </div>
            {booking?.paymentRef && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-medium">Reference</span>
                <span className="text-gray-900 font-mono text-xs">{booking.paymentRef}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-gray-100">
            <span className="font-display font-bold text-gray-900">Total Paid</span>
            <span className="font-display font-black text-2xl text-[#ff8c00] tracking-tighter">₦{(booking?.price || 0).toLocaleString()}</span>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-300 font-medium mt-8 print:mt-4">Thank you for shipping with Mivo.</p>
      </main>
    </div>
  );
}

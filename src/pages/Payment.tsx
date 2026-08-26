import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Wallet, Banknote, ShieldCheck, ChevronRight, Loader2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useBooking } from '../contexts/BookingContext';
import { useAuth } from '../contexts/AuthContext';
import { isDemoMode } from '../firebase';
import { payWithPaystack, payWithFlutterwave } from '../lib/payments';
import { createBooking, addWalletTransaction, getUserProfile } from '../lib/firestore';

type MethodId = 'paystack' | 'flutterwave' | 'wallet' | 'cod';

const paymentMethods: { id: MethodId; name: string; sub: string; icon: ReactNode; color: string }[] = [
  { id: 'paystack', name: 'Pay with Paystack', sub: 'Card, bank transfer, USSD', icon: <CreditCard className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600' },
  { id: 'flutterwave', name: 'Pay with Flutterwave', sub: 'Card, mobile money, bank', icon: <CreditCard className="w-6 h-6" />, color: 'bg-orange-50 text-orange-600' },
  { id: 'wallet', name: 'Mivo Wallet', sub: 'Deduct from wallet balance', icon: <Wallet className="w-6 h-6" />, color: 'bg-purple-50 text-purple-600' },
  { id: 'cod', name: 'Cash on Delivery', sub: 'Pay the driver on arrival', icon: <Banknote className="w-6 h-6" />, color: 'bg-green-50 text-green-600' },
];

export default function Payment() {
  const navigate = useNavigate();
  const { booking, setBooking, resetBooking } = useBooking();
  const { user, profile } = useAuth();
  const [selected, setSelected] = useState<MethodId>('paystack');
  const [isProcessing, setIsProcessing] = useState(false);

  const finalizeBooking = async (paymentRef: string, paymentStatus: 'paid' | 'pending') => {
    if (isDemoMode || !user || !profile) {
      resetBooking();
      navigate('/booking-success', { state: { booking, demo: true } });
      return;
    }

    try {
      const bookingId = await createBooking({
        userId: user.uid,
        userName: profile.displayName,
        userPhone: profile.phoneNumber || null,
        truckId: booking.truckId || '',
        truckName: booking.truckName || 'Truck',
        pickupLocation: booking.pickupLocation,
        pickupCoords: booking.pickupCoords || { lat: 6.5244, lng: 3.3792 },
        destination: booking.destination,
        destinationCoords: booking.destinationCoords || { lat: 6.5244, lng: 3.3792 },
        distanceKm: booking.distanceKm || 5,
        price: booking.price || 0,
        paymentMethod: selected === 'cod' ? undefined : (selected as 'paystack' | 'flutterwave' | 'wallet'),
        paymentRef,
        paymentStatus,
        status: 'pending',
        driverId: null,
        driverName: null,
      });

      if (selected === 'wallet') {
        await addWalletTransaction(user.uid, {
          amount: -(booking.price || 0),
          type: 'debit',
          description: `Booking payment · ${booking.truckName}`,
          reference: paymentRef,
        });
      }

      setBooking((b) => ({ ...b, bookingId }));
      resetBooking();
      navigate('/booking-success', { state: { bookingId } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save your booking. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);

    if (isDemoMode) {
      setTimeout(() => finalizeBooking('DEMO_REF', 'paid'), 1200);
      return;
    }

    try {
      if (selected === 'cod') {
        await finalizeBooking('CASH_ON_DELIVERY', 'pending');
        return;
      }

      if (selected === 'wallet') {
        const freshProfile = user ? await getUserProfile(user.uid) : null;
        // Wallet balance itself is derived from the transaction ledger client-side
        // on the Wallet page; here we just record the debit at confirm time.
        void freshProfile;
        await finalizeBooking(`WALLET_${Date.now()}`, 'paid');
        return;
      }

      const email = user?.email || profile?.email || 'guest@mivo.app';
      const reference = `MIVO_${Date.now()}`;
      const commonParams = {
        email,
        amountNaira: booking.price || 0,
        reference,
        name: profile?.displayName,
        phone: profile?.phoneNumber,
        onSuccess: (ref: string) => finalizeBooking(ref, 'paid'),
        onClose: () => setIsProcessing(false),
      };

      if (selected === 'paystack') {
        await payWithPaystack(commonParams);
      } else {
        await payWithFlutterwave(commonParams);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Payment could not be started.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-40">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 flex justify-between items-center w-full px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="font-display font-bold text-lg text-gray-900">Payment Method</h1>
        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-6 pt-8">
        <div className="mb-10">
          <h2 className="font-display font-extrabold text-3xl tracking-tight text-gray-900 mb-2">Total Amount</h2>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-black text-5xl text-[#ff8c00] tracking-tighter">₦{booking.price?.toLocaleString() || '0'}</span>
            <span className="text-gray-400 font-semibold text-lg">NGN</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-green-600 bg-green-50 w-fit px-3 py-1 rounded-full">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Secure Transaction</span>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest ml-2">Select Payment Method</p>
          {paymentMethods.map((method) => (
            <motion.div
              key={method.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(method.id)}
              className={`p-5 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                selected === method.id ? 'bg-white border-[#ff8c00] shadow-xl shadow-orange-100' : 'bg-white border-transparent shadow-sm'
              }`}
            >
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${method.color}`}>
                  {method.icon}
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-gray-900">{method.name}</h3>
                  <p className="text-gray-400 text-xs font-medium">{method.sub}</p>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                selected === method.id ? 'border-[#ff8c00] bg-[#ff8c00]' : 'border-gray-200'
              }`}>
                {selected === method.id && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-2xl z-50 pb-8 pt-4 px-6 shadow-2xl rounded-t-[2.5rem] border-t border-gray-50">
        <div className="max-w-screen-md mx-auto">
          <button
            onClick={handleConfirmPayment}
            disabled={isProcessing}
            className={`w-full bg-gradient-to-r from-[#904d00] to-[#ff8c00] text-white py-5 rounded-2xl font-display font-extrabold text-lg shadow-xl shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Confirm Payment<ChevronRight className="w-5 h-5" /></>}
          </button>
          <p className="text-center mt-4 text-[11px] text-gray-400 font-medium">
            Your payment is protected by Mivo Secure Logistics.
          </p>
        </div>
      </footer>
    </div>
  );
}

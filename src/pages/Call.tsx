import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PhoneCall, PhoneOff, MessageCircle, User } from 'lucide-react';

interface CallState {
  name?: string;
  phone?: string;
  bookingId?: string;
}

export default function Call() {
  const navigate = useNavigate();
  const location = useLocation();
  const { name, phone, bookingId } = (location.state as CallState | null) || {};

  const handleDial = () => {
    if (phone) window.location.href = `tel:${phone}`;
  };

  return (
    <div className="h-screen bg-gradient-to-b from-[#1c1b1b] to-[#3a3a3a] flex flex-col items-center justify-between py-20 px-6">
      <div className="flex flex-col items-center">
        <div className="relative mb-8">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-[#ff8c00]/20 rounded-full"
          />
          <div className="relative w-40 h-40 rounded-full flex items-center justify-center border-4 border-[#ff8c00] shadow-2xl bg-gray-700 text-white font-display font-black text-5xl">
            {name?.[0] || <User className="w-16 h-16" />}
          </div>
        </div>
        <h1 className="font-display font-black text-4xl text-white tracking-tighter mb-2">{name || 'No driver yet'}</h1>
        <p className="text-[#ff8c00] font-bold tracking-widest uppercase text-xs mb-4">
          {phone ? 'Tap call to dial via your phone' : 'Contact appears once a driver is assigned'}
        </p>
      </div>

      <div className="w-full max-w-sm flex justify-center gap-10">
        <button
          onClick={handleDial}
          disabled={!phone}
          className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-green-500/40 hover:bg-green-600 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <PhoneCall className="w-8 h-8" />
        </button>
        <button
          onClick={() => navigate(-1)}
          className="w-20 h-20 bg-red-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-red-500/40 hover:bg-red-600 transition-all active:scale-90"
        >
          <PhoneOff className="w-8 h-8" />
        </button>
      </div>

      <div className="flex gap-10">
        <button
          onClick={() => navigate('/chat', { state: { bookingId } })}
          className="flex flex-col items-center gap-2 text-white/40 hover:text-white transition-colors"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Message</span>
        </button>
      </div>
    </div>
  );
}

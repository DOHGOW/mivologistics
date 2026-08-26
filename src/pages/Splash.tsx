import { motion } from 'motion/react';
import { Truck } from 'lucide-react';

export default function Splash() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#904d00] to-[#ff8c00] flex flex-col items-center justify-center overflow-hidden">
      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-32 h-32 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-8"
      >
        <Truck className="w-16 h-16 text-[#ff8c00]" fill="currentColor" />
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-center"
      >
        <h1 className="font-display font-black text-6xl text-white tracking-tighter mb-2">Mivo</h1>
        <p className="text-white/80 text-sm tracking-[0.2em] uppercase font-semibold">Kinetic Precision Logistics</p>
      </motion.div>

      <div className="absolute bottom-16 w-full max-w-xs px-8">
        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="w-1/3 h-full bg-white rounded-full"
          />
        </div>
      </div>
    </div>
  );
}

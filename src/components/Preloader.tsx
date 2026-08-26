import { motion } from 'motion/react';
import { Truck } from 'lucide-react';

export default function Preloader({ label = 'Loading Mivo…' }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#fcf9f8]">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative flex flex-col items-center"
      >
        <div className="relative w-20 h-20 mb-6">
          <motion.div
            className="absolute inset-0 rounded-3xl bg-[#ff8c00]/15"
            animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#904d00] to-[#ff8c00] flex items-center justify-center shadow-xl shadow-orange-200">
            <motion.div
              animate={{ x: [-4, 4, -4] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Truck className="w-9 h-9 text-white" />
            </motion.div>
          </div>
        </div>

        <h1 className="font-display font-black text-2xl tracking-tighter text-gray-900 mb-1">Mivo</h1>
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">{label}</p>

        <div className="flex gap-1.5 mt-5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#ff8c00]"
              animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

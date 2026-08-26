import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, CreditCard, Info, MessageCircle, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { watchNotifications, markNotificationRead, type AppNotification } from '../lib/firestore';
import { isDemoMode } from '../firebase';

const DEMO_NOTIFICATIONS: AppNotification[] = [
  { id: '1', type: 'booking', title: 'Shipment Delivered', body: 'Your shipment has been successfully delivered.', read: false },
  { id: '2', type: 'payment', title: 'Payment Successful', body: 'Payment for your recent booking was successful.', read: false },
  { id: '3', type: 'system', title: 'System Update', body: 'We have improved our live tracking precision.', read: true },
];

import type { ReactNode } from 'react';

const ICON_MAP: Record<AppNotification['type'], { icon: ReactNode; color: string }> = {
  booking: { icon: <Truck className="w-6 h-6" />, color: 'bg-green-50 text-green-600' },
  payment: { icon: <CreditCard className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600' },
  system: { icon: <Info className="w-6 h-6" />, color: 'bg-purple-50 text-purple-600' },
  chat: { icon: <MessageCircle className="w-6 h-6" />, color: 'bg-orange-50 text-[#ff8c00]' },
};

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>(isDemoMode ? DEMO_NOTIFICATIONS : []);

  useEffect(() => {
    if (isDemoMode || !user) return;
    const unsub = watchNotifications(user.uid, setNotifications);
    return () => unsub();
  }, [user]);

  const handleOpen = (n: AppNotification) => {
    if (!isDemoMode && user && n.id && !n.read) {
      markNotificationRead(user.uid, n.id);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-12">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 flex justify-between items-center w-full px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="font-display font-bold text-lg text-gray-900">Notifications</h1>
        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-6 pt-8">
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="font-display font-black text-2xl text-gray-900 tracking-tighter">Recent Updates</h2>
        </div>

        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
            <Bell className="w-10 h-10 mb-4" />
            <p className="font-medium">No notifications yet.</p>
          </div>
        )}

        <div className="space-y-4">
          {notifications.map((item) => {
            const meta = ICON_MAP[item.type] || ICON_MAP.system;
            return (
              <motion.div
                key={item.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                onClick={() => handleOpen(item)}
                className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-50 flex gap-5 relative overflow-hidden group hover:border-[#ff8c00]/20 transition-all cursor-pointer"
              >
                <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center ${meta.color}`}>
                  {meta.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-gray-900 text-lg">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed font-medium">{item.body}</p>
                </div>
                {!item.read && <div className="absolute top-0 right-0 w-1.5 h-full bg-[#ff8c00]" />}
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

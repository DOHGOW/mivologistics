import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, CheckCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { sendChatMessage, watchChatMessages, type ChatMessage } from '../lib/firestore';
import { isDemoMode } from '../firebase';

const DEMO_MESSAGES: ChatMessage[] = [
  { id: '1', senderId: 'driver', senderRole: 'driver', senderName: 'Marcus Rodriguez', text: "Hello! I'm your driver. I've just picked up your cargo." },
  { id: '2', senderId: 'user', senderRole: 'user', senderName: 'You', text: 'Great! Thank you. Is everything secure?' },
  { id: '3', senderId: 'driver', senderRole: 'driver', senderName: 'Marcus Rodriguez', text: "Yes, all secured and covered. I'm heading to the expressway now." },
];

export default function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingId = (location.state as { bookingId?: string } | null)?.bookingId;
  const { user, profile } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(isDemoMode ? DEMO_MESSAGES : []);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bookingId || isDemoMode) return;
    const unsub = watchChatMessages(bookingId, setMessages);
    return () => unsub();
  }, [bookingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;
    const text = message.trim();
    setMessage('');

    if (isDemoMode || !bookingId || !user || !profile) {
      setMessages((prev) => [...prev, { id: String(Date.now()), senderId: 'user', senderRole: 'user', senderName: 'You', text }]);
      return;
    }

    setSending(true);
    try {
      await sendChatMessage(bookingId, { senderId: user.uid, senderRole: profile.role, senderName: profile.displayName, text });
    } finally {
      setSending(false);
    }
  };

  const otherPartyName = messages.find((m) => m.senderId !== user?.uid && m.senderRole !== profile?.role)?.senderName || 'Driver';

  return (
    <div className="flex flex-col h-screen bg-[#fcf9f8]">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 flex justify-between items-center w-full px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-orange-50 bg-gray-100 flex items-center justify-center text-gray-400 font-display font-bold">
              {otherPartyName[0]}
            </div>
            <div>
              <h1 className="font-display font-bold text-base text-gray-900">{otherPartyName}</h1>
              <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Online</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        {!bookingId && !isDemoMode ? (
          <div className="text-center text-gray-400 text-sm font-medium mt-20">
            Chat opens once you have an active trip with a driver assigned.
          </div>
        ) : (
          <>
            <div className="text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] bg-gray-100 px-3 py-1 rounded-full">Today</span>
            </div>
            {messages.map((msg) => {
              const isMine = isDemoMode ? msg.senderRole === 'user' : msg.senderId === user?.uid;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-3xl shadow-sm ${isMine ? 'bg-[#ff8c00] text-white rounded-tr-none' : 'bg-white text-gray-900 rounded-tl-none border border-gray-50'}`}>
                    <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                    <div className={`flex items-center gap-1 mt-2 ${isMine ? 'justify-end text-white/60' : 'justify-start text-gray-400'}`}>
                      {isMine && <CheckCheck className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </main>

      <footer className="p-6 bg-white border-t border-gray-50">
        <div className="flex items-center gap-3 bg-gray-50 rounded-[2rem] px-4 py-2 border border-gray-100 focus-within:bg-white focus-within:border-[#ff8c00]/20 transition-all">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            disabled={!bookingId && !isDemoMode}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-900 disabled:opacity-50"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className={`p-3 rounded-2xl transition-all ${message.trim() ? 'bg-[#ff8c00] text-white shadow-lg shadow-orange-100' : 'bg-gray-200 text-gray-400'}`}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </footer>
    </div>
  );
}

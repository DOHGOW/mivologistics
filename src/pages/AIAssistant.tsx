import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { askAssistant, type ChatMessage } from '../lib/ai';
import { isDemoMode } from '../firebase';

const WELCOME: ChatMessage = {
  role: 'assistant',
  text: "Hi, I'm the Mivo Assistant. Ask me anything about booking a truck, tracking a shipment, payments, or how Mivo works — you can ask in English, Pidgin, Hausa, Yoruba, or Igbo.",
};

export default function AIAssistant() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');

    if (isDemoMode) {
      setMessages((prev) => [...prev, { role: 'user', text }, { role: 'assistant', text: 'Demo mode — connect Firebase and an AI provider key to talk to the real assistant.' }]);
      return;
    }

    const next = [...messages, { role: 'user' as const, text }];
    setMessages(next);
    setSending(true);
    try {
      const reply = await askAssistant(next);
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: err instanceof Error ? err.message : "Sorry, I couldn't respond just now. Try again, or use Email/Call Us in Support." }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#fcf9f8]">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 flex justify-between items-center w-full px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-[#ff8c00]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-base text-gray-900">Mivo Assistant</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI · not a real person</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-3xl shadow-sm ${msg.role === 'user' ? 'bg-[#ff8c00] text-white rounded-tr-none' : 'bg-white text-gray-900 rounded-tl-none border border-gray-50'}`}>
              <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-3xl rounded-tl-none border border-gray-50 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      <footer className="p-6 bg-white border-t border-gray-50">
        <div className="flex items-center gap-3 bg-gray-50 rounded-[2rem] px-4 py-2 border border-gray-100 focus-within:bg-white focus-within:border-[#ff8c00]/20 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about Mivo..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-900"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className={`p-3 rounded-2xl transition-all ${input.trim() && !sending ? 'bg-[#ff8c00] text-white shadow-lg shadow-orange-100' : 'bg-gray-200 text-gray-400'}`}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </footer>
    </div>
  );
}

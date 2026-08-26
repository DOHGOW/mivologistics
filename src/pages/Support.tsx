import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Phone, Search, ChevronRight, HelpCircle, FileText, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function Support() {
  const navigate = useNavigate();

  const faqs = [
    { q: 'How do I track my shipment?', a: "You can track your shipment in real-time from the 'Activity' tab or by tapping 'Track My Truck' on your booking confirmation." },
    { q: 'What payment methods are accepted?', a: 'We accept Paystack, Flutterwave, Mivo Wallet, and Cash on Delivery.' },
    { q: 'How do I cancel a booking?', a: "Contact support via chat or phone and we'll cancel it for you. Cancellation fees may apply depending on driver assignment status." },
  ];

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-12">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 w-full px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="font-display font-bold text-lg text-gray-900">Support Center</h1>
        </div>
        <div className="bg-gray-50 rounded-2xl flex items-center px-4 h-12 border border-gray-100">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input 
            type="text" 
            placeholder="Search help articles..."
            className="bg-transparent border-none focus:ring-0 w-full text-sm font-medium"
          />
        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-6 pt-8">
        <div className="grid grid-cols-2 gap-4 mb-10">
          <button 
            onClick={() => window.open('mailto:support@mivo.app?subject=Support Request')}
            className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 flex flex-col items-center gap-3 hover:border-[#ff8c00]/20 transition-all"
          >
            <div className="w-14 h-14 bg-orange-50 text-[#ff8c00] rounded-2xl flex items-center justify-center">
              <MessageCircle className="w-7 h-7" />
            </div>
            <span className="font-display font-bold text-gray-900">Email Us</span>
          </button>
          <button 
            onClick={() => window.open('tel:+2340000000000')}
            className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 flex flex-col items-center gap-3 hover:border-[#ff8c00]/20 transition-all"
          >
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Phone className="w-7 h-7" />
            </div>
            <span className="font-display font-bold text-gray-900">Call Us</span>
          </button>
        </div>

        <section className="space-y-4 mb-10">
          <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest ml-2">Quick Links</h2>
          <div className="space-y-3">
            {[
              { icon: <FileText />, label: "User Manual", color: "text-purple-600 bg-purple-50" },
              { icon: <Shield />, label: "Privacy Policy", color: "text-green-600 bg-green-50" },
              { icon: <HelpCircle />, label: "Terms of Service", color: "text-gray-600 bg-gray-50" },
            ].map((item, i) => (
              <button key={i} onClick={() => toast.info('This page is coming soon.')} className="w-full bg-white p-5 rounded-3xl shadow-sm border border-gray-50 flex items-center justify-between group">
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.color}`}>
                    <span className="w-6 h-6">{item.icon}</span>
                  </div>
                  <span className="font-display font-bold text-gray-900 text-lg">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#ff8c00] transition-colors" />
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest ml-2">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
                <h3 className="font-display font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed font-medium">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

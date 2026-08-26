import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Shield, CreditCard, Users, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { listAdmins, type UserProfile } from '../../lib/firestore';
import { isDemoMode } from '../../firebase';

const DEMO_ADMINS: UserProfile[] = [{ uid: '1', displayName: 'Admin User', email: 'admin@mivo.com', role: 'admin', status: 'active' }];

const TABS = [
  { id: 'general', label: 'General', icon: <Settings className="w-5 h-5" /> },
  { id: 'payments', label: 'Payment Gateways', icon: <CreditCard className="w-5 h-5" /> },
  { id: 'team', label: 'Admin Team', icon: <Users className="w-5 h-5" /> },
  { id: 'security', label: 'Security', icon: <Shield className="w-5 h-5" /> },
];

export default function AdminSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('payments');
  const [admins, setAdmins] = useState<UserProfile[]>(isDemoMode ? DEMO_ADMINS : []);

  useEffect(() => {
    if (isDemoMode) return;
    listAdmins().then(setAdmins);
  }, []);

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-12">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 border-b border-gray-50">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="font-display font-bold text-lg text-gray-900">System Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 pt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-72 shrink-0 space-y-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-white text-[#ff8c00] shadow-sm border border-orange-50' : 'text-gray-500 hover:bg-white/50'}`}
              >
                {tab.icon}
                <span className="font-display font-bold text-sm">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 space-y-8">
            {activeTab === 'general' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50">
                <h3 className="font-display font-black text-xl text-gray-900 mb-2">Platform</h3>
                <p className="text-sm text-gray-500 font-medium mb-6">Mivo Logistics — truck booking and last-mile delivery platform.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Live map provider</p>
                    <p className="font-display font-bold text-gray-900 text-sm">OpenStreetMap + Leaflet</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Backend</p>
                    <p className="font-display font-bold text-gray-900 text-sm">Firebase (Auth, Firestore, Storage)</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'payments' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-orange-50 border border-orange-100 p-6 rounded-[2rem] flex items-start gap-4">
                  <ShieldAlert className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-display font-bold text-orange-900 text-sm mb-1">Keys are never stored here</p>
                    <p className="text-xs text-orange-700 leading-relaxed">
                      Payment gateway keys must live in environment variables set at deploy time, not typed into an admin screen — anything entered in a browser page is visible to anyone who inspects the app.
                      Secret keys especially must never reach client-side code. Set these in your <code className="font-mono">.env</code> file or your hosting provider's environment variable settings (see README).
                    </p>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50">
                  <h3 className="font-display font-black text-xl text-gray-900 mb-6">Configured gateways</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div>
                        <p className="font-display font-bold text-gray-900 text-sm">Paystack</p>
                        <p className="text-xs text-gray-400 font-mono">VITE_PAYSTACK_PUBLIC_KEY</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ? 'Set' : 'Not set'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div>
                        <p className="font-display font-bold text-gray-900 text-sm">Flutterwave</p>
                        <p className="text-xs text-gray-400 font-mono">VITE_FLUTTERWAVE_PUBLIC_KEY</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY ? 'Set' : 'Not set'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'team' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50">
                <h3 className="font-display font-black text-xl text-gray-900 mb-2">Admin accounts</h3>
                <p className="text-sm text-gray-500 font-medium mb-6">Admin roles are granted manually in Firestore (set a user's <code className="font-mono text-xs">role</code> field to <code className="font-mono text-xs">admin</code>), not through self-signup.</p>
                <div className="space-y-3">
                  {admins.map((a) => (
                    <div key={a.uid} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div>
                        <p className="font-display font-bold text-gray-900 text-sm">{a.displayName}</p>
                        <p className="text-xs text-gray-400">{a.email}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider bg-green-50 text-green-600">Active</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50">
                <h3 className="font-display font-black text-xl text-gray-900 mb-6">Security posture</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <p className="text-sm font-medium text-green-800">Firestore security rules enforce role-based access at the database level.</p>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <p className="text-sm font-medium text-green-800">Admin routes check the signed-in user's role before rendering — never trust the URL alone.</p>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                    <p className="text-sm font-medium text-gray-600">Two-factor authentication for admin accounts is on the roadmap.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

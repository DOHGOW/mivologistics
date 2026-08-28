import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Shield, Eye, Smartphone, Globe, Info, ChevronRight, Moon, Trash2, X, Loader2, MapPin, Plus, Home as HomeIcon, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { sendResetEmail, deleteCurrentAccount } from '../firebase';
import { updateUserProfile, deleteUserProfile, type SavedAddress } from '../lib/firestore';
import { geocodeAddress } from '../lib/geocode';

function addressIcon(label: string) {
  const l = label.toLowerCase();
  if (l === 'home') return <HomeIcon className="w-5 h-5" />;
  if (l === 'work') return <Briefcase className="w-5 h-5" />;
  return <MapPin className="w-5 h-5" />;
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, profile, isDemoMode: demo } = useAuth();
  const [notificationsOn, setNotificationsOn] = useState(profile?.notificationsEnabled ?? true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(profile?.savedAddresses || []);
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [savingPlace, setSavingPlace] = useState(false);

  const handleAddPlace = async () => {
    if (!newLabel.trim() || !newAddress.trim() || !user) return;
    setSavingPlace(true);
    try {
      const geo = await geocodeAddress(newAddress.trim());
      if (!geo) {
        toast.error("Couldn't locate that address. Try a more specific one.");
        return;
      }
      const next: SavedAddress[] = [
        ...savedAddresses,
        { id: String(Date.now()), label: newLabel.trim(), address: newAddress.trim(), lat: geo.lat, lng: geo.lng },
      ];
      if (!demo) await updateUserProfile(user.uid, { savedAddresses: next });
      setSavedAddresses(next);
      setNewLabel('');
      setNewAddress('');
      setShowAddPlace(false);
      toast.success('Place saved.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save this place.');
    } finally {
      setSavingPlace(false);
    }
  };

  const handleRemovePlace = async (id: string) => {
    const next = savedAddresses.filter((a) => a.id !== id);
    setSavedAddresses(next);
    if (!demo && user) await updateUserProfile(user.uid, { savedAddresses: next });
  };

  const toggleNotifications = async () => {
    const next = !notificationsOn;
    setNotificationsOn(next);
    if (!demo && user) {
      await updateUserProfile(user.uid, { notificationsEnabled: next });
    }
  };

  const handlePasswordReset = async () => {
    if (demo || !profile?.email) {
      toast.info('Demo mode — connect Firebase to send real reset emails.');
      return;
    }
    try {
      await sendResetEmail(profile.email);
      toast.success(`Password reset link sent to ${profile.email}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send reset email.');
    }
  };

  const handleDeleteAccount = async () => {
    if (demo || !user) {
      toast.info('Demo mode — connect Firebase to enable account deletion.');
      setShowDeleteModal(false);
      return;
    }
    setDeleting(true);
    try {
      await deleteUserProfile(user.uid);
      await deleteCurrentAccount();
      navigate('/auth');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('requires-recent-login')) {
        toast.error('For security, please log out and log back in before deleting your account.');
      } else {
        toast.error('Could not delete account. Please try again.');
      }
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const sections = [
    {
      title: 'General',
      items: [
        { icon: <Bell />, label: 'Notifications', value: notificationsOn ? 'On' : 'Off', color: 'text-blue-600 bg-blue-50', onClick: toggleNotifications },
        { icon: <Globe />, label: 'Language', value: 'English', color: 'text-purple-600 bg-purple-50', onClick: () => toast.info('More languages coming soon.') },
        { icon: <Moon />, label: 'Dark Mode', value: 'Coming soon', color: 'text-gray-600 bg-gray-50', onClick: () => toast.info('Dark mode is on the roadmap.') },
      ],
    },
    {
      title: 'Security',
      items: [
        { icon: <Shield />, label: 'Privacy Policy', color: 'text-green-600 bg-green-50', onClick: () => toast.info('Privacy policy page coming soon.') },
        { icon: <Eye />, label: 'Reset Password', color: 'text-orange-600 bg-orange-50', onClick: handlePasswordReset },
        { icon: <Smartphone />, label: 'Two-Factor Auth', value: 'Coming soon', color: 'text-red-600 bg-red-50', onClick: () => toast.info('Two-factor auth is on the roadmap.') },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-12">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 flex justify-between items-center w-full px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="font-display font-bold text-lg text-gray-900">Settings</h1>
        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-6 pt-8 space-y-10">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-4">
            <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest ml-2">{section.title}</h2>
            <div className="space-y-3">
              {section.items.map((item, i) => (
                <button key={i} onClick={item.onClick} className="w-full bg-white p-5 rounded-3xl shadow-sm border border-gray-50 flex items-center justify-between group hover:border-[#ff8c00]/20 transition-all">
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.color}`}>
                      <span className="w-6 h-6">{item.icon}</span>
                    </div>
                    <span className="font-display font-bold text-gray-900 text-lg">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.value && <span className="text-gray-400 font-semibold text-sm">{item.value}</span>}
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#ff8c00] transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="space-y-4">
          <div className="flex items-center justify-between ml-2">
            <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Saved Places</h2>
            <button onClick={() => setShowAddPlace(true)} className="flex items-center gap-1 text-[#ff8c00] text-xs font-bold">
              <Plus className="w-3.5 h-3.5" />
              Add Place
            </button>
          </div>
          <div className="space-y-3">
            {savedAddresses.length === 0 && (
              <div className="bg-white p-6 rounded-3xl border border-gray-50 text-center text-gray-400 text-sm font-medium">
                No saved places yet — add Home or Work for one-tap booking.
              </div>
            )}
            {savedAddresses.map((place) => (
              <div key={place.id} className="w-full bg-white p-5 rounded-3xl shadow-sm border border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-orange-50 text-[#ff8c00] shrink-0">
                    {addressIcon(place.label)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-bold text-gray-900">{place.label}</p>
                    <p className="text-gray-400 text-xs font-medium truncate">{place.address}</p>
                  </div>
                </div>
                <button onClick={() => handleRemovePlace(place.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <button onClick={() => setShowDeleteModal(true)} className="w-full p-5 rounded-3xl bg-white border border-red-100 text-red-600 font-display font-bold text-lg flex items-center justify-center gap-3 hover:bg-red-50 transition-all">
            <Trash2 className="w-5 h-5" />
            Delete Account
          </button>
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-400 mb-2">
              <Info className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Mivo Logistics</span>
            </div>
            <p className="text-[10px] text-gray-300 font-medium">© {new Date().getFullYear()} Mivo Logistics. All rights reserved.</p>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !deleting && setShowDeleteModal(false)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm relative z-10">
              <div className="flex justify-between items-start mb-4">
                <h2 className="font-display font-black text-xl text-gray-900">Delete your account?</h2>
                <button onClick={() => setShowDeleteModal(false)} className="p-1 text-gray-400"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-sm text-gray-500 font-medium mb-6">This permanently deletes your Mivo profile. Booking history tied to your account will remain for record-keeping. This can't be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-display font-bold text-sm">Cancel</button>
                <button onClick={handleDeleteAccount} disabled={deleting} className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-display font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-70">
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showAddPlace && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !savingPlace && setShowAddPlace(false)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm relative z-10">
              <div className="flex justify-between items-start mb-6">
                <h2 className="font-display font-black text-xl text-gray-900">Add a place</h2>
                <button onClick={() => setShowAddPlace(false)} className="p-1 text-gray-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Label</label>
                  <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Home, Work, Warehouse..." className="w-full bg-gray-50 rounded-2xl px-4 h-12 border-none focus:ring-0 text-sm font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Address</label>
                  <input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="Street, city, state" className="w-full bg-gray-50 rounded-2xl px-4 h-12 border-none focus:ring-0 text-sm font-medium" />
                </div>
              </div>
              <button
                onClick={handleAddPlace}
                disabled={savingPlace || !newLabel.trim() || !newAddress.trim()}
                className="w-full mt-6 py-4 rounded-2xl bg-[#ff8c00] text-white font-display font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {savingPlace ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Place'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

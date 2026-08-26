import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, Plus, X, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { listTrucks, createTruck, updateTruck, deleteTruck, type Truck as TruckDoc } from '../../lib/firestore';
import { isDemoMode } from '../../firebase';

const DEMO_FLEET: TruckDoc[] = [
  { id: '1', name: 'Small', category: 'Instant', capacity: 'Up to 500kg', pricePerKm: 350, available: true, image: '' },
  { id: '2', name: 'Medium', category: 'Top Rated', capacity: 'Up to 2 Tons', pricePerKm: 600, available: true, image: '' },
  { id: '3', name: 'Large', category: 'Heavy Duty', capacity: 'Up to 10 Tons', pricePerKm: 950, available: false, image: '' },
];

const emptyForm = { name: '', category: '', capacity: '', pricePerKm: 500, image: '' };

export default function AdminFleet() {
  const navigate = useNavigate();
  const [trucks, setTrucks] = useState<TruckDoc[]>(isDemoMode ? DEMO_FLEET : []);
  const [loading, setLoading] = useState(!isDemoMode);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    if (isDemoMode) return;
    setLoading(true);
    listTrucks().then(setTrucks).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleToggleAvailable = async (truck: TruckDoc) => {
    if (isDemoMode || !truck.id) { toast.info('Demo mode — connect Firebase to manage the real fleet.'); return; }
    setBusyId(truck.id);
    try {
      await updateTruck(truck.id, { available: !truck.available });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update truck.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (truck: TruckDoc) => {
    if (isDemoMode || !truck.id) { toast.info('Demo mode — connect Firebase to manage the real fleet.'); return; }
    setBusyId(truck.id);
    try {
      await deleteTruck(truck.id);
      toast.success(`${truck.name} removed from fleet.`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete truck.');
    } finally {
      setBusyId(null);
    }
  };

  const handleAdd = async () => {
    if (!form.name || !form.capacity) {
      toast.error('Name and capacity are required.');
      return;
    }
    if (isDemoMode) {
      setTrucks((t) => [...t, { ...form, id: String(Date.now()), available: true }]);
      setShowModal(false);
      setForm(emptyForm);
      toast.info('Demo mode — connect Firebase to save this permanently.');
      return;
    }
    setSaving(true);
    try {
      await createTruck({ ...form, available: true });
      toast.success(`${form.name} added to fleet.`);
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add truck.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-12">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 border-b border-gray-50">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="font-display font-bold text-lg text-gray-900">Fleet Management</h1>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#ff8c00] text-white px-6 py-2 rounded-xl font-display font-bold text-sm shadow-lg shadow-orange-100">
            <Plus className="w-4 h-4" />
            Add Truck Category
          </button>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 pt-8">
        <p className="text-sm text-gray-500 font-medium mb-6">
          These truck categories and prices are what customers see live in the app when booking. Toggle availability to hide a category during high demand or maintenance.
        </p>

        {loading && <p className="text-center py-16 text-gray-400 font-medium">Loading fleet…</p>}
        {!loading && trucks.length === 0 && <p className="text-center py-16 text-gray-400 font-medium">No truck categories yet — add one to get started.</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {trucks.map((truck) => (
            <motion.div key={truck.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 group hover:border-orange-100 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm bg-orange-50 text-[#ff8c00]">
                  <Truck className="w-6 h-6" />
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${truck.available ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {truck.available ? 'Available' : 'Hidden'}
                </span>
              </div>
              <h3 className="font-display font-black text-lg text-gray-900 mb-1">{truck.name}</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">{truck.capacity}</p>

              <div className="space-y-3 pt-6 border-t border-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price / km</span>
                  <span className="text-sm font-bold text-gray-900">₦{truck.pricePerKm.toLocaleString()}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleToggleAvailable(truck)}
                    disabled={busyId === truck.id}
                    className="flex-1 py-2.5 rounded-xl bg-gray-50 text-gray-700 font-display font-bold text-xs hover:bg-gray-100 transition-all disabled:opacity-50"
                  >
                    {truck.available ? 'Hide' : 'Show'}
                  </button>
                  <button
                    onClick={() => handleDelete(truck)}
                    disabled={busyId === truck.id}
                    className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-all disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !saving && setShowModal(false)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] p-8 w-full max-w-md relative z-10">
              <div className="flex justify-between items-start mb-6">
                <h2 className="font-display font-black text-xl text-gray-900">Add Truck Category</h2>
                <button onClick={() => setShowModal(false)} className="p-1 text-gray-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name (e.g. Medium)" className="w-full bg-gray-50 rounded-2xl px-4 h-12 text-sm font-medium focus:ring-2 focus:ring-orange-200 focus:outline-none" />
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Tag (e.g. Top Rated)" className="w-full bg-gray-50 rounded-2xl px-4 h-12 text-sm font-medium focus:ring-2 focus:ring-orange-200 focus:outline-none" />
                <input value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="Capacity (e.g. Up to 2 Tons)" className="w-full bg-gray-50 rounded-2xl px-4 h-12 text-sm font-medium focus:ring-2 focus:ring-orange-200 focus:outline-none" />
                <input type="number" value={form.pricePerKm} onChange={(e) => setForm({ ...form, pricePerKm: Number(e.target.value) })} placeholder="Price per km (₦)" className="w-full bg-gray-50 rounded-2xl px-4 h-12 text-sm font-medium focus:ring-2 focus:ring-orange-200 focus:outline-none" />
                <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="Image URL (optional)" className="w-full bg-gray-50 rounded-2xl px-4 h-12 text-sm font-medium focus:ring-2 focus:ring-orange-200 focus:outline-none" />
              </div>
              <button onClick={handleAdd} disabled={saving} className="w-full mt-6 bg-[#ff8c00] text-white py-4 rounded-2xl font-display font-bold shadow-lg shadow-orange-100 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add to Fleet'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

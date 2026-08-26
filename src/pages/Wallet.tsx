import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Wallet, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { usePaginatedQuery } from '../hooks/usePaginatedQuery';
import { listWalletTransactionsPage, addWalletTransaction, type WalletTransaction } from '../lib/firestore';
import { isDemoMode } from '../firebase';
import { payWithPaystack } from '../lib/payments';
import Pagination from '../components/Pagination';

const DEMO_TX: WalletTransaction[] = [
  { id: '1', amount: -45000, type: 'debit', description: 'Trip payment · MIVO-8829' },
  { id: '2', amount: 100000, type: 'credit', description: 'Wallet top-up via Paystack' },
  { id: '3', amount: -32000, type: 'debit', description: 'Trip payment · MIVO-8712' },
];

export default function WalletPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [topUpAmount, setTopUpAmount] = useState('5000');
  const [processing, setProcessing] = useState(false);
  const [balance, setBalance] = useState(0);

  const { items, page, hasMore, loading, next, prev, reload } = usePaginatedQuery<WalletTransaction>(
    (pageSize, cursor) => listWalletTransactionsPage(user?.uid || '', pageSize, cursor),
    8,
    [user?.uid]
  );

  const transactions = isDemoMode ? DEMO_TX : items;

  useEffect(() => {
    if (isDemoMode) {
      setBalance(DEMO_TX.reduce((sum, t) => sum + t.amount, 0) + 23000);
      return;
    }
    // Balance is the running sum of the visible ledger page; for a fully
    // accurate total across all pages, keep a denormalized balance field
    // on the user profile updated via a Cloud Function trigger in production.
    setBalance(transactions.reduce((sum, t) => sum + t.amount, 0));
  }, [transactions]);

  const handleTopUp = async () => {
    const amount = Number(topUpAmount);
    if (!amount || amount < 100) {
      toast.error('Enter a valid amount (minimum ₦100).');
      return;
    }
    if (isDemoMode) {
      toast.info('Demo mode — connect Firebase + Paystack to enable real top-ups.');
      return;
    }
    if (!user || !profile) return;

    setProcessing(true);
    try {
      await payWithPaystack({
        email: user.email || profile.email,
        amountNaira: amount,
        reference: `TOPUP_${Date.now()}`,
        name: profile.displayName,
        onSuccess: async (ref) => {
          await addWalletTransaction(user.uid, { amount, type: 'credit', description: 'Wallet top-up via Paystack', reference: ref });
          toast.success(`₦${amount.toLocaleString()} added to your wallet.`);
          reload();
          setProcessing(false);
        },
        onClose: () => setProcessing(false),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start top-up.');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-12">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 flex justify-between items-center w-full px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="font-display font-bold text-lg text-gray-900">Mivo Wallet</h1>
        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-6 pt-8">
        <div className="bg-gradient-to-br from-[#904d00] to-[#ff8c00] rounded-[2.5rem] p-8 text-white shadow-2xl shadow-orange-100 mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-white/60 text-xs font-bold uppercase tracking-[0.2em] mb-2">Total Balance</p>
            <h2 className="font-display font-black text-5xl tracking-tighter mb-8">₦{balance.toLocaleString()}</h2>
            <div className="flex gap-3">
              <input
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="w-28 bg-white/20 backdrop-blur-md rounded-2xl px-3 text-white placeholder:text-white/60 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                placeholder="Amount"
              />
              <button
                onClick={handleTopUp}
                disabled={processing}
                className="flex-1 bg-white text-[#ff8c00] py-3 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-all disabled:opacity-70"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" />Top Up</>}
              </button>
            </div>
          </div>
          <Wallet className="absolute -right-6 -bottom-6 w-48 h-48 text-white/10 rotate-12" />
        </div>

        <section>
          <div className="flex justify-between items-center mb-6 px-2">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Recent Transactions</h3>
          </div>
          {transactions.length === 0 && !loading && (
            <p className="text-center py-10 text-gray-400 font-medium">No transactions yet.</p>
          )}
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div key={tx.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-50 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.type === 'credit' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {tx.type === 'credit' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-gray-900">{tx.description}</h4>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-display font-black text-lg tracking-tighter ${tx.type === 'credit' ? 'text-green-600' : 'text-gray-900'}`}>
                    {tx.amount > 0 ? '+' : ''}₦{Math.abs(tx.amount).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {!isDemoMode && (
            <Pagination page={page} hasMore={hasMore} loading={loading} onPrev={prev} onNext={next} itemCount={transactions.length} totalLabel="transactions" />
          )}
        </section>
      </main>
    </div>
  );
}

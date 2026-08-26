import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface PaginationProps {
  page: number;
  hasMore: boolean;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
  itemCount: number;
  totalLabel?: string;
}

/**
 * Cursor-based pagination footer. Works with the { hasMore, lastDoc }
 * shape returned by the list*Page() helpers in lib/firestore.ts —
 * "next" always fetches the next cursor page rather than assuming a
 * fixed total count, which Firestore doesn't give you for free.
 */
export default function Pagination({ page, hasMore, loading, onPrev, onNext, itemCount, totalLabel = 'items' }: PaginationProps) {
  if (itemCount === 0 && page === 1 && !loading) return null;

  return (
    <div className="flex items-center justify-between px-1 py-4">
      <span className="text-xs font-semibold text-gray-400">
        {loading ? 'Loading…' : `Page ${page} · ${itemCount} ${totalLabel}`}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={page === 1 || loading}
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 active:scale-95 transition-all"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Loader2 className="w-4 h-4 text-[#ff8c00] animate-spin" />
            </motion.div>
          ) : (
            <motion.span key={page} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="w-6 text-center text-sm font-bold text-gray-900">
              {page}
            </motion.span>
          )}
        </AnimatePresence>
        <button
          onClick={onNext}
          disabled={!hasMore || loading}
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 active:scale-95 transition-all"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

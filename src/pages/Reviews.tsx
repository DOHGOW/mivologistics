import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { createReview, getBooking, listDriverReviews, type Review, type Booking } from '../lib/firestore';
import { isDemoMode } from '../firebase';

const DEMO_REVIEWS: Review[] = [
  { id: '1', bookingId: 'b1', userId: 'u1', userName: 'Sarah J.', driverId: 'd1', rating: 5, comment: 'Excellent service! Very professional and arrived right on time.' },
  { id: '2', bookingId: 'b2', userId: 'u2', userName: 'Mike T.', driverId: 'd1', rating: 4, comment: 'Good experience overall. A bit of delay due to traffic but kept me updated.' },
];

export default function Reviews() {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingId = (location.state as { bookingId?: string } | null)?.bookingId;
  const { user, profile } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [reviews, setReviews] = useState<Review[]>(isDemoMode ? DEMO_REVIEWS : []);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!bookingId || isDemoMode) return;
    getBooking(bookingId).then((b) => {
      setBooking(b);
      if (b?.driverId) listDriverReviews(b.driverId).then(setReviews);
    });
  }, [bookingId]);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 4.9;
  const canReview = !!booking?.driverId && !isDemoMode;

  const handleSubmit = async () => {
    if (isDemoMode) {
      toast.info('Demo mode — connect Firebase to submit real reviews.');
      setSubmitted(true);
      return;
    }
    if (!booking?.driverId || !user || !profile || !bookingId) return;
    setSubmitting(true);
    try {
      await createReview({ bookingId, userId: user.uid, userName: profile.displayName, driverId: booking.driverId, rating, comment });
      toast.success('Thanks for the feedback!');
      setSubmitted(true);
      const updated = await listDriverReviews(booking.driverId);
      setReviews(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-12">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 flex justify-between items-center w-full px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="font-display font-bold text-lg text-gray-900">Reviews & Ratings</h1>
        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-6 pt-8">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50 mb-10 flex items-center justify-between">
          <div className="text-center">
            <h2 className="font-display font-black text-6xl text-gray-900 tracking-tighter mb-2">{avg.toFixed(1)}</h2>
            <div className="flex items-center gap-1 justify-center mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-4 h-4 ${s <= Math.round(avg) ? 'text-yellow-500 fill-current' : 'text-gray-200'}`} />
              ))}
            </div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {canReview && !submitted && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-[2rem] shadow-sm border border-orange-100 mb-10">
            <h3 className="font-display font-bold text-gray-900 mb-4">Rate your driver, {booking?.driverName}</h3>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)}>
                  <Star className={`w-8 h-8 ${s <= rating ? 'text-yellow-500 fill-current' : 'text-gray-200'}`} />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was your trip?"
              rows={3}
              className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-orange-200 focus:outline-none mb-4"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-[#ff8c00] text-white py-4 rounded-2xl font-display font-bold shadow-lg shadow-orange-100 disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </motion.div>
        )}

        {submitted && (
          <div className="bg-green-50 border border-green-100 text-green-700 rounded-2xl p-5 mb-10 text-sm font-medium text-center">
            Thanks for your feedback!
          </div>
        )}

        <div className="flex items-center justify-between mb-8 px-2">
          <h3 className="font-display font-black text-2xl text-gray-900 tracking-tighter">Driver Reviews</h3>
        </div>

        {reviews.length === 0 && <p className="text-center text-gray-400 py-10 font-medium">No reviews yet.</p>}

        <div className="space-y-6">
          {reviews.map((review) => (
            <motion.div key={review.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center font-display font-bold text-[#ff8c00]">
                    {review.userName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-gray-900">{review.userName}</h4>
                    <div className="flex items-center gap-1">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-yellow-500 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed font-medium">{review.comment}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}

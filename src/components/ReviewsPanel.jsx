import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import IconButton from './IconButton';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import {
  addReview,
  averageRating,
  getReviews,
} from '../services/firestore';

export default function ReviewsPanel({ targetType, targetId }) {
  const { user, profile } = useAuth();
  const { t } = useLang();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!targetId) return;
    setLoading(true);
    try {
      setReviews(await getReviews(targetType, targetId));
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [targetType, targetId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      await addReview({
        targetType,
        targetId,
        userId: user.uid,
        userName: profile?.name || user.email,
        rating,
        comment,
      });
      setComment('');
      setRating(5);
      await load();
    } catch (err) {
      setError(err?.message || t('reviewFail'));
    } finally {
      setBusy(false);
    }
  }

  const avg = averageRating(reviews);
  const countKey = reviews.length === 1 ? 'reviewCount' : 'reviewCountPlural';

  return (
    <section className="mt-6 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm">
      <h2 className="font-headline mb-1 text-xl font-semibold">{t('reviews')}</h2>
      <p className="mb-4 font-dossier text-sm text-on-surface-variant">
        {avg != null
          ? t(countKey, { avg, n: reviews.length })
          : t('noRatingsYet')}
      </p>

      {loading ? (
        <p className="text-sm text-on-surface-variant">{t('loading')}</p>
      ) : (
        <ul className="mb-5 max-h-48 space-y-2 overflow-y-auto">
          {reviews.slice(0, 6).map((r) => (
            <li key={r.id} className="border-b border-outline-variant/15 pb-2 last:border-0">
              <p className="font-dossier text-sm text-primary">
                {'★'.repeat(r.rating)}
                {'☆'.repeat(5 - r.rating)}
              </p>
              <p className="text-sm font-semibold">{r.userName}</p>
              {r.comment && <p className="line-clamp-2 text-sm text-on-surface-variant">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}

      {user ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm font-semibold">
            {t('yourRating')}
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-outline-variant/40 px-3 py-2"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n === 1 ? t('starN', { n }) : t('starsN', { n })}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            {t('commentOptional')}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border border-outline-variant/40 px-3 py-2 font-normal"
            />
          </label>
          {error && <p className="text-sm text-error">{error}</p>}
          <IconButton
            type="submit"
            icon="send"
            label={t('postReview')}
            showLabel
            variant="secondary"
            disabled={busy}
          >
            {busy ? t('posting') : t('postReview')}
          </IconButton>
        </form>
      ) : (
        <p className="text-sm text-on-surface-variant">
          <Link to="/auth" className="font-semibold text-primary">
            {t('signInToRate')}
          </Link>
        </p>
      )}
    </section>
  );
}

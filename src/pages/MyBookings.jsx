import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorBanner, LoadingBlock } from '../components/Feedback';
import IconButton from '../components/IconButton';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { statusLabelKey } from '../i18n/strings';
import {
  cancelBookingAsTourist,
  getBookingsForTourist,
  getProductOrdersForTourist,
  getTripProgramById,
  updateProductOrderStatus,
} from '../services/firestore';
import { formatOrderOptions } from '../utils/productOrderFields';

/**
 * Tourist “My bookings” — list + cancel own active bookings.
 */
export default function MyBookings() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLang();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [orders, setOrders] = useState([]);

  async function load() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [bookings, myOrders] = await Promise.all([
        getBookingsForTourist(user.uid),
        getProductOrdersForTourist(user.uid).catch(() => []),
      ]);
      setOrders(myOrders);
      const withTrips = await Promise.all(
        bookings.map(async (b) => {
          const trip = await getTripProgramById(b.tripProgramId);
          return { ...b, trip };
        })
      );
      setRows(
        withTrips.sort((a, b) =>
          String(b.createdAt || b.date).localeCompare(String(a.createdAt || a.date))
        )
      );
    } catch (err) {
      setError(err?.message || t('loadBookingsFail'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && user) load();
    else if (!authLoading) setLoading(false);
  }, [authLoading, user]);

  async function handleCancelOrder(orderId) {
    if (!confirm(t('cancelBookingConfirm'))) return;
    setBusyId(orderId);
    try {
      await updateProductOrderStatus(orderId, 'cancelled');
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o))
      );
    } catch (err) {
      setError(err?.message || t('cancelFail'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(bookingId) {
    if (!confirm(t('cancelBookingConfirm'))) return;
    setBusyId(bookingId);
    try {
      await cancelBookingAsTourist(bookingId, user.uid);
      await load();
    } catch (err) {
      setError(err?.message || t('cancelFail'));
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading || (user && loading)) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-10">
        <LoadingBlock label={t('loadingBookings')} />
      </section>
    );
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-lg px-5 py-12">
        <h1 className="font-headline mb-3 text-3xl font-bold">{t('myBookings')}</h1>
        <p className="mb-4 text-on-surface-variant">{t('signInBookings')}</p>
        <Link to="/auth?redirect=/bookings" className="font-semibold text-primary">
          {t('signInArrow')}
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-5 py-8 md:px-10">
      <h1 className="font-headline mb-2 text-3xl font-bold md:text-4xl">{t('myBookings')}</h1>
      <p className="mb-6 text-on-surface-variant">{t('bookingsHint')}</p>
      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} onRetry={load} />
        </div>
      )}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface p-8 text-center">
          <p className="mb-3 text-on-surface-variant">{t('noBookingsYet')}</p>
          <Link to="/trips" className="font-semibold text-primary">
            {t('browseTrips')}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((b) => (
            <li
              key={b.id}
              className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="font-headline line-clamp-1 text-lg font-semibold">
                    {b.trip ? (
                      <Link to={`/trips/${b.trip.id}`} className="text-primary">
                        {b.trip.title}
                      </Link>
                    ) : (
                      b.tripProgramId
                    )}
                  </h2>
                  <p className="mt-1 font-dossier text-sm text-on-surface-variant">
                    {b.date} · {b.numPeople} {t('pax')} ·{' '}
                    <span className="font-body font-semibold text-primary">
                      {t(statusLabelKey(b.status))}
                    </span>
                  </p>
                  {b.trip && (
                    <p className="mt-0.5 font-dossier text-xs text-on-surface-variant">
                      {b.trip.price} {t('mad')} {t('simulated')}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/bookings/${b.id}`}
                    className="rounded-lg border border-outline-variant/40 px-3 py-1.5 text-sm font-semibold"
                  >
                    {t('details')}
                  </Link>
                  {b.status !== 'cancelled' && (
                    <IconButton
                      icon="cancel"
                      label={busyId === b.id ? t('cancelling') : t('cancel')}
                      variant="danger"
                      disabled={busyId === b.id}
                      onClick={() => handleCancel(b.id)}
                    />
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="font-headline mb-2 mt-10 text-2xl font-bold">{t('myOrders')}</h2>
      <p className="mb-4 text-sm text-on-surface-variant">{t('payOnPickup')}</p>
      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface p-8 text-center">
          <p className="mb-3 text-on-surface-variant">{t('noOrdersYet')}</p>
          <Link to="/artisans" className="font-semibold text-primary">
            {t('artisansTitle')}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li
              key={o.id}
              className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-headline line-clamp-1 text-lg font-semibold">
                    {o.productName}
                  </h3>
                  <p className="mt-1 font-dossier text-sm text-on-surface-variant">
                    × {o.quantity} · {o.total} {t('mad')} ·{' '}
                    <span className="font-body font-semibold text-primary">
                      {t(statusLabelKey(o.status))}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-on-surface-variant">
                    {o.artisanName || '—'}
                    {o.createdAt ? ` · ${o.createdAt.slice(0, 10)}` : ''}
                  </p>
                  {o.options && Object.keys(o.options).length > 0 && (
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {formatOrderOptions(o.options, t)}
                    </p>
                  )}
                </div>
                {['pending', 'confirmed'].includes(o.status) && (
                  <IconButton
                    icon="cancel"
                    label={busyId === o.id ? t('cancelling') : t('cancelOrder')}
                    variant="danger"
                    disabled={busyId === o.id}
                    onClick={() => handleCancelOrder(o.id)}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

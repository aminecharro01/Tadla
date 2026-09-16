import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ErrorBanner, LoadingBlock } from '../components/Feedback';
import { useLang } from '../context/LanguageContext';
import { statusLabelKey } from '../i18n/strings';
import {
  getBookingById,
  getTripProgramById,
  getUserById,
} from '../services/firestore';

export default function BookingConfirmation() {
  const { bookingId } = useParams();
  const { t } = useLang();
  const [booking, setBooking] = useState(null);
  const [program, setProgram] = useState(null);
  const [tourist, setTourist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const b = await getBookingById(bookingId);
        if (cancelled) return;
        if (!b) {
          setError(t('bookingNotFound'));
          return;
        }
        setBooking(b);
        const [trip, user] = await Promise.all([
          getTripProgramById(b.tripProgramId),
          getUserById(b.touristId),
        ]);
        if (!cancelled) {
          setProgram(trip);
          setTourist(user);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || t('bookingNotFound'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [bookingId, t]);

  if (loading) {
    return (
      <section className="mx-auto max-w-lg px-5 py-10">
        <LoadingBlock label={t('loadingConfirmation')} />
      </section>
    );
  }

  if (error || !booking) {
    return (
      <section className="mx-auto max-w-lg px-5 py-10">
        <ErrorBanner message={error || t('notFound')} />
        <Link to="/trips" className="mt-4 inline-block font-semibold text-primary">
          {t('browseTripPrograms')}
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-lg px-5 py-12">
      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-8 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {t('bookingReceived')}
        </p>
        <h1 className="font-headline mb-3 text-3xl font-bold">{t('almostSet')}</h1>
        <p className="mb-6 text-on-surface-variant">
          {t('confirmationNote')}{' '}
          <span className="font-semibold text-primary">{t(statusLabelKey(booking.status))}</span>
        </p>

        <dl className="space-y-3 border-t border-outline-variant/30 pt-5">
          <div className="grid grid-cols-[7rem_1fr] gap-2 text-sm">
            <dt className="text-on-surface-variant">{t('bookingId')}</dt>
            <dd className="font-dossier break-all">{booking.id}</dd>
          </div>
          <div className="grid grid-cols-[7rem_1fr] gap-2 text-sm">
            <dt className="text-on-surface-variant">{t('trip')}</dt>
            <dd>
              {program ? (
                <Link to={`/trips/${program.id}`} className="font-semibold text-primary">
                  {program.title}
                </Link>
              ) : (
                booking.tripProgramId
              )}
            </dd>
          </div>
          <div className="grid grid-cols-[7rem_1fr] gap-2 text-sm">
            <dt className="text-on-surface-variant">{t('date')}</dt>
            <dd className="font-dossier">{booking.date}</dd>
          </div>
          <div className="grid grid-cols-[7rem_1fr] gap-2 text-sm">
            <dt className="text-on-surface-variant">{t('people')}</dt>
            <dd className="font-dossier">{booking.numPeople}</dd>
          </div>
          <div className="grid grid-cols-[7rem_1fr] gap-2 text-sm">
            <dt className="text-on-surface-variant">{t('price')}</dt>
            <dd className="font-dossier">
              {program ? `${program.price} ${t('mad')}` : '—'}{' '}
              <span className="font-body text-on-surface-variant">{t('simulated')}</span>
            </dd>
          </div>
          <div className="grid grid-cols-[7rem_1fr] gap-2 text-sm">
            <dt className="text-on-surface-variant">{t('bookedBy')}</dt>
            <dd>{tourist?.name || tourist?.email || booking.touristId}</dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link to="/trips" className="font-semibold text-primary">
            {t('browseMoreTrips')}
          </Link>
          <Link to="/discover" className="font-semibold text-on-surface-variant">
            {t('backDiscover')}
          </Link>
        </div>
      </div>
    </section>
  );
}

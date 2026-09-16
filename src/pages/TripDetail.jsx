import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import MapView from '../components/MapView';
import ReviewsPanel from '../components/ReviewsPanel';
import { ErrorBanner, LoadingBlock } from '../components/Feedback';
import IconButton from '../components/IconButton';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import {
  createBooking,
  getPois,
  getRemainingCapacity,
  getTripProgramById,
  getUserById,
} from '../services/firestore';

/**
 * Trip Detail — hero + timeline itinerary + booking sidebar.
 */
export default function TripDetail() {
  const { tripId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { t, daysLabel } = useLang();
  const navigate = useNavigate();

  const [program, setProgram] = useState(null);
  const [guide, setGuide] = useState(null);
  const [pois, setPois] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [date, setDate] = useState('');
  const [numPeople, setNumPeople] = useState(2);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState(null);
  const [capacity, setCapacity] = useState(null);

  const today = new Date().toISOString().slice(0, 10);

  const bookableDates = useMemo(() => {
    if (!program?.availableDates) return [];
    return program.availableDates.filter((d) => d >= today).sort();
  }, [program, today]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [trip, poiList] = await Promise.all([
          getTripProgramById(tripId),
          getPois(),
        ]);
        if (cancelled) return;
        if (!trip) {
          setError(t('tripNotFound'));
          setProgram(null);
          return;
        }
        setProgram(trip);
        setPois(poiList);
        const future = (trip.availableDates || []).filter((d) => d >= today).sort();
        if (future.length) setDate(future[0]);
        else setDate('');
        if (trip.guideId) {
          // Guide profile read may fail (rules) or not exist for demo trips.
          const g = await getUserById(trip.guideId).catch(() => null);
          if (!cancelled) setGuide(g || (trip.guideName ? { name: trip.guideName } : null));
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || t('loadTripFail'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [tripId, today, t]);

  useEffect(() => {
    let cancelled = false;
    async function loadCap() {
      if (!program?.id || !date) {
        setCapacity(null);
        return;
      }
      try {
        const cap = await getRemainingCapacity(program.id, date);
        if (!cancelled) setCapacity(cap);
      } catch {
        if (!cancelled) setCapacity(null);
      }
    }
    loadCap();
    return () => {
      cancelled = true;
    };
  }, [program?.id, date]);

  const poiById = useMemo(() => {
    const map = new Map();
    for (const p of pois) map.set(p.id, p);
    return map;
  }, [pois]);

  const routeStops = useMemo(() => {
    if (!program?.days) return [];
    const stops = [];
    for (const day of program.days) {
      for (const id of day.poiIds || []) {
        const poi = poiById.get(id);
        if (poi) stops.push(poi);
      }
    }
    return stops;
  }, [program, poiById]);

  const coverImage = useMemo(() => {
    if (program?.coverImage) return program.coverImage;
    for (const stop of routeStops) {
      const img = stop.images?.find(Boolean);
      if (img) return img;
    }
    return null;
  }, [program, routeStops]);

  async function handleBook(e) {
    e.preventDefault();
    setBookError(null);
    if (!user) {
      navigate(`/auth?redirect=/trips/${tripId}`);
      return;
    }
    setBooking(true);
    try {
      const bookingId = await createBooking({
        tripProgramId: program.id,
        touristId: user.uid,
        date,
        numPeople: Number(numPeople),
      });
      navigate(`/bookings/${bookingId}`);
    } catch (err) {
      setBookError(err?.message || t('bookingFailed'));
    } finally {
      setBooking(false);
    }
  }

  if (loading || authLoading) {
    return (
      <section className="mx-auto max-w-[1280px] px-5 py-10">
        <LoadingBlock label={t('loadingTrip')} />
      </section>
    );
  }

  if (error || !program) {
    return (
      <section className="mx-auto max-w-[1280px] px-5 py-10">
        <Link to="/trips" className="mb-4 inline-block font-semibold text-primary">
          {t('allTripPrograms')}
        </Link>
        <ErrorBanner message={error || t('notFound')} />
      </section>
    );
  }

  return (
    <div className="bg-background pb-12">
      {/* Hero */}
      <header className="relative isolate min-h-[42vh] overflow-hidden bg-primary md:min-h-[48vh]">
        {coverImage ? (
          <img
            src={coverImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/55 to-primary/25" />

        <div className="relative mx-auto flex max-w-[1280px] flex-col justify-end px-5 pb-10 pt-24 md:px-16 md:pb-14 md:pt-28">
          <Link
            to="/trips"
            className="mb-4 inline-flex w-fit text-sm font-semibold text-white/85 hover:text-white"
          >
            {t('allTripPrograms')}
          </Link>
          <h1 className="font-headline max-w-3xl text-4xl font-bold tracking-tight text-white md:text-6xl">
            {program.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-white/90 md:text-lg">
            {program.description}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-lg bg-primary-container px-3 py-1.5 font-dossier text-sm font-bold text-on-primary-container">
              {program.price} {t('mad')}
            </span>
            <span className="rounded-lg bg-white/15 px-3 py-1.5 font-dossier text-sm text-white backdrop-blur-sm">
              {daysLabel(program.days?.length || 0)}
            </span>
            <span className="rounded-lg bg-white/15 px-3 py-1.5 font-dossier text-sm text-white backdrop-blur-sm">
              {t('maxGroup', { n: program.maxGroupSize })}
            </span>
            <span className="text-sm text-white/85">
              {t('guide')}:{' '}
              <strong className="text-white">
                {guide?.name || t('guideUnavailable')}
              </strong>
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-10 md:px-16 lg:grid-cols-[1.45fr_0.85fr]">
        <div>
          <h2 className="font-headline mb-6 text-2xl font-semibold text-primary">
            {t('itinerary')}
          </h2>
          <ol className="relative space-y-0 border-s-2 border-secondary/30 ms-3 ps-8">
            {(program.days || []).map((day) => (
              <li key={day.dayNumber} className="relative pb-8 last:pb-0">
                <span className="absolute -start-[2.55rem] flex h-8 w-8 items-center justify-center rounded-full bg-primary font-dossier text-sm font-bold text-on-primary">
                  {day.dayNumber}
                </span>
                <div className="rounded-2xl border border-outline-variant/25 bg-surface p-5 shadow-sm">
                  <h3 className="font-headline mb-3 text-lg font-semibold">
                    {t('dayN', { n: day.dayNumber })}
                  </h3>
                  <ul className="space-y-3">
                    {(day.poiIds || []).map((id) => {
                      const poi = poiById.get(id);
                      const thumb = poi?.images?.find(Boolean);
                      return (
                        <li key={id} className="flex items-center gap-3">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt=""
                              className="h-12 w-12 shrink-0 rounded-lg object-cover"
                            />
                          ) : (
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container-high">
                              <span className="material-symbols-outlined text-primary/50">
                                place
                              </span>
                            </span>
                          )}
                          <div className="min-w-0">
                            {poi ? (
                              <Link
                                to={`/poi/${id}`}
                                className="font-semibold text-primary hover:underline"
                              >
                                {poi.name}
                              </Link>
                            ) : (
                              <span>{id}</span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  {day.notes && (
                    <p className="mt-3 border-t border-outline-variant/20 pt-3 text-sm text-on-surface-variant">
                      {day.notes}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <h2 className="font-headline mb-3 mt-10 text-2xl font-semibold text-primary">
            {t('routeMap')}
          </h2>
          {routeStops.length === 0 ? (
            <p className="text-on-surface-variant">{t('noPoisOnTrip')}</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-outline-variant/25 shadow-sm">
              <MapView
                pois={routeStops}
                routeStops={routeStops}
                drawRoute
                height="340px"
              />
            </div>
          )}

          <ReviewsPanel targetType="trip" targetId={program.id} />
        </div>

        <aside className="h-fit lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-2xl border border-outline-variant/25 bg-surface shadow-lg">
            <div className="bg-primary px-6 py-4">
              <p className="font-dossier text-2xl font-bold text-white">
                {program.price} {t('mad')}
              </p>
              <p className="text-sm text-white/75">{t('perBooking')}</p>
            </div>
            <div className="p-6">
              <h2 className="font-headline mb-1 text-xl font-semibold">{t('bookNow')}</h2>
              <p className="mb-5 text-sm text-on-surface-variant">{t('bookSimNote')}</p>
              {bookableDates.length === 0 ? (
                <p className="rounded-xl bg-surface-container-high px-4 py-3 text-sm text-on-surface-variant">
                  {t('noUpcomingDates')}
                </p>
              ) : (
                <form onSubmit={handleBook} className="space-y-4">
                  <label className="block text-sm font-semibold">
                    {t('date')}
                    <select
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="mt-1 w-full rounded-xl border border-outline-variant/40 bg-background px-3 py-2.5 font-dossier text-sm font-normal"
                    >
                      <option value="" disabled>
                        {t('selectDate')}
                      </option>
                      {bookableDates.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </label>
                  {capacity && (
                    <p className="font-dossier text-sm text-secondary">
                      {t('seatsLeft', {
                        remaining: capacity.remaining,
                        max: capacity.max,
                      })}
                    </p>
                  )}
                  <label className="block text-sm font-semibold">
                    {t('numPeople')}
                    <input
                      type="number"
                      min={1}
                      max={capacity?.remaining || program.maxGroupSize || 20}
                      value={numPeople}
                      onChange={(e) => setNumPeople(e.target.value)}
                      required
                      className="mt-1 w-full rounded-xl border border-outline-variant/40 bg-background px-3 py-2.5 font-dossier text-sm font-normal"
                    />
                  </label>
                  {bookError && <p className="text-sm text-error">{bookError}</p>}
                  <IconButton
                    type="submit"
                    icon="event"
                    label={
                      capacity?.remaining < 1
                        ? t('fullyBooked')
                        : user
                          ? t('confirmBooking')
                          : t('signInToBook')
                    }
                    showLabel
                    variant="primary"
                    size="lg"
                    className="w-full rounded-full bg-tertiary text-on-tertiary shadow-md hover:brightness-110 hover:bg-tertiary hover:text-on-tertiary"
                    disabled={booking || (capacity && capacity.remaining < 1)}
                  >
                    {booking
                      ? t('booking')
                      : capacity?.remaining < 1
                        ? t('fullyBooked')
                        : user
                          ? t('confirmBooking')
                          : t('signInToBook')}
                  </IconButton>
                </form>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

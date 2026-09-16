import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { ErrorBanner, LoadingBlock } from '../components/Feedback';
import IconButton from '../components/IconButton';
import { SAMPLE_TRIP_COVERS } from '../data/sampleMedia';
import {
  createTripProgram,
  getBookingsForGuide,
  getPois,
  getQuoteRequestsForGuides,
  getTripProgramsByGuide,
  updateBookingStatus,
  updateTripProgram,
} from '../services/firestore';
import { statusLabelKey } from '../i18n/strings';

function emptyDay(n) {
  return { dayNumber: n, poiIds: [], notes: '' };
}

function isActiveBooking(b) {
  return b.status === 'pending' || b.status === 'confirmed';
}

const fieldClass =
  'mt-1 w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2.5 font-body text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined text-[20px] text-primary">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-headline text-2xl font-bold tabular-nums md:text-3xl">{value}</p>
    </div>
  );
}

/**
 * Guide Dashboard — create programs + manage bookings (editorial travel UI).
 */
export default function GuideDashboard() {
  const { user, profile, loading: authLoading, isGuide } = useAuth();
  const { t } = useLang();

  const [pois, setPois] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [tab, setTab] = useState('programs');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(500);
  const [maxGroupSize, setMaxGroupSize] = useState(8);
  const [coverImage, setCoverImage] = useState('');
  const [days, setDays] = useState([emptyDay(1), emptyDay(2)]);
  const [availableDates, setAvailableDates] = useState([]);
  const [dateDraft, setDateDraft] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  /** Seats used on the same program+date (pending + confirmed). */
  const seatsByKey = useMemo(() => {
    const map = new Map();
    for (const b of bookings) {
      if (!isActiveBooking(b)) continue;
      const key = `${b.tripProgramId}|${b.date}`;
      map.set(key, (map.get(key) || 0) + (Number(b.numPeople) || 0));
    }
    return map;
  }, [bookings]);

  const programById = useMemo(() => {
    const map = new Map();
    for (const p of programs) map.set(p.id, p);
    return map;
  }, [programs]);

  const stats = useMemo(() => {
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
    return {
      programs: programs.length,
      pending,
      confirmed,
      quotes: quotes.length,
    };
  }, [programs, bookings, quotes]);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [poiList, progList, bookingList, quoteList] = await Promise.all([
        getPois(),
        getTripProgramsByGuide(user.uid),
        getBookingsForGuide(user.uid),
        getQuoteRequestsForGuides().catch(() => []),
      ]);
      setPois(poiList);
      setPrograms(progList);
      setBookings(bookingList);
      setQuotes(quoteList);
    } catch (err) {
      setError(err?.message || t('loadDashFail'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user && isGuide) {
      refresh();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, user, isGuide, refresh]);

  function setDayCount(count) {
    const n = Math.max(1, Math.min(7, Number(count) || 1));
    setDays((prev) => {
      const next = [];
      for (let i = 1; i <= n; i += 1) {
        next.push(prev[i - 1] ? { ...prev[i - 1], dayNumber: i } : emptyDay(i));
      }
      return next;
    });
  }

  function togglePoi(dayIndex, poiId) {
    setDays((prev) =>
      prev.map((day, i) => {
        if (i !== dayIndex) return day;
        const has = day.poiIds.includes(poiId);
        return {
          ...day,
          poiIds: has ? day.poiIds.filter((id) => id !== poiId) : [...day.poiIds, poiId],
        };
      })
    );
  }

  function addDate() {
    if (!dateDraft) return;
    if (dateDraft < today) {
      setError(t('dateInPast'));
      return;
    }
    if (!availableDates.includes(dateDraft)) {
      setAvailableDates((prev) => [...prev, dateDraft].sort());
    }
    setDateDraft('');
  }

  function resetForm() {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setPrice(500);
    setMaxGroupSize(8);
    setCoverImage('');
    setDays([emptyDay(1), emptyDay(2)]);
    setAvailableDates([]);
  }

  function startEdit(program) {
    setEditingId(program.id);
    setTitle(program.title || '');
    setDescription(program.description || '');
    setPrice(program.price ?? 500);
    setMaxGroupSize(program.maxGroupSize ?? 8);
    setCoverImage(program.coverImage || '');
    setDays(
      Array.isArray(program.days) && program.days.length
        ? program.days.map((d, i) => ({
            dayNumber: d.dayNumber || d.day || i + 1,
            poiIds: d.poiIds || [],
            notes: d.notes || '',
          }))
        : [emptyDay(1)]
    );
    setAvailableDates(Array.isArray(program.availableDates) ? [...program.availableDates] : []);
    setTab('programs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    if (!days.some((d) => d.poiIds.length > 0)) {
      setError(t('selectAtLeastOnePlace'));
      return;
    }
    if (!availableDates.length) {
      setError(t('addAtLeastOneDate'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        guideId: user.uid,
        title,
        description,
        price,
        days,
        availableDates,
        maxGroupSize,
        coverImage: coverImage.trim(),
      };
      if (editingId) {
        await updateTripProgram(editingId, payload);
        setSuccess(t('tripProgramUpdated'));
      } else {
        await createTripProgram(payload);
        setSuccess(t('tripProgramCreated'));
      }
      resetForm();
      await refresh();
    } catch (err) {
      setError(err?.message || t('saveProgramFail'));
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(bookingId, status) {
    try {
      await updateBookingStatus(bookingId, status);
      await refresh();
    } catch (err) {
      setError(err?.message || t('updateBookingFail'));
    }
  }

  if (authLoading || (user && isGuide && loading)) {
    return (
      <section className="mx-auto max-w-[1280px] px-5 py-10">
        <LoadingBlock label={t('loadingGuideDash')} />
      </section>
    );
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-lg px-5 py-12">
        <h1 className="font-headline mb-3 text-3xl font-bold">{t('guideDesk')}</h1>
        <p className="mb-4 text-on-surface-variant">{t('guideNeedAuth')}</p>
        <Link
          to="/auth?redirect=/guide"
          className="inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary"
        >
          {t('signIn')}
        </Link>
      </section>
    );
  }

  if (!isGuide) {
    const pendingGuide =
      profile?.role === 'guide' &&
      ['pending_docs', 'pending_review', 'pending'].includes(profile?.partnerStatus);
    return (
      <section className="mx-auto max-w-lg px-5 py-12">
        <h1 className="font-headline mb-3 text-3xl font-bold">{t('guideDesk')}</h1>
        {pendingGuide ? (
          <>
            <p className="mb-4 text-on-surface-variant">{t('partnerWaitingReview')}</p>
            <Link
              to="/partner"
              className="mb-4 inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary"
            >
              {t('partnerCompleteProfile')}
            </Link>
          </>
        ) : (
          <>
            <p className="mb-2 text-on-surface-variant">
              {t('yourRoleIs')} <strong>{profile?.role || t('roleTourist')}</strong>.
            </p>
            <p className="mb-4 text-on-surface-variant">{t('guideNeedApply')}</p>
            <Link
              to="/partner"
              className="mb-4 inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary"
            >
              {t('applyAsGuide')}
            </Link>
          </>
        )}
        <p>
          <Link to="/trips" className="font-semibold text-primary">
            {t('browseAsTourist')}
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1280px] px-5 py-8 md:px-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {t('guideDesk')}
          </p>
          <h1 className="font-headline mb-2 text-3xl font-bold md:text-5xl">{t('guideDeskTitle')}</h1>
          <p className="text-on-surface-variant">
            {t('signedInAs', { name: profile?.name || user.email })}
          </p>
        </div>
        <Link to="/trips" className="text-sm font-semibold text-primary hover:underline">
          {t('browseAsTourist')}
        </Link>
      </header>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon="map" label={t('dashStatPrograms')} value={stats.programs} />
        <StatCard icon="pending_actions" label={t('dashStatPendingBookings')} value={stats.pending} />
        <StatCard icon="event_available" label={t('dashStatConfirmed')} value={stats.confirmed} />
        <StatCard icon="request_quote" label={t('aiQuotes')} value={stats.quotes} />
      </div>

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} onRetry={refresh} />
        </div>
      )}
      {success && (
        <p className="mb-4 rounded-xl border border-secondary/20 bg-secondary-container px-4 py-3 text-sm text-on-secondary-container">
          {success}
        </p>
      )}

      <div
        role="tablist"
        className="mb-6 flex gap-1 rounded-2xl border border-outline-variant/20 bg-surface-container p-1"
      >
        {[
          { id: 'programs', label: t('dashTabPrograms'), icon: 'route' },
          {
            id: 'bookings',
            label: t('dashTabBookings'),
            icon: 'confirmation_number',
            badge: stats.pending,
          },
          { id: 'quotes', label: t('aiQuotes'), icon: 'smart_toy' },
        ].map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
              {item.badge > 0 ? (
                <span className="rounded-md bg-tertiary px-1.5 py-0.5 font-dossier text-[10px] text-on-tertiary">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === 'programs' && (
      <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        <form
          onSubmit={handleCreate}
          className="space-y-5 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm md:p-8"
        >
          <h2 className="font-headline text-2xl font-semibold">
            {editingId ? t('editProgram') : t('createProgram')}
          </h2>

          <label className="block text-sm font-semibold">
            {t('title')}
            <input
              className={fieldClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>

          <label className="block text-sm font-semibold">
            {t('description')}
            <textarea
              className={fieldClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </label>

          <div className="rounded-xl border border-outline-variant/25 bg-surface p-4">
            <label className="block text-sm font-semibold">
              {t('tripCoverImage')}
              <input
                className={fieldClass}
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="/samples/trips/…"
              />
            </label>
            {coverImage ? (
              <div className="mt-3 h-36 overflow-hidden rounded-xl bg-surface-container-high">
                <img src={coverImage} alt="" className="h-full w-full object-cover" />
              </div>
            ) : null}
            <p className="mb-1.5 mt-3 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
              {t('samplePhotos')}
            </p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_TRIP_COVERS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  title={sample.label}
                  onClick={() => setCoverImage(sample.url)}
                  className={`h-14 w-20 overflow-hidden rounded-lg border-2 transition ${
                    coverImage === sample.url
                      ? 'border-primary'
                      : 'border-transparent opacity-85 hover:opacity-100'
                  }`}
                >
                  <img src={sample.url} alt={sample.label} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm font-semibold">
              {t('priceMad')}
              <input
                type="number"
                min={0}
                className={`${fieldClass} font-dossier`}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm font-semibold">
              {t('maxGroupLabel')}
              <input
                type="number"
                min={1}
                max={50}
                className={`${fieldClass} font-dossier`}
                value={maxGroupSize}
                onChange={(e) => setMaxGroupSize(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm font-semibold">
              {t('days')}
              <input
                type="number"
                min={1}
                max={7}
                className={`${fieldClass} font-dossier`}
                value={days.length}
                onChange={(e) => setDayCount(e.target.value)}
              />
            </label>
          </div>

          {days.map((day, dayIndex) => (
            <fieldset
              key={day.dayNumber}
              className="rounded-xl border border-outline-variant/30 bg-surface p-4"
            >
              <legend className="px-1 font-headline text-lg font-semibold">
                {t('dayN', { n: day.dayNumber })}
              </legend>
              <div className="mt-2 max-h-44 space-y-2 overflow-y-auto">
                {pois.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">{t('noPoisSeedGuide')}</p>
                ) : (
                  pois.map((poi) => (
                    <label key={poi.id} className="flex items-start gap-2 text-sm font-normal">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={day.poiIds.includes(poi.id)}
                        onChange={() => togglePoi(dayIndex, poi.id)}
                      />
                      <span>
                        {poi.name}{' '}
                        <em className="not-italic text-on-surface-variant">({poi.category})</em>
                      </span>
                    </label>
                  ))
                )}
              </div>
              <label className="mt-3 block text-sm font-semibold">
                {t('notes')}
                <input
                  className={fieldClass}
                  value={day.notes}
                  onChange={(e) =>
                    setDays((prev) =>
                      prev.map((d, i) =>
                        i === dayIndex ? { ...d, notes: e.target.value } : d
                      )
                    )
                  }
                />
              </label>
            </fieldset>
          ))}

          <fieldset className="rounded-xl border border-outline-variant/30 bg-surface p-4">
            <legend className="px-1 font-headline text-lg font-semibold">{t('availableDates')}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              <input
                type="date"
                min={today}
                className={`${fieldClass} max-w-[12rem] font-dossier`}
                value={dateDraft}
                onChange={(e) => setDateDraft(e.target.value)}
              />
              <IconButton
                icon="add"
                label={t('addDate')}
                showLabel
                variant="secondary"
                onClick={addDate}
              />
            </div>
            {availableDates.length === 0 ? (
              <p className="mt-2 text-sm text-on-surface-variant">{t('noDatesYet')}</p>
            ) : (
              <ul className="mt-3 space-y-1">
                {availableDates.map((d) => (
                  <li key={d} className="flex items-center gap-2 text-sm">
                    <span className="font-dossier">{d}</span>
                    <IconButton
                      icon="delete"
                      label={t('remove')}
                      variant="bare"
                      size="sm"
                      onClick={() =>
                        setAvailableDates((prev) => prev.filter((x) => x !== d))
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          <div className="flex flex-wrap gap-3">
            <IconButton
              type="submit"
              icon="save"
              label={editingId ? t('saveChanges') : t('publishProgram')}
              showLabel
              variant="primary"
              size="lg"
              disabled={saving}
            >
              {saving
                ? t('saving')
                : editingId
                  ? t('saveChanges')
                  : t('publishProgram')}
            </IconButton>
            {editingId && (
              <IconButton
                icon="close"
                label={t('cancelEdit')}
                variant="ghost"
                size="lg"
                onClick={resetForm}
              />
            )}
          </div>
        </form>

        <div className="space-y-6">
          <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
            <h2 className="font-headline mb-4 text-xl font-semibold">
              {t('yourPrograms')}{' '}
              <span className="font-dossier text-base text-on-surface-variant">
                ({programs.length})
              </span>
            </h2>
            {programs.length === 0 ? (
              <p className="text-sm text-on-surface-variant">{t('noProgramsYet')}</p>
            ) : (
              <ul className="space-y-4">
                {programs.map((p) => (
                  <li
                    key={p.id}
                    className="flex gap-3 border-b border-outline-variant/20 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-container-high">
                      {p.coverImage ? (
                        <img src={p.coverImage} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-outline">
                          <span className="material-symbols-outlined">image</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link to={`/trips/${p.id}`} className="font-semibold text-primary">
                        {p.title}
                      </Link>
                      <p className="mt-1 font-dossier text-sm text-on-surface-variant">
                        {p.price} {t('mad')} · {p.days?.length || 0}d ·{' '}
                        {t('maxGroup', { n: p.maxGroupSize })}
                      </p>
                      <IconButton
                        icon="edit"
                        label={t('editProgramLink')}
                        variant="bare"
                        size="sm"
                        className="mt-1"
                        onClick={() => startEdit(p)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
      )}

      {tab === 'bookings' && (
          <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
            <h2 className="font-headline mb-4 text-xl font-semibold">
              {t('incomingBookings')}{' '}
              <span className="font-dossier text-base text-on-surface-variant">
                ({bookings.length})
              </span>
            </h2>
            {bookings.length === 0 ? (
              <p className="text-sm text-on-surface-variant">{t('noBookingsGuide')}</p>
            ) : (
              <ul className="grid gap-4 md:grid-cols-2">
                {bookings.map((b) => {
                  const prog = programById.get(b.tripProgramId);
                  const max = prog?.maxGroupSize || 0;
                  const used = seatsByKey.get(`${b.tripProgramId}|${b.date}`) || 0;
                  return (
                    <li
                      key={b.id}
                      className="rounded-xl border border-outline-variant/20 bg-surface p-4"
                    >
                      <strong>{b.tripTitle || prog?.title || b.tripProgramId}</strong>
                      <p className="mt-1 font-dossier text-sm text-on-surface-variant">
                        {b.date} · {b.numPeople} {t('pax')} ·{' '}
                        <span className="font-body font-semibold text-primary">
                          {t(statusLabelKey(b.status))}
                        </span>
                      </p>
                      {isActiveBooking(b) && max > 0 && (
                        <p className="mt-1 font-dossier text-xs text-secondary">
                          {t('seatsUsed', { used, max })}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {b.status === 'pending' && (
                          <>
                            <IconButton
                              icon="check_circle"
                              label={t('confirm')}
                              variant="secondary"
                              size="sm"
                              onClick={() => handleStatus(b.id, 'confirmed')}
                            />
                            <IconButton
                              icon="cancel"
                              label={t('cancel')}
                              variant="danger"
                              size="sm"
                              onClick={() => handleStatus(b.id, 'cancelled')}
                            />
                          </>
                        )}
                        <Link
                          to={`/bookings/${b.id}`}
                          className="text-xs font-semibold text-primary"
                        >
                          {t('view')}
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
      )}

      {tab === 'quotes' && (
          <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
            <h2 className="font-headline mb-4 text-xl font-semibold">
              {t('aiQuotes')}{' '}
              <span className="font-dossier text-base text-on-surface-variant">
                ({quotes.length})
              </span>
            </h2>
            {quotes.length === 0 ? (
              <p className="text-sm text-on-surface-variant">{t('noQuotes')}</p>
            ) : (
              <ul className="space-y-3">
                {quotes.slice(0, 12).map((q) => (
                  <li key={q.id} className="rounded-xl border border-outline-variant/15 bg-surface px-4 py-3 text-sm">
                    <p className="font-semibold">
                      {(q.days || []).length} {t('dayPlan')} ·{' '}
                      {(q.preferences?.interests || []).join(', ') || t('general')}
                    </p>
                    <p className="font-dossier text-xs text-on-surface-variant">
                      {q.createdAt?.slice?.(0, 10) || '—'}
                      {q.note ? ` · ${q.note}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
      )}
    </section>
  );
}

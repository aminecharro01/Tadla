import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorBanner, LoadingBlock } from '../components/Feedback';
import IconButton from '../components/IconButton';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { categoryLabelKey, statusLabelKey } from '../i18n/strings';
import {
  adminDeleteDocument,
  adminSetUserRole,
  adminUpdateItineraryStatus,
  adminUpsertPoi,
  getAllBookings,
  getAllPartnerApplications,
  getAllReviews,
  getAllSavedItineraries,
  getArtisanListings,
  getPois,
  getTripPrograms,
  getUsers,
  reviewPartnerApplication,
  updateBookingStatus,
} from '../services/firestore';
import { seedArtisansToFirestore } from '../services/seedArtisans';
import { seedPoisToFirestore } from '../services/seed';
import { seedTripsToFirestore } from '../services/seedTrips';

const TABS = [
  'overview',
  'approvals',
  'users',
  'catalog',
  'artisans',
  'trips',
  'bookings',
  'reviews',
  'quotes',
];

const TAB_ICONS = {
  overview: 'dashboard',
  approvals: 'pending_actions',
  users: 'group',
  catalog: 'map',
  artisans: 'handyman',
  trips: 'hiking',
  bookings: 'event',
  reviews: 'star',
  quotes: 'request_quote',
};

const BOOKING_STATUS_ICONS = {
  pending: 'schedule',
  confirmed: 'check_circle',
  cancelled: 'cancel',
};

const ROLES = ['tourist', 'guide', 'artisan', 'cooperative', 'admin'];

const panelClass =
  'rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm sm:p-5';
const fieldClass =
  'mt-1 w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';
const btnGhost =
  'rounded-lg border border-outline-variant/40 px-3 py-2 text-sm font-semibold text-on-surface disabled:opacity-60';

function roleKey(role) {
  if (role === 'guide') return 'roleGuide';
  if (role === 'artisan') return 'roleArtisan';
  if (role === 'cooperative') return 'roleCooperative';
  if (role === 'admin') return 'roleAdmin';
  return 'roleTourist';
}

function emptyPoiForm() {
  return {
    id: 'poi-',
    name: '',
    category: 'nature',
    description: '',
    lat: '',
    lng: '',
    hours: '',
    imagesText: '',
  };
}

export default function AdminDashboard() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { t } = useLang();

  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [busy, setBusy] = useState(null);
  const [q, setQ] = useState('');

  const [users, setUsers] = useState([]);
  const [apps, setApps] = useState([]);
  const [pois, setPois] = useState([]);
  const [artisans, setArtisans] = useState([]);
  const [trips, setTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [poiForm, setPoiForm] = useState(emptyPoiForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        userList,
        appList,
        poiList,
        artisanList,
        tripList,
        bookingList,
        reviewList,
        itineraryList,
      ] = await Promise.all([
        getUsers(),
        getAllPartnerApplications(),
        getPois(),
        getArtisanListings(),
        getTripPrograms(),
        getAllBookings(),
        getAllReviews(),
        getAllSavedItineraries(),
      ]);
      setUsers(userList);
      setApps(appList);
      setPois(poiList);
      setArtisans(artisanList);
      setTrips(tripList);
      setBookings(bookingList);
      setReviews(reviewList);
      setQuotes(itineraryList.filter((i) => i.requestQuote || i.status === 'quote_requested'));
    } catch (err) {
      setError(err?.message || t('adminLoadFail'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!authLoading && isAdmin) load();
    else if (!authLoading) setLoading(false);
  }, [authLoading, isAdmin, load]);

  const pendingApps = useMemo(
    () => apps.filter((a) => a.status === 'pending'),
    [apps]
  );

  const stats = useMemo(
    () => [
      { key: 'users', label: t('adminStatUsers'), value: users.length, icon: 'group' },
      { key: 'approvals', label: t('adminStatPending'), value: pendingApps.length, icon: 'pending_actions' },
      { key: 'catalog', label: t('adminStatPois'), value: pois.length, icon: 'map' },
      { key: 'artisans', label: t('adminStatArtisans'), value: artisans.length, icon: 'handyman' },
      { key: 'trips', label: t('adminStatTrips'), value: trips.length, icon: 'hiking' },
      { key: 'bookings', label: t('adminStatBookings'), value: bookings.length, icon: 'event' },
      { key: 'reviews', label: t('adminStatReviews'), value: reviews.length, icon: 'star' },
      { key: 'quotes', label: t('adminStatQuotes'), value: quotes.length, icon: 'request_quote' },
    ],
    [t, users, pendingApps, pois, artisans, trips, bookings, reviews, quotes]
  );

  const needle = q.trim().toLowerCase();

  function flash(msg) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3500);
  }

  async function run(key, fn, okMsg) {
    setBusy(key);
    setError(null);
    try {
      await fn();
      await load();
      if (okMsg) flash(okMsg);
      return true;
    } catch (err) {
      setError(err?.message || t('adminActionFail'));
      return false;
    } finally {
      setBusy(null);
    }
  }

  function matches(haystack) {
    if (!needle) return true;
    return String(haystack || '').toLowerCase().includes(needle);
  }

  if (authLoading || (isAdmin && loading)) {
    return (
      <section className="mx-auto max-w-[1280px] px-5 py-10">
        <LoadingBlock />
      </section>
    );
  }

  if (!user || !isAdmin) {
    return (
      <section className="mx-auto max-w-lg px-5 py-12">
        <h1 className="font-headline mb-3 text-3xl font-bold">{t('adminDashboard')}</h1>
        <p className="text-on-surface-variant">{t('adminOnly')}</p>
        <Link to="/" className="mt-4 inline-block font-semibold text-primary">
          ← {t('home')}
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1280px] px-5 py-8 md:px-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-secondary">
            {t('adminEyebrow')}
          </p>
          <h1 className="font-headline text-3xl font-bold md:text-4xl">{t('adminDashboard')}</h1>
          <p className="mt-1 max-w-2xl text-on-surface-variant">{t('adminDashboardSub')}</p>
        </div>
        <IconButton
          icon="refresh"
          label={t('adminRefresh')}
          variant="ghost"
          disabled={!!busy}
          onClick={() => load()}
        />
      </div>

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} onRetry={load} />
        </div>
      )}
      {success && (
        <p className="mb-4 rounded-xl bg-secondary-container px-4 py-3 text-sm font-semibold text-on-secondary-container">
          {success}
        </p>
      )}

      <div
        className="mb-6 flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label={t('adminDashboard')}
      >
        {TABS.map((id) => {
          const label = t(`adminTab${id[0].toUpperCase()}${id.slice(1)}`);
          const badge =
            id === 'approvals' && pendingApps.length > 0 ? pendingApps.length : 0;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              title={badge ? `${label} (${badge})` : label}
              aria-label={badge ? `${label} (${badge})` : label}
              aria-selected={tab === id}
              onClick={() => {
                setTab(id);
                setQ('');
              }}
              className={`relative flex h-11 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-semibold transition sm:pe-4 ${
                tab === id
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">{TAB_ICONS[id]}</span>
              <span className="hidden sm:inline">{label}</span>
              {badge > 0 && (
                <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-tertiary px-1 text-[10px] font-bold text-on-tertiary sm:static sm:ms-0.5">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setTab(s.key)}
              className={`${panelClass} text-start transition hover:border-primary/40`}
            >
              <span className="material-symbols-outlined text-2xl text-primary">{s.icon}</span>
              <p className="mt-2 text-3xl font-bold tabular-nums">{s.value}</p>
              <p className="text-sm text-on-surface-variant">{s.label}</p>
            </button>
          ))}
          <div className={`${panelClass} sm:col-span-2 lg:col-span-4`}>
            <p className="font-semibold">{t('adminQuickActions')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <IconButton
                icon="cloud_upload"
                label={t('reseedPois')}
                showLabel
                variant="primary"
                disabled={!!busy}
                onClick={() =>
                  run('seed-pois', () => seedPoisToFirestore(), t('adminSeedPoisOk'))
                }
              >
                {busy === 'seed-pois' ? t('seeding') : t('reseedPois')}
              </IconButton>
              <IconButton
                icon="cloud_upload"
                label={t('seedArtisans')}
                showLabel
                variant="primary"
                disabled={!!busy}
                onClick={() =>
                  run('seed-art', () => seedArtisansToFirestore(), t('adminSeedArtisansOk'))
                }
              >
                {busy === 'seed-art' ? t('seeding') : t('seedArtisans')}
              </IconButton>
              <IconButton
                icon="cloud_upload"
                label={t('seedTrips')}
                showLabel
                variant="primary"
                disabled={!!busy}
                onClick={() =>
                  run('seed-trips', () => seedTripsToFirestore(), t('seedTripsDone', { n: 5 }))
                }
              >
                {busy === 'seed-trips' ? t('seeding') : t('seedTrips')}
              </IconButton>
              <Link to="/discover" className={`${btnGhost} inline-flex items-center`}>
                {t('exploreRegions')}
              </Link>
              <Link to="/artisans" className={`${btnGhost} inline-flex items-center`}>
                {t('artisans')}
              </Link>
            </div>
          </div>
        </div>
      )}

      {tab === 'approvals' && (
        <div className="space-y-4">
          <p className="text-on-surface-variant">{t('approvalsSubtitle')}</p>
          {pendingApps.length === 0 ? (
            <p className="text-on-surface-variant">{t('noPendingApps')}</p>
          ) : (
            pendingApps.map((a) => (
              <article key={a.id} className={panelClass}>
                <p className="font-semibold">
                  {t(roleKey(a.roleRequested))} · {a.name || a.email}
                </p>
                <p className="font-dossier text-sm text-on-surface-variant">
                  {a.city} · {a.phone} · {a.email}
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">{a.experience}</p>
                {a.documentsNote && (
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {t('docs')} {a.documentsNote}
                  </p>
                )}
                {Array.isArray(a.documentUrls) && a.documentUrls.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm">
                    <li className="font-semibold text-on-surface">{t('partnerDocsList')}</li>
                    {a.documentUrls.map((d, i) => (
                      <li key={i}>
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          {d.name || t('partnerDocFile', { n: i + 1 })}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-1 text-xs text-on-surface-variant">
                  {t(statusLabelKey(a.status))}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <IconButton
                    icon="check"
                    label={t('approve')}
                    variant="secondary"
                    disabled={busy === a.id}
                    onClick={() =>
                      run(
                        a.id,
                        () =>
                          reviewPartnerApplication(a.id, {
                            status: 'approved',
                            adminId: user.uid,
                          }),
                        t('adminApprovedOk')
                      )
                    }
                  />
                  <IconButton
                    icon="close"
                    label={t('reject')}
                    variant="danger"
                    disabled={busy === a.id}
                    onClick={() =>
                      run(
                        a.id,
                        () =>
                          reviewPartnerApplication(a.id, {
                            status: 'rejected',
                            adminId: user.uid,
                          }),
                        t('adminRejectedOk')
                      )
                    }
                  />
                </div>
              </article>
            ))
          )}
          {apps.filter((a) => a.status !== 'pending').length > 0 && (
            <div className="pt-4">
              <h2 className="mb-3 font-headline text-lg font-bold">{t('adminPastApps')}</h2>
              <ul className="space-y-2">
                {apps
                  .filter((a) => a.status !== 'pending')
                  .slice(0, 20)
                  .map((a) => (
                    <li
                      key={a.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-outline-variant/15 px-3 py-2 text-sm"
                    >
                      <span>
                        {a.name || a.email} · {t(roleKey(a.roleRequested))}
                      </span>
                      <span className="text-on-surface-variant">{a.status}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-4">
          <input
            className={fieldClass}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('adminSearchUsers')}
          />
          <ul className="space-y-2">
            {users
              .filter(
                (u) =>
                  matches(u.name) ||
                  matches(u.email) ||
                  matches(u.role) ||
                  matches(u.id)
              )
              .map((u) => (
                <li
                  key={u.id}
                  className={`${panelClass} flex flex-wrap items-center justify-between gap-3`}
                >
                  <div>
                    <p className="font-semibold">{u.name || '—'}</p>
                    <p className="text-sm text-on-surface-variant">{u.email}</p>
                    <p className="font-dossier text-xs text-on-surface-variant">{u.id}</p>
                  </div>
                  <label className="text-sm">
                    <span className="sr-only">{t('adminChangeRole')}</span>
                    <select
                      className={fieldClass}
                      value={u.role || 'tourist'}
                      disabled={busy === `role-${u.id}` || u.id === user.uid}
                      onChange={(e) => {
                        const role = e.target.value;
                        if (u.id === user.uid) return;
                        run(
                          `role-${u.id}`,
                          () => adminSetUserRole(u.id, role),
                          t('adminRoleUpdated')
                        );
                      }}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {t(roleKey(r))}
                        </option>
                      ))}
                    </select>
                  </label>
                </li>
              ))}
          </ul>
          <p className="text-xs text-on-surface-variant">{t('adminRoleSelfLock')}</p>
        </div>
      )}

      {tab === 'catalog' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <input
                className={`${fieldClass} mt-0 max-w-md flex-1`}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('adminSearchPois')}
              />
              <IconButton
                icon="cloud_upload"
                label={t('reseedPois')}
                showLabel
                variant="primary"
                disabled={!!busy}
                onClick={() =>
                  run('seed-pois', () => seedPoisToFirestore(), t('adminSeedPoisOk'))
                }
              >
                {busy === 'seed-pois' ? t('seeding') : t('reseedPois')}
              </IconButton>
            </div>
            <ul className="max-h-[70vh] space-y-2 overflow-y-auto">
              {pois
                .filter((p) => matches(p.name) || matches(p.category) || matches(p.id))
                .map((p) => (
                  <li key={p.id} className={`${panelClass} flex flex-wrap items-start justify-between gap-3`}>
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-sm text-on-surface-variant">
                        {t(categoryLabelKey(p.category))} · {p.lat}, {p.lng}
                      </p>
                      <p className="font-dossier text-xs text-on-surface-variant">{p.id}</p>
                    </div>
                    <div className="flex gap-2">
                      <IconButton
                        icon="edit"
                        label={t('edit')}
                        variant="ghost"
                        onClick={() =>
                          setPoiForm({
                            id: p.id,
                            name: p.name || '',
                            category: p.category || 'nature',
                            description: p.description || '',
                            lat: String(p.lat ?? ''),
                            lng: String(p.lng ?? ''),
                            hours: p.hours || '',
                            imagesText: Array.isArray(p.images)
                              ? p.images.filter(Boolean).join('\n')
                              : '',
                          })
                        }
                      />
                      <IconButton
                        icon="delete"
                        label={t('delete')}
                        variant="danger"
                        disabled={busy === `del-poi-${p.id}`}
                        onClick={() => {
                          if (!window.confirm(t('adminConfirmDelete'))) return;
                          run(
                            `del-poi-${p.id}`,
                            () => adminDeleteDocument('pois', p.id),
                            t('adminDeleted')
                          );
                        }}
                      />
                    </div>
                  </li>
                ))}
            </ul>
          </div>
          <form
            className={`${panelClass} h-fit space-y-3`}
            onSubmit={async (e) => {
              e.preventDefault();
              const images = String(poiForm.imagesText || '')
                .split(/[\n,]+/)
                .map((s) => s.trim())
                .filter(Boolean);
              const ok = await run(
                'save-poi',
                () => adminUpsertPoi({ ...poiForm, images }),
                t('adminPoiSaved')
              );
              if (ok) setPoiForm(emptyPoiForm());
            }}
          >
            <h2 className="font-headline text-lg font-bold">{t('adminEditPoi')}</h2>
            {['id', 'name', 'category', 'lat', 'lng', 'hours'].map((key) => (
              <label key={key} className="block text-sm font-semibold">
                {t(`adminPoi${key[0].toUpperCase()}${key.slice(1)}`)}
                <input
                  className={fieldClass}
                  value={poiForm[key]}
                  onChange={(e) => setPoiForm((f) => ({ ...f, [key]: e.target.value }))}
                  required={key !== 'hours'}
                />
              </label>
            ))}
            <label className="block text-sm font-semibold">
              {t('adminPoiDescription')}
              <textarea
                className={`${fieldClass} min-h-24`}
                value={poiForm.description}
                onChange={(e) => setPoiForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>
            <label className="block text-sm font-semibold">
              {t('adminPoiImages')}
              <textarea
                className={`${fieldClass} min-h-24 font-dossier text-xs`}
                value={poiForm.imagesText}
                placeholder={'/places/poi-ouzoud-falls/1.jpg\n/places/poi-ouzoud-falls/2.jpg'}
                onChange={(e) => setPoiForm((f) => ({ ...f, imagesText: e.target.value }))}
              />
              <span className="mt-1 block text-xs font-normal text-on-surface-variant">
                {t('adminPoiImagesHint')}
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              <IconButton
                type="submit"
                icon="save"
                label={t('save')}
                showLabel
                variant="primary"
                disabled={busy === 'save-poi'}
              />
              <IconButton
                icon="add"
                label={t('adminNewPoi')}
                variant="ghost"
                onClick={() => setPoiForm(emptyPoiForm())}
              />
            </div>
          </form>
        </div>
      )}

      {tab === 'artisans' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <input
              className={`${fieldClass} mt-0 max-w-md flex-1`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('adminSearchArtisans')}
            />
            <IconButton
              icon="cloud_upload"
              label={t('seedArtisans')}
              showLabel
              variant="primary"
              disabled={!!busy}
              onClick={() =>
                run('seed-art', () => seedArtisansToFirestore(), t('adminSeedArtisansOk'))
              }
            >
              {busy === 'seed-art' ? t('seeding') : t('seedArtisans')}
            </IconButton>
          </div>
          <ul className="space-y-2">
            {artisans
              .filter(
                (a) =>
                  matches(a.craftType) ||
                  matches(a.village) ||
                  matches(a.contactInfo?.name) ||
                  matches(a.id)
              )
              .map((a) => (
                <li
                  key={a.id}
                  className={`${panelClass} flex flex-wrap items-start justify-between gap-3`}
                >
                  <div>
                    <p className="font-semibold">
                      {a.contactInfo?.name || a.craftType} · {a.craftType}
                    </p>
                    <p className="text-sm text-on-surface-variant">{a.village}</p>
                    <p className="font-dossier text-xs text-on-surface-variant">{a.id}</p>
                  </div>
                  <IconButton
                    icon="delete"
                    label={t('delete')}
                    variant="danger"
                    disabled={busy === `del-art-${a.id}`}
                    onClick={() => {
                      if (!window.confirm(t('adminConfirmDelete'))) return;
                      run(
                        `del-art-${a.id}`,
                        () => adminDeleteDocument('artisanListings', a.id),
                        t('adminDeleted')
                      );
                    }}
                  />
                </li>
              ))}
          </ul>
        </div>
      )}

      {tab === 'trips' && (
        <ul className="space-y-2">
          {trips
            .filter((tr) => matches(tr.title) || matches(tr.guideId) || matches(tr.id))
            .map((tr) => (
              <li
                key={tr.id}
                className={`${panelClass} flex flex-wrap items-start justify-between gap-3`}
              >
                <div>
                  <p className="font-semibold">{tr.title}</p>
                  <p className="text-sm text-on-surface-variant">
                    {tr.price} MAD · {t('maxGroupLabel')} {tr.maxGroupSize}
                  </p>
                  <p className="font-dossier text-xs text-on-surface-variant">
                    guide: {tr.guideId}
                  </p>
                  <Link
                    to={`/trips/${tr.id}`}
                    className="mt-1 inline-block text-sm font-semibold text-primary"
                  >
                    {t('viewBook')}
                  </Link>
                </div>
                <IconButton
                  icon="delete"
                  label={t('delete')}
                  variant="danger"
                  disabled={busy === `del-trip-${tr.id}`}
                  onClick={() => {
                    if (!window.confirm(t('adminConfirmDelete'))) return;
                    run(
                      `del-trip-${tr.id}`,
                      () => adminDeleteDocument('tripPrograms', tr.id),
                      t('adminDeleted')
                    );
                  }}
                />
              </li>
            ))}
          {trips.length === 0 && (
            <p className="text-on-surface-variant">{t('noTripsYet')}</p>
          )}
        </ul>
      )}

      {tab === 'bookings' && (
        <div className="space-y-3">
          <input
            className={fieldClass}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('adminSearchBookings')}
          />
          <ul className="space-y-2">
            {bookings
              .filter(
                (b) =>
                  matches(b.id) ||
                  matches(b.touristId) ||
                  matches(b.tripProgramId) ||
                  matches(b.status) ||
                  matches(b.date)
              )
              .map((b) => (
                <li
                  key={b.id}
                  className={`${panelClass} flex flex-wrap items-center justify-between gap-3`}
                >
                  <div>
                    <p className="font-semibold">
                      {b.date} · {b.numPeople} {t('people')} · {t(statusLabelKey(b.status))}
                    </p>
                    <p className="font-dossier text-xs text-on-surface-variant">
                      {b.tripProgramId} · {b.touristId}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['pending', 'confirmed', 'cancelled'].map((st) => (
                      <IconButton
                        key={st}
                        icon={BOOKING_STATUS_ICONS[st]}
                        label={t(statusLabelKey(st))}
                        variant={b.status === st ? 'secondary' : 'ghost'}
                        disabled={busy === `bk-${b.id}` || b.status === st}
                        onClick={() =>
                          run(
                            `bk-${b.id}`,
                            () => updateBookingStatus(b.id, st),
                            t('adminBookingUpdated')
                          )
                        }
                      />
                    ))}
                    <IconButton
                      icon="delete"
                      label={t('delete')}
                      variant="danger"
                      disabled={busy === `del-bk-${b.id}`}
                      onClick={() => {
                        if (!window.confirm(t('adminConfirmDelete'))) return;
                        run(
                          `del-bk-${b.id}`,
                          () => adminDeleteDocument('bookings', b.id),
                          t('adminDeleted')
                        );
                      }}
                    />
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}

      {tab === 'reviews' && (
        <ul className="space-y-2">
          {reviews
            .filter(
              (r) =>
                matches(r.userName) ||
                matches(r.comment) ||
                matches(r.targetId) ||
                matches(r.targetType)
            )
            .map((r) => (
              <li
                key={r.id}
                className={`${panelClass} flex flex-wrap items-start justify-between gap-3`}
              >
                <div>
                  <p className="font-semibold">
                    {r.rating}/5 · {r.userName || '—'} · {r.targetType}/{r.targetId}
                  </p>
                  <p className="text-sm text-on-surface-variant">{r.comment || '—'}</p>
                </div>
                <IconButton
                  icon="delete"
                  label={t('delete')}
                  variant="danger"
                  disabled={busy === `del-rv-${r.id}`}
                  onClick={() => {
                    if (!window.confirm(t('adminConfirmDelete'))) return;
                    run(
                      `del-rv-${r.id}`,
                      () => adminDeleteDocument('reviews', r.id),
                      t('adminDeleted')
                    );
                  }}
                />
              </li>
            ))}
          {reviews.length === 0 && (
            <p className="text-on-surface-variant">{t('adminNoReviews')}</p>
          )}
        </ul>
      )}

      {tab === 'quotes' && (
        <ul className="space-y-2">
          {quotes.map((it) => (
            <li
              key={it.id}
              className={`${panelClass} flex flex-wrap items-start justify-between gap-3`}
            >
              <div>
                <p className="font-semibold">{it.status}</p>
                <p className="text-sm text-on-surface-variant">
                  {it.note || t('adminNoNote')} · tourist {it.touristId}
                </p>
                <p className="font-dossier text-xs text-on-surface-variant">
                  {it.createdAt}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <IconButton
                  icon="done_all"
                  label={t('adminMarkHandled')}
                  variant="ghost"
                  disabled={busy === `qt-${it.id}`}
                  onClick={() =>
                    run(
                      `qt-${it.id}`,
                      () => adminUpdateItineraryStatus(it.id, 'handled'),
                      t('adminQuoteHandled')
                    )
                  }
                />
                <IconButton
                  icon="delete"
                  label={t('delete')}
                  variant="danger"
                  disabled={busy === `del-qt-${it.id}`}
                  onClick={() => {
                    if (!window.confirm(t('adminConfirmDelete'))) return;
                    run(
                      `del-qt-${it.id}`,
                      () => adminDeleteDocument('savedItineraries', it.id),
                      t('adminDeleted')
                    );
                  }}
                />
              </div>
            </li>
          ))}
          {quotes.length === 0 && (
            <p className="text-on-surface-variant">{t('adminNoQuotes')}</p>
          )}
        </ul>
      )}
    </section>
  );
}

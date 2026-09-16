import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import MapView from '../components/MapView';
import StayOffersPanel from '../components/StayOffersPanel';
import TransportPlansPanel from '../components/TransportPlansPanel';
import TripCard from '../components/TripCard';
import { ErrorBanner, LoadingBlock } from '../components/Feedback';
import IconButton from '../components/IconButton';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { categoryLabelKey } from '../i18n/strings';
import { categoryIcon } from '../utils/categoryIcons';
import {
  getSavedItinerariesForTourist,
  getTripProgramsMatchingInterests,
  saveItinerary,
} from '../services/firestore';
import { getPoisResolved } from '../services/catalog';
import { generateItinerary, canUseLiveGemini } from '../services/gemini';
import {
  buildAppleMapsDirectionsUrl,
  buildGoogleMapsDirectionsUrl,
  buildWazeNavigateUrl,
} from '../utils/navLinks';
import { buildDiningSearchUrl } from '../utils/stayOffers';
import { buildTransportPlans } from '../utils/transportPlans';
import { resolvePoiCoverUrl } from '../utils/googleMapsMedia';
import { getStreetViewPlace } from '../data/landingPanos';
import { guideQuoteMessage } from '../utils/whatsappTemplates';
import {
  clearPlannerSession,
  loadPlannerSession,
  savePlannerSession,
} from '../utils/experienceStorage';

const INTEREST_OPTIONS = ['nature', 'history', 'culture', 'family'];
const PACE_OPTIONS = [
  { value: 'relaxed', labelKey: 'paceRelaxed', hintKey: 'paceRelaxedHint', icon: 'spa' },
  { value: 'moderate', labelKey: 'paceModerate', hintKey: 'paceModerateHint', icon: 'directions_walk' },
  { value: 'packed', labelKey: 'pacePacked', hintKey: 'pacePackedHint', icon: 'sprint' },
];

/**
 * AI Itinerary Assistant — same results on landing (embedded) and /assistant.
 * @param {{ embedded?: boolean }} props
 */
export default function AiAssistant({ embedded = false }) {
  const { user, isAdmin } = useAuth();
  const { lang, t } = useLang();
  const liveAi = canUseLiveGemini(isAdmin);
  const [initialSession] = useState(loadPlannerSession);
  const [duration, setDuration] = useState(initialSession?.duration ?? 2);
  const [people, setPeople] = useState(initialSession?.people ?? 2);
  const [hasCar, setHasCar] = useState(initialSession?.hasCar ?? true);
  const [includeHiking, setIncludeHiking] = useState(
    initialSession?.includeHiking ?? false
  );
  const [interests, setInterests] = useState(initialSession?.interests ?? ['nature']);
  const [pace, setPace] = useState(initialSession?.pace ?? 'moderate');
  const [step, setStep] = useState(initialSession?.step ?? 1);

  const TOTAL_STEPS = 4;

  function buildPreferences() {
    return {
      duration: Number(duration),
      people: Math.max(1, Math.min(20, Number(people) || 1)),
      hasCar: Boolean(hasCar),
      includeHiking: Boolean(includeHiking),
      interests,
      pace,
    };
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [itinerary, setItinerary] = useState(initialSession?.itinerary ?? null);
  const [pois, setPois] = useState(initialSession?.pois ?? []);
  const [suggestedTrips, setSuggestedTrips] = useState(
    initialSession?.suggestedTrips ?? []
  );
  const [routeDay, setRouteDay] = useState(initialSession?.routeDay ?? 'all');
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [stayPlace, setStayPlace] = useState(initialSession?.stayPlace ?? null);
  const cloudRestoreTried = useRef(Boolean(initialSession?.itinerary));

  useEffect(() => {
    savePlannerSession({
      duration,
      people,
      hasCar,
      includeHiking,
      interests,
      pace,
      step,
      itinerary,
      pois,
      suggestedTrips,
      routeDay,
      stayPlace,
    });
  }, [
    duration,
    people,
    hasCar,
    includeHiking,
    interests,
    pace,
    step,
    itinerary,
    pois,
    suggestedTrips,
    routeDay,
    stayPlace,
  ]);

  /** If the device draft is empty, restore the tourist's newest Firestore-saved plan. */
  useEffect(() => {
    if (!user || itinerary || cloudRestoreTried.current) return undefined;
    cloudRestoreTried.current = true;
    let cancelled = false;

    (async () => {
      try {
        const [saved, pack] = await Promise.all([
          getSavedItinerariesForTourist(user.uid),
          getPoisResolved(),
        ]);
        if (cancelled) return;
        const latest = saved.find((row) => Array.isArray(row.days) && row.days.length);
        if (!latest) return;

        const prefs = latest.preferences || {};
        if (prefs.duration != null) setDuration(prefs.duration);
        if (prefs.people != null) setPeople(prefs.people);
        if (typeof prefs.hasCar === 'boolean') setHasCar(prefs.hasCar);
        if (typeof prefs.includeHiking === 'boolean') setIncludeHiking(prefs.includeHiking);
        if (Array.isArray(prefs.interests) && prefs.interests.length) {
          setInterests(prefs.interests);
        }
        if (prefs.pace) setPace(prefs.pace);

        const plan = { days: latest.days };
        setItinerary(plan);
        setPois(pack.pois || []);
        setStep(TOTAL_STEPS + 1);
        setRouteDay('all');
        const firstId = plan.days?.[0]?.pois?.[0];
        const firstPoi = (pack.pois || []).find((poi) => poi.id === firstId) || null;
        setStayPlace(firstPoi);
        setSaveMsg(t('restoredSavedPlan'));
      } catch {
        // Local draft remains empty; user can generate a new plan.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, itinerary, t]);

  const poiById = useMemo(() => {
    const map = new Map();
    for (const p of pois) map.set(p.id, p);
    return map;
  }, [pois]);

  const routeStops = useMemo(() => {
    if (!itinerary?.days) return [];
    const days =
      routeDay === 'all'
        ? itinerary.days
        : itinerary.days.filter((d) => d.dayNumber === routeDay);
    const stops = [];
    for (const day of days) {
      for (const id of day.pois || []) {
        const poi = poiById.get(id);
        if (!poi) continue;
        const lat = Number(poi.lat);
        const lng = Number(poi.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        stops.push({ ...poi, lat, lng, dayNumber: day.dayNumber });
      }
    }
    return stops;
  }, [itinerary, poiById, routeDay]);

  /** Hub place for stays/dining: selected stop, else first stop of day 1. */
  const hubPlace = useMemo(() => {
    if (stayPlace) return stayPlace;
    const firstId = itinerary?.days?.[0]?.pois?.[0];
    return firstId ? poiById.get(firstId) || null : null;
  }, [stayPlace, itinerary, poiById]);

  const transport = useMemo(() => {
    if (hasCar || !itinerary) return null;
    return buildTransportPlans({
      itinerary,
      poiById,
      people,
      daysCount: itinerary.days?.length || duration,
    });
  }, [hasCar, itinerary, poiById, people, duration]);

  function poiPhoto(poi) {
    return resolvePoiCoverUrl(poi, getStreetViewPlace(poi));
  }

  function toggleInterest(value) {
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value]
    );
  }

  async function handleGenerate() {
    setError(null);
    setItinerary(null);
    setSuggestedTrips([]);
    setRouteDay('all');
    setStayPlace(null);

    if (interests.length === 0) {
      setError(t('selectInterest'));
      return;
    }

    setLoading(true);
    try {
      const { pois: poiList } = await getPoisResolved();
      setPois(poiList);
      if (!poiList.length) {
        throw new Error(t('noPoisSeed'));
      }
      const preferences = buildPreferences();
      const [plan, matches] = await Promise.all([
        generateItinerary(preferences, poiList, { liveAi }),
        getTripProgramsMatchingInterests(interests, poiList).catch(() => []),
      ]);
      setItinerary(plan);
      setSuggestedTrips(matches);
      const first = plan?.days?.[0]?.pois?.[0];
      if (first) {
        const p = poiList.find((x) => x.id === first);
        if (p) setStayPlace(p);
      }
      setStep(TOTAL_STEPS + 1);
    } catch (err) {
      setError(err?.message || t('generateFail'));
    } finally {
      setLoading(false);
    }
  }

  const googleUrl = buildGoogleMapsDirectionsUrl(routeStops);
  const appleUrl = buildAppleMapsDirectionsUrl(routeStops);
  const wazeUrl = buildWazeNavigateUrl(routeStops[0]);

  async function handleSave(requestQuote) {
    if (!itinerary) return;
    if (!user) {
      setSaveMsg(t('signInToSave'));
      return;
    }
    setSaveBusy(true);
    setSaveMsg(null);
    try {
      await saveItinerary({
        touristId: user.uid,
        preferences: buildPreferences(),
        days: itinerary.days,
        requestQuote,
        note: requestQuote
          ? guideQuoteMessage(lang, {
              daysCount: itinerary.days?.length || duration,
              interests,
            })
          : '',
      });
      setSaveMsg(requestQuote ? t('savedQuote') : t('savedPlan'));
    } catch (err) {
      setSaveMsg(err?.message || t('saveFail'));
    } finally {
      setSaveBusy(false);
    }
  }

  function startOver() {
    clearPlannerSession();
    setItinerary(null);
    setStep(1);
    setSaveMsg(null);
    setStayPlace(null);
    setSuggestedTrips([]);
  }

  const stepMeta = [
    { n: 1, label: t('duration') },
    { n: 2, label: t('travelDetails') },
    { n: 3, label: t('interests') },
    { n: 4, label: t('pace') },
  ];

  const summaryChips = (
    <div className="flex flex-wrap gap-2 text-xs">
      <span className="rounded-lg bg-surface-container-high px-2.5 py-1 font-semibold text-on-surface-variant">
        {t('planSummaryPeople', { n: Math.max(1, Number(people) || 1) })}
      </span>
      <span className="rounded-lg bg-surface-container-high px-2.5 py-1 font-semibold text-on-surface-variant">
        {hasCar ? t('planSummaryCar') : t('planSummaryNoCar')}
      </span>
      <span className="rounded-lg bg-surface-container-high px-2.5 py-1 font-semibold text-on-surface-variant">
        {includeHiking ? t('planSummaryHiking') : t('planSummaryNoHiking')}
      </span>
      <span className="rounded-lg bg-surface-container-high px-2.5 py-1 font-semibold text-on-surface-variant">
        {t('exactDays')}: {duration}
      </span>
    </div>
  );

  return (
    <div
      className={
        embedded
          ? 'relative overflow-hidden rounded-[28px] border-2 border-tertiary/40 bg-surface-container-lowest shadow-lg shadow-tertiary/10'
          : 'relative min-h-[calc(100dvh-72px)] overflow-hidden'
      }
    >
      {!embedded && (
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-background via-transparent to-background" />
        </div>
      )}

      <div
        className={
          embedded
            ? `relative z-10 mx-auto flex w-full flex-col gap-6 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 ${
                itinerary ? 'max-h-[min(92vh,1100px)]' : 'max-h-[min(78vh,820px)]'
              }`
            : 'relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-10 px-5 py-10 md:px-6 md:py-14'
        }
      >
        <header className={`space-y-3 ${embedded ? 'text-start' : 'text-center'}`}>
          <span
            className={`text-xs font-semibold uppercase tracking-[0.2em] ${
              embedded ? 'text-tertiary' : 'text-primary'
            }`}
          >
            {t('intelligentDiscovery')}
          </span>
          {!embedded && (
            <>
              <h1 className="font-headline text-3xl font-bold leading-tight text-on-background md:text-5xl">
                {t('planHeadline')}
                <br />
                <span className="text-primary">{t('planHeadlineAccent')}</span>
              </h1>
              <p className="mx-auto max-w-xl text-lg text-on-surface-variant">
                {t('planSubtitle')}
              </p>
            </>
          )}
          {embedded && !itinerary && (
            <p className="text-sm text-on-surface-variant sm:text-base">{t('landingAiBody')}</p>
          )}
        </header>

        {!itinerary && (
          <>
            <div className="relative mx-auto flex w-full max-w-md items-center justify-between">
              <div className="absolute left-0 top-1/2 z-0 h-0.5 w-full -translate-y-1/2 bg-outline-variant/30" />
              <div
                className="absolute left-0 top-1/2 z-0 h-0.5 -translate-y-1/2 bg-primary transition-all duration-500"
                style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
              />
              {stepMeta.map((s) => (
                <div key={s.n} className="relative z-10 flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-4 border-background text-sm font-bold shadow-md md:h-10 md:w-10 ${
                      step >= s.n
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-highest text-on-surface-variant'
                    }`}
                  >
                    {s.n}
                  </div>
                  <span
                    className={`max-w-[4.5rem] text-center text-[10px] font-semibold leading-tight md:max-w-none md:text-xs ${
                      step >= s.n ? 'text-primary' : 'text-on-surface-variant'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            <div
              className={`flex flex-col justify-between rounded-[2rem] bg-surface-container-lowest/90 p-6 shadow-2xl shadow-primary/10 backdrop-blur-sm md:p-10 ${
                embedded ? 'min-h-[320px] shadow-tertiary/10' : 'min-h-[420px] md:p-12'
              }`}
            >
              {step === 1 && (
                <div className="flex flex-col gap-8">
                  <div>
                    <h3 className="font-headline mb-2 text-2xl font-semibold md:text-[32px]">
                      {t('howLong')}
                    </h3>
                    <p className="text-on-surface-variant">{t('chooseLength')}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {[
                      { days: 2, labelKey: 'shortTrip', range: '1–3', icon: 'calendar_today' },
                      { days: 5, labelKey: 'weeklyStay', range: '4–7', icon: 'date_range' },
                      { days: 7, labelKey: 'grandTour', range: '7', icon: 'event_repeat' },
                    ].map((opt) => (
                      <button
                        key={opt.labelKey}
                        type="button"
                        onClick={() => setDuration(opt.days)}
                        className={`flex flex-col rounded-xl border-2 bg-white p-6 text-left transition-all active:scale-95 ${
                          Number(duration) === opt.days
                            ? 'border-primary text-primary shadow-lg'
                            : 'border-outline-variant hover:border-primary'
                        }`}
                      >
                        <span className="material-symbols-outlined mb-4 text-3xl">{opt.icon}</span>
                        <span className="text-lg font-bold">{t(opt.labelKey)}</span>
                        <span className="text-xs text-on-surface-variant">{opt.range}</span>
                      </button>
                    ))}
                  </div>
                  <label className="flex items-center gap-3 text-sm text-on-surface-variant">
                    {t('exactDays')}
                    <input
                      type="number"
                      min={1}
                      max={7}
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-20 rounded-xl border border-outline-variant/40 px-3 py-2"
                    />
                  </label>
                </div>
              )}

              {step === 2 && (
                <div className="flex flex-col gap-8">
                  <div>
                    <h3 className="font-headline mb-2 text-2xl font-semibold md:text-[32px]">
                      {t('howManyPeople')}
                    </h3>
                    <p className="text-on-surface-variant">{t('travelDetailsHelp')}</p>
                  </div>
                  <div>
                    <p className="mb-3 text-sm font-semibold text-on-surface">{t('peopleCount')}</p>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setPeople(n)}
                          className={`inline-flex h-11 min-w-11 items-center justify-center rounded-xl px-3 text-sm font-bold transition-all active:scale-95 ${
                            Number(people) === n
                              ? 'bg-primary text-on-primary shadow-md'
                              : 'bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          {n === 6 ? '6+' : n}
                        </button>
                      ))}
                      <label className="ms-1 inline-flex items-center gap-2 text-sm text-on-surface-variant">
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={people}
                          onChange={(e) => setPeople(e.target.value)}
                          className="w-16 rounded-xl border border-outline-variant/40 px-2 py-2"
                          aria-label={t('peopleCount')}
                        />
                      </label>
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-semibold text-on-surface">{t('haveCar')}</p>
                    <p className="mb-3 text-xs text-on-surface-variant">{t('carHelp')}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: true, labelKey: 'yesCar', icon: 'directions_car' },
                        { value: false, labelKey: 'noCar', icon: 'directions_bus' },
                      ].map((opt) => (
                        <button
                          key={opt.labelKey}
                          type="button"
                          onClick={() => setHasCar(opt.value)}
                          className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all active:scale-95 ${
                            hasCar === opt.value
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-outline-variant bg-white'
                          }`}
                        >
                          <span className="material-symbols-outlined text-2xl">{opt.icon}</span>
                          <span className="font-bold">{t(opt.labelKey)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-semibold text-on-surface">{t('wantHiking')}</p>
                    <p className="mb-3 text-xs text-on-surface-variant">{t('hikingHelp')}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: true, labelKey: 'yesHiking', icon: 'hiking' },
                        { value: false, labelKey: 'noHiking', icon: 'park' },
                      ].map((opt) => (
                        <button
                          key={opt.labelKey}
                          type="button"
                          onClick={() => setIncludeHiking(opt.value)}
                          className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all active:scale-95 ${
                            includeHiking === opt.value
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-outline-variant bg-white'
                          }`}
                        >
                          <span className="material-symbols-outlined text-2xl">{opt.icon}</span>
                          <span className="font-bold">{t(opt.labelKey)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col gap-8">
                  <div>
                    <h3 className="font-headline mb-2 text-2xl font-semibold md:text-[32px]">
                      {t('whatDraws')}
                    </h3>
                    <p className="text-on-surface-variant">{t('pickInterests')}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {INTEREST_OPTIONS.map((opt) => {
                      const on = interests.includes(opt);
                      const label = t(categoryLabelKey(opt));
                      return (
                        <button
                          key={opt}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggleInterest(opt)}
                          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 ${
                            on
                              ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                              : 'bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[22px]">
                            {categoryIcon(opt)}
                          </span>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="flex flex-col gap-8">
                  <div>
                    <h3 className="font-headline mb-2 text-2xl font-semibold md:text-[32px]">
                      {t('whatPace')}
                    </h3>
                    <p className="text-on-surface-variant">{t('paceHelp')}</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {PACE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPace(opt.value)}
                        className={`rounded-xl border-2 p-5 text-left transition-all active:scale-95 ${
                          pace === opt.value
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-outline-variant bg-white'
                        }`}
                      >
                        <span className="material-symbols-outlined mb-2 text-2xl">{opt.icon}</span>
                        <div className="font-bold">{t(opt.labelKey)}</div>
                        <div className="text-sm text-on-surface-variant">{t(opt.hintKey)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-10 flex items-center justify-between border-t border-outline-variant/30 pt-8">
                <IconButton
                  icon="arrow_back"
                  label={t('back')}
                  variant="bare"
                  size="lg"
                  disabled={step === 1}
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                />
                {step < TOTAL_STEPS ? (
                  <IconButton
                    icon="arrow_forward"
                    label={t('continue')}
                    showLabel
                    size="lg"
                    variant={embedded ? 'tertiary' : 'primary'}
                    className="rounded-full px-8"
                    onClick={() => setStep((s) => s + 1)}
                  >
                    {t('continue')}
                  </IconButton>
                ) : (
                  <IconButton
                    icon="auto_awesome"
                    label={loading ? t('generating') : t('generateItinerary')}
                    showLabel
                    size="lg"
                    variant={embedded ? 'tertiary' : 'primary'}
                    disabled={loading}
                    className="rounded-full px-8"
                    onClick={handleGenerate}
                  >
                    {loading ? t('generating') : t('generateItinerary')}
                  </IconButton>
                )}
              </div>
            </div>
          </>
        )}

        {error && <ErrorBanner message={error} />}
        {loading && <LoadingBlock label={t('generatingGemini')} />}

        {itinerary && (
          <div className="print-day-plan space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-headline text-2xl font-semibold md:text-3xl">
                  {t('yourPlan')}
                </h2>
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-secondary">
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  {t('planKeptOnDevice')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 no-print">
                <IconButton
                  icon="print"
                  label={t('printPdf')}
                  showLabel
                  variant="ghost"
                  onClick={() => window.print()}
                />
                <IconButton
                  icon="refresh"
                  label={t('startOver')}
                  variant="soft"
                  onClick={startOver}
                />
                {embedded && (
                  <Link
                    to="/assistant"
                    className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/40 px-4 py-2 text-sm font-semibold text-primary"
                  >
                    {t('openFullPlanner')}
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  </Link>
                )}
              </div>
            </div>

            {summaryChips}

            <p className="print-only hidden text-sm text-on-surface-variant">
              Tadla · {t('yourPlan')}
            </p>

            <p className="no-print rounded-xl border border-tertiary/20 bg-tertiary-container/50 px-4 py-3 text-sm text-on-tertiary-container">
              {t('offlineTip')}
            </p>

            <div className="no-print flex flex-wrap gap-2">
              <IconButton
                icon="save"
                label={t('saveItinerary')}
                showLabel
                variant="secondary"
                disabled={saveBusy}
                onClick={() => handleSave(false)}
              />
              <IconButton
                icon="request_quote"
                label={t('requestQuote')}
                showLabel
                variant="primary"
                disabled={saveBusy}
                onClick={() => handleSave(true)}
              />
              {!user && (
                <Link
                  to="/auth?redirect=/assistant"
                  className="self-center text-sm font-semibold text-primary"
                >
                  {t('signInFirst')}
                </Link>
              )}
            </div>
            {saveMsg && (
              <p className="no-print text-sm text-on-surface-variant">{saveMsg}</p>
            )}

            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {itinerary.days.map((day) => (
                  <article
                    key={day.dayNumber}
                    className="print-day-card rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm md:p-5"
                  >
                    <h3 className="font-headline mb-3 text-xl font-semibold">
                      {t('dayN', { n: day.dayNumber })}
                    </h3>
                    <ul className="space-y-3">
                      {day.pois.map((id) => {
                        const poi = poiById.get(id);
                        const photo = poi ? poiPhoto(poi) : null;
                        const selected = stayPlace?.id === id;
                        const diningUrl = poi ? buildDiningSearchUrl(poi, lang) : null;
                        return (
                          <li
                            key={id}
                            className="flex gap-3 rounded-xl border border-outline-variant/10 bg-surface p-2.5"
                          >
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-container-high">
                              {photo ? (
                                <img
                                  src={photo}
                                  alt=""
                                  className="h-full w-full object-cover print-poi-photo"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <span className="material-symbols-outlined text-on-surface-variant/40">
                                    {poi ? categoryIcon(poi.category) : 'place'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                {poi ? (
                                  <Link
                                    className="font-semibold text-primary hover:underline"
                                    to={`/poi/${id}?from=planner`}
                                  >
                                    {poi.name}
                                  </Link>
                                ) : (
                                  <span className="font-semibold">{id}</span>
                                )}
                                {poi?.category && (
                                  <span className="inline-flex items-center gap-1 rounded-lg bg-secondary-container px-2 py-0.5 text-xs font-medium text-on-secondary-container">
                                    <span className="material-symbols-outlined text-[14px]">
                                      {categoryIcon(poi.category)}
                                    </span>
                                    {t(categoryLabelKey(poi.category))}
                                  </span>
                                )}
                              </div>
                              {poi && (
                                <div className="no-print mt-2 flex flex-wrap gap-1.5">
                                  <button
                                    type="button"
                                    title={t('planFindHotelsHint')}
                                    onClick={() => {
                                      setStayPlace(selected ? null : poi);
                                      if (!selected) {
                                        requestAnimationFrame(() => {
                                          document
                                            .getElementById('plan-stays')
                                            ?.scrollIntoView({
                                              behavior: 'smooth',
                                              block: 'nearest',
                                            });
                                        });
                                      }
                                    }}
                                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                      selected
                                        ? 'bg-primary text-on-primary'
                                        : 'bg-primary/10 text-primary'
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[16px]">
                                      hotel
                                    </span>
                                    {t('planFindHotels')}
                                  </button>
                                  {diningUrl && (
                                    <a
                                      href={diningUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title={t('planFindRestaurantsHint')}
                                      className="inline-flex items-center gap-1 rounded-lg bg-secondary/15 px-2.5 py-1 text-xs font-semibold text-secondary"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">
                                        restaurant
                                      </span>
                                      {t('planFindRestaurants')}
                                    </a>
                                  )}
                                  <a
                                    href={buildWazeNavigateUrl(poi)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={t('planNavigateHint')}
                                    className="inline-flex items-center gap-1 rounded-lg bg-[#33ccff]/25 px-2.5 py-1 text-xs font-semibold text-[#0b2a33]"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">
                                      navigation
                                    </span>
                                    {t('planNavigate')}
                                  </a>
                                </div>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    {day.notes && (
                      <p className="mt-3 text-sm text-on-surface-variant">{day.notes}</p>
                    )}
                  </article>
                ))}
              </div>

              <div className="no-print">
                <p className="mb-2 text-sm font-semibold text-on-surface">{t('planMapTitle')}</p>
                <div className="mb-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setRouteDay('all')}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                      routeDay === 'all'
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {t('fullTrip')}
                  </button>
                  {itinerary.days.map((day) => (
                    <button
                      key={day.dayNumber}
                      type="button"
                      onClick={() => setRouteDay(day.dayNumber)}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                        routeDay === day.dayNumber
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {t('dayN', { n: day.dayNumber })}
                    </button>
                  ))}
                </div>
                <div className="h-[min(55vh,420px)] min-h-[280px] overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-low">
                  <MapView
                    key={`plan-map-${itinerary.days?.length || 0}-${routeDay}-${routeStops.map((s) => s.id).join(',')}`}
                    pois={routeStops.length ? routeStops : pois.slice(0, 8)}
                    routeStops={routeStops.length ? routeStops : null}
                    drawRoute={routeStops.length > 1}
                    height="100%"
                    photoMarkers={routeStops.length === 0}
                  />
                </div>
                {routeStops.length === 0 && (
                  <p className="mt-2 text-sm text-on-surface-variant">{t('noMappable')}</p>
                )}
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                    {t('planOpenInMaps')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {googleUrl && (
                      <a
                        href={googleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#1a73e8] px-4 py-2.5 text-sm font-semibold text-white"
                      >
                        <span className="material-symbols-outlined text-[18px]">map</span>
                        {t('planRouteGoogle')}
                      </a>
                    )}
                    {appleUrl && (
                      <a
                        href={appleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#1c1c1e] px-4 py-2.5 text-sm font-semibold text-white"
                      >
                        <span className="material-symbols-outlined text-[18px]">map</span>
                        {t('planRouteApple')}
                      </a>
                    )}
                    {wazeUrl && (
                      <a
                        href={wazeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#33ccff] px-4 py-2.5 text-sm font-semibold text-[#0b2a33]"
                      >
                        <span className="material-symbols-outlined text-[18px]">navigation</span>
                        {t('planRouteWaze')}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {transport && <TransportPlansPanel transport={transport} />}

              {hubPlace && (
                <div id="plan-stays" className="no-print space-y-4">
                  <StayOffersPanel place={hubPlace} compact defaultOpen />
                  <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm">
                    <div className="mb-2 flex items-start gap-2">
                      <span className="material-symbols-outlined text-primary">restaurant</span>
                      <div>
                        <h3 className="font-headline text-lg font-semibold">
                          {t('planDiningTitle')}
                        </h3>
                        <p className="text-sm text-on-surface-variant">
                          {t('planDiningNear', { place: hubPlace.name })}
                        </p>
                      </div>
                    </div>
                    <a
                      href={buildDiningSearchUrl(hubPlace, lang)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-on-secondary"
                    >
                      {t('planDiningCta')}
                      <span className="material-symbols-outlined text-[18px]">arrow_outward</span>
                    </a>
                  </section>
                </div>
              )}
            </div>

            <aside className="no-print rounded-2xl border border-dashed border-tertiary/40 bg-tertiary-container/30 p-6">
              <div className="mb-3 flex items-start gap-2">
                <span className="material-symbols-outlined text-tertiary">tour</span>
                <div>
                  <h2 className="font-headline text-xl font-semibold">{t('bookGuideTitle')}</h2>
                  <p className="text-sm text-on-surface-variant">{t('bookGuideBody')}</p>
                </div>
              </div>
              {suggestedTrips.length === 0 ? (
                <p className="text-on-surface-variant">
                  {t('noMatchingGuides')}{' '}
                  <Link className="font-semibold text-primary" to="/trips">
                    {t('browseTripPrograms')}
                  </Link>
                </p>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {suggestedTrips.slice(0, 4).map((trip) => (
                    <TripCard key={trip.id} program={trip} pois={pois} />
                  ))}
                </div>
              )}
              <div className="mt-4">
                <IconButton
                  icon="request_quote"
                  label={t('requestQuote')}
                  showLabel
                  variant="tertiary"
                  disabled={saveBusy}
                  onClick={() => handleSave(true)}
                />
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

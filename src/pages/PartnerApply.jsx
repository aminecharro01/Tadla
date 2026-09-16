import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorBanner, LoadingBlock } from '../components/Feedback';
import IconButton from '../components/IconButton';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { statusLabelKey } from '../i18n/strings';
import {
  getPartnerApplicationsByUser,
  markPartnerDocsSubmitted,
  submitPartnerApplication,
  updatePartnerApplicationDocs,
  convertTouristToPartner,
} from '../services/firestore';
import {
  isPartnerStorageReady,
  uploadPartnerDocument,
} from '../services/partnerStorage';
import {
  isPartnerApproved,
  partnerDashboardPath,
} from '../utils/partnerRoles';

const fieldClass =
  'mt-1 w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';

const ROLE_CARDS = [
  {
    id: 'guide',
    icon: 'hiking',
    titleKey: 'roleGuide',
    bodyKey: 'partnerRoleGuideBody',
  },
  {
    id: 'artisan',
    icon: 'handyman',
    titleKey: 'roleArtisan',
    bodyKey: 'partnerRoleArtisanBody',
  },
  {
    id: 'cooperative',
    icon: 'groups',
    titleKey: 'roleCooperative',
    bodyKey: 'partnerRoleCoopBody',
  },
];

export default function PartnerApply() {
  const {
    user,
    profile,
    loading: authLoading,
    isGuide,
    isArtisan,
    isAdmin,
    registerPartner,
    refreshProfile,
  } = useAuth();
  const { t } = useLang();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState('guide');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [experience, setExperience] = useState('');
  const [phone, setPhone] = useState('');
  const [documentsNote, setDocumentsNote] = useState('');
  const [files, setFiles] = useState([]);
  const [uploaded, setUploaded] = useState([]);
  const [linkInput, setLinkInput] = useState('');
  const [links, setLinks] = useState([]);
  const [apps, setApps] = useState([]);
  const [applicationId, setApplicationId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const approved = isPartnerApproved(profile);
  const status = profile?.partnerStatus;
  const storageReady = isPartnerStorageReady();
  const openApp = useMemo(
    () =>
      apps.find((a) =>
        ['pending', 'pending_docs', 'pending_review'].includes(a.status)
      ) || null,
    [apps]
  );

  useEffect(() => {
    if (!user) return;
    getPartnerApplicationsByUser(user.uid)
      .then((list) => {
        setApps(list);
        const open = list.find((a) =>
          ['pending', 'pending_docs', 'pending_review'].includes(a.status)
        );
        if (open) {
          setApplicationId(open.id);
          setRole(open.roleRequested || 'guide');
          setUploaded(open.documentUrls || []);
          if (open.status === 'pending_review' || status === 'pending_review') {
            setStep(4);
          } else if (
            open.status === 'pending_docs' ||
            status === 'pending_docs' ||
            !open.documentUrls?.length
          ) {
            setStep(3);
          }
        } else if (approved) {
          setStep(4);
        } else if (status === 'pending_docs') {
          setStep(3);
        } else if (status === 'pending_review') {
          setStep(4);
        }
      })
      .catch(() => setApps([]));
  }, [user, status, approved]);

  useEffect(() => {
    if (profile?.name) setName(profile.name);
    if (profile?.email) setEmail(profile.email);
    if (profile?.city) setCity(profile.city);
    if (profile?.phone) setPhone(profile.phone);
    if (profile?.experience) setExperience(profile.experience);
    if (isPartnerApproved(profile) === false && profile?.role) {
      if (['guide', 'artisan', 'cooperative'].includes(profile.role)) {
        setRole(profile.role);
      }
    }
  }, [profile]);

  async function handleCreateAccount(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      if (user) {
        if (profile?.role === 'tourist') {
          await convertTouristToPartner(user.uid, {
            role,
            city,
            phone,
            experience,
            name: profile?.name || name,
          });
          await refreshProfile?.();
        }
        const id = await submitPartnerApplication({
          userId: user.uid,
          name: profile?.name || name,
          email: profile?.email || user.email || email,
          roleRequested: role,
          city,
          experience,
          phone,
          documentsNote: '',
          status: 'pending_docs',
        });
        setApplicationId(id);
        setSuccess(t('partnerAccountCreated'));
        setStep(3);
        setApps(await getPartnerApplicationsByUser(user.uid));
      } else {
        const result = await registerPartner({
          email,
          password,
          name,
          role,
          city,
          phone,
          experience,
        });
        const id = await submitPartnerApplication({
          userId: result.user.uid,
          name: result.profile.name,
          email: result.profile.email,
          roleRequested: role,
          city,
          experience,
          phone,
          status: 'pending_docs',
        });
        setApplicationId(id);
        setSuccess(t('partnerAccountCreated'));
        setStep(3);
        setApps(await getPartnerApplicationsByUser(result.user.uid));
      }
    } catch (err) {
      setError(err?.message || t('partnerRegisterFail'));
    } finally {
      setBusy(false);
    }
  }

  function handleAddLink() {
    const url = linkInput.trim();
    if (!/^https?:\/\/\S+$/i.test(url)) {
      setError(t('partnerLinkInvalid'));
      return;
    }
    setError(null);
    setLinks((prev) => [
      ...prev,
      { url, name: url.replace(/^https?:\/\//i, '').slice(0, 60), kind: 'link' },
    ]);
    setLinkInput('');
  }

  async function handleUploadDocs(e) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      if (!files.length && !uploaded.length && !links.length) {
        throw new Error(t('partnerDocsRequired'));
      }
      if (!storageReady && files.length) {
        throw new Error(t('partnerStorageMissing'));
      }

      const newDocs = [...uploaded, ...links];
      for (const file of files) {
        const doc = await uploadPartnerDocument(user.uid, file);
        newDocs.push(doc);
      }

      let appId = applicationId || openApp?.id;
      if (!appId) {
        appId = await submitPartnerApplication({
          userId: user.uid,
          name: profile?.name || name,
          email: profile?.email || user.email || '',
          roleRequested: profile?.role || role,
          city: profile?.city || city,
          experience: profile?.experience || experience,
          phone: profile?.phone || phone,
          documentsNote,
          documentUrls: newDocs,
          status: 'pending_review',
        });
        setApplicationId(appId);
      } else {
        await updatePartnerApplicationDocs(appId, {
          documentUrls: newDocs,
          documentsNote,
          status: 'pending_review',
        });
      }

      await markPartnerDocsSubmitted(user.uid, { documentUrls: newDocs });
      await refreshProfile?.();
      setUploaded(newDocs);
      setFiles([]);
      setLinks([]);
      setLinkInput('');
      setApps(await getPartnerApplicationsByUser(user.uid));
      setSuccess(t('partnerDocsSubmitted'));
      setStep(4);
    } catch (err) {
      const storageFailure = String(err?.code || '').startsWith('storage/');
      setError(
        storageFailure
          ? `${t('partnerDocsFail')} ${t('partnerDocsLinkHelp')}`
          : err?.message || t('partnerDocsFail')
      );
    } finally {
      setBusy(false);
    }
  }

  if (authLoading) {
    return (
      <section className="mx-auto max-w-lg px-5 py-10">
        <LoadingBlock />
      </section>
    );
  }

  const dashPath = partnerDashboardPath(profile?.role || role);

  return (
    <section className="mx-auto max-w-2xl px-5 py-8 md:px-10">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-tertiary">
        {t('partnerBadge')}
      </p>
      <h1 className="font-headline mb-2 text-3xl font-bold md:text-4xl">
        {t('partnerTitle')}
      </h1>
      <p className="mb-6 text-on-surface-variant">{t('partnerIntro')}</p>

      {(isGuide || isArtisan || (isAdmin && approved)) && approved && (
        <p className="mb-6 rounded-xl bg-secondary-container px-4 py-3 text-sm text-on-secondary-container">
          {t('partnerApprovedWelcome')}{' '}
          <Link to={dashPath} className="font-semibold underline">
            {t('openDashboard')}
          </Link>
        </p>
      )}

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}
      {success && (
        <p className="mb-4 rounded-xl bg-primary-container px-4 py-3 text-sm text-on-primary-container">
          {success}
        </p>
      )}

      {/* Steps indicator */}
      <ol className="mb-8 flex flex-wrap gap-2 text-xs font-semibold">
        {[
          { n: 1, label: t('partnerStepRole') },
          { n: 2, label: t('partnerStepAccount') },
          { n: 3, label: t('partnerStepDocs') },
          { n: 4, label: t('partnerStepReview') },
        ].map((s) => (
          <li
            key={s.n}
            className={`rounded-full px-3 py-1.5 ${
              step >= s.n
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            {s.n}. {s.label}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-headline text-xl font-semibold">{t('applyAs')}</h2>
          <p className="text-sm text-on-surface-variant">{t('partnerChooseRole')}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {ROLE_CARDS.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setRole(card.id)}
                className={`rounded-2xl border-2 p-4 text-left transition-all ${
                  role === card.id
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-outline-variant/30 bg-surface'
                }`}
              >
                <span className="material-symbols-outlined mb-2 text-3xl text-primary">
                  {card.icon}
                </span>
                <p className="font-bold">{t(card.titleKey)}</p>
                <p className="mt-1 text-xs text-on-surface-variant">{t(card.bodyKey)}</p>
              </button>
            ))}
          </div>
          <IconButton
            icon="arrow_forward"
            label={t('continue')}
            showLabel
            variant="primary"
            size="lg"
            className="rounded-full px-8"
            onClick={() => setStep(2)}
          >
            {t('continue')}
          </IconButton>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleCreateAccount} className="space-y-4 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
          <h2 className="font-headline text-xl font-semibold">
            {t('partnerStepAccount')}
          </h2>
          <p className="text-sm text-on-surface-variant">
            {t('partnerAccountHint', {
              role: t(
                role === 'guide'
                  ? 'roleGuide'
                  : role === 'cooperative'
                    ? 'roleCooperative'
                    : 'roleArtisan'
              ),
            })}
          </p>

          {!user && (
            <>
              <label className="block text-sm font-semibold">
                {t('fullName')}
                <input
                  className={fieldClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
              <label className="block text-sm font-semibold">
                {t('email')}
                <input
                  type="email"
                  className={fieldClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label className="block text-sm font-semibold">
                {t('password')}
                <input
                  type="password"
                  minLength={6}
                  className={fieldClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
            </>
          )}
          {user && (
            <p className="rounded-xl bg-surface-container-high px-3 py-2 text-sm">
              {t('partnerSignedInAs')} <strong>{user.email}</strong>
            </p>
          )}

          <label className="block text-sm font-semibold">
            {t('cityRegion')}
            <input className={fieldClass} value={city} onChange={(e) => setCity(e.target.value)} required />
          </label>
          <label className="block text-sm font-semibold">
            {t('phoneWhatsApp')}
            <input
              className={`${fieldClass} font-dossier`}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-semibold">
            {t('experience')}
            <textarea
              className={fieldClass}
              rows={4}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              required
            />
          </label>

          <div className="flex flex-wrap gap-3 pt-2">
            <IconButton
              icon="arrow_back"
              label={t('back')}
              variant="bare"
              onClick={() => setStep(1)}
            />
            <IconButton
              type="submit"
              icon="person_add"
              label={busy ? t('submitting') : t('partnerCreateAccount')}
              showLabel
              variant="primary"
              size="lg"
              disabled={busy}
            >
              {busy ? t('submitting') : t('partnerCreateAccount')}
            </IconButton>
          </div>
        </form>
      )}

      {step === 3 && user && (
        <form onSubmit={handleUploadDocs} className="space-y-4 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
          <h2 className="font-headline text-xl font-semibold">{t('partnerStepDocs')}</h2>
          <p className="text-sm text-on-surface-variant">{t('partnerDocsHelp')}</p>

          {storageReady && (
            <label className="block text-sm font-semibold">
              {t('partnerUploadLabel')}
              <input
                type="file"
                accept="image/*,application/pdf"
                multiple
                className={`${fieldClass} file:me-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-on-primary`}
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />
            </label>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-semibold" htmlFor="partner-doc-link">
              {t('partnerDocsLinkLabel')}
            </label>
            {!storageReady && (
              <p className="text-sm text-on-surface-variant">{t('partnerDocsLinkHelp')}</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <input
                id="partner-doc-link"
                type="url"
                inputMode="url"
                className={`${fieldClass} mt-0 flex-1`}
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLink();
                  }
                }}
                placeholder="https://drive.google.com/..."
              />
              <IconButton
                type="button"
                icon="add_link"
                label={t('partnerAddLink')}
                showLabel
                variant="ghost"
                onClick={handleAddLink}
              >
                {t('partnerAddLink')}
              </IconButton>
            </div>
          </div>

          {(uploaded.length > 0 || files.length > 0 || links.length > 0) && (
            <ul className="space-y-1 text-sm text-on-surface-variant">
              {uploaded.map((d, i) => (
                <li key={`u-${i}`}>
                  <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    {d.name || t('partnerDocFile', { n: i + 1 })}
                  </a>
                </li>
              ))}
              {links.map((d, i) => (
                <li key={`l-${i}`} className="flex items-center gap-2">
                  <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    {d.name}
                  </a>
                  <button
                    type="button"
                    className="text-xs font-semibold text-error underline"
                    onClick={() => setLinks((prev) => prev.filter((_, j) => j !== i))}
                  >
                    {t('partnerRemoveDoc')}
                  </button>
                </li>
              ))}
              {files.map((f) => (
                <li key={f.name}>{f.name}</li>
              ))}
            </ul>
          )}

          <label className="block text-sm font-semibold">
            {t('documentsNote')}
            <input
              className={fieldClass}
              value={documentsNote}
              onChange={(e) => setDocumentsNote(e.target.value)}
              placeholder={t('partnerDocsNotePlaceholder')}
            />
          </label>

          <IconButton
            type="submit"
            icon="upload_file"
            label={busy ? t('submitting') : t('partnerSubmitDocs')}
            showLabel
            variant="primary"
            size="lg"
            disabled={busy}
          >
            {busy ? t('submitting') : t('partnerSubmitDocs')}
          </IconButton>
        </form>
      )}

      {step === 4 && (
        <div className="space-y-4 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
          <h2 className="font-headline text-xl font-semibold">{t('partnerStepReview')}</h2>
          {approved ? (
            <>
              <p className="text-on-surface-variant">{t('partnerApprovedWelcome')}</p>
              <Link
                to={dashPath}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary"
              >
                {t('openDashboard')}
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </>
          ) : status === 'rejected' ? (
            <p className="text-on-surface-variant">{t('partnerRejected')}</p>
          ) : (
            <p className="text-on-surface-variant">{t('partnerWaitingReview')}</p>
          )}

          {apps.length > 0 && (
            <ul className="space-y-2 pt-2">
              {apps.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border border-outline-variant/20 bg-surface px-4 py-3 text-sm"
                >
                  <span className="font-semibold">
                    {t(
                      a.roleRequested === 'guide'
                        ? 'roleGuide'
                        : a.roleRequested === 'cooperative'
                          ? 'roleCooperative'
                          : 'roleArtisan'
                    )}
                  </span>
                  {' · '}
                  <span className="font-dossier text-primary">
                    {t(statusLabelKey(a.status))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!user && step > 1 && (
        <p className="mt-6 text-sm text-on-surface-variant">
          {t('partnerAlreadyAccount')}{' '}
          <Link to="/auth?redirect=/partner" className="font-semibold text-primary">
            {t('signInArrow')}
          </Link>
        </p>
      )}
    </section>
  );
}

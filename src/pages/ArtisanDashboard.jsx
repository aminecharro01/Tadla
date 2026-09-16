import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorBanner, LoadingBlock } from '../components/Feedback';
import IconButton from '../components/IconButton';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { SAMPLE_PRODUCT_IMAGES } from '../data/sampleMedia';
import { statusLabelKey } from '../i18n/strings';
import {
  createArtisanListing,
  getArtisanListingsByArtisan,
  getProductOrdersForArtisan,
  updateArtisanListing,
  updateProductOrderStatus,
} from '../services/firestore';
import { formatOrderOptions } from '../utils/productOrderFields';
import { parseArtisanContact } from '../utils/whatsapp';

const fieldClass =
  'mt-1 w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2.5 font-body text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';

const emptyProduct = () => ({ name: '', price: '', imageUrl: '' });

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

export default function ArtisanDashboard() {
  const { user, profile, loading: authLoading, isArtisan } = useAuth();
  const { t } = useLang();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [tab, setTab] = useState('catalog');

  const [name, setName] = useState(profile?.name || '');
  const [craftType, setCraftType] = useState('');
  const [village, setVillage] = useState('');
  const [description, setDescription] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [products, setProducts] = useState([emptyProduct()]);

  const [orders, setOrders] = useState([]);
  const [orderBusyId, setOrderBusyId] = useState(null);

  const stats = useMemo(() => {
    const productCount = listings.reduce(
      (n, l) => n + (Array.isArray(l.products) ? l.products.length : 0),
      0
    );
    const pending = orders.filter((o) => o.status === 'pending').length;
    const revenue = orders
      .filter((o) => o.status === 'confirmed' || o.status === 'delivered')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    return { listings: listings.length, products: productCount, pending, revenue };
  }, [listings, orders]);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [own, received] = await Promise.all([
        getArtisanListingsByArtisan(user.uid),
        getProductOrdersForArtisan(user.uid).catch(() => []),
      ]);
      setListings(own);
      setOrders(received);
    } catch (err) {
      setError(err?.message || t('loadArtisansFail'));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  async function handleOrderStatus(orderId, status) {
    setOrderBusyId(orderId);
    setError(null);
    try {
      await updateProductOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    } catch (err) {
      setError(err?.message || t('orderFail'));
    } finally {
      setOrderBusyId(null);
    }
  }

  useEffect(() => {
    if (!authLoading && user && isArtisan) refresh();
    else if (!authLoading) setLoading(false);
  }, [authLoading, user, isArtisan, refresh]);

  function resetForm() {
    setEditingId(null);
    setName(profile?.name || '');
    setCraftType('');
    setVillage('');
    setDescription('');
    setWhatsapp('');
    setPhotoUrl('');
    setProducts([emptyProduct()]);
  }

  function startEdit(listing) {
    const contact = parseArtisanContact(listing.contactInfo);
    setEditingId(listing.id);
    setName(contact.name || '');
    setCraftType(listing.craftType || '');
    setVillage(listing.village || '');
    setDescription(listing.description || '');
    setWhatsapp(contact.whatsapp || '');
    setPhotoUrl(contact.photoUrl || '');
    setProducts(
      Array.isArray(listing.products) && listing.products.length
        ? listing.products.map((p) => ({
            name: p.name || '',
            price: p.price != null ? String(p.price) : '',
            imageUrl: p.imageUrl || p.photoUrl || '',
          }))
        : [emptyProduct()]
    );
    setTab('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateProduct(index, field, value) {
    setProducts((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!whatsapp.replace(/\D/g, '').length) {
      setError(t('whatsappRequired'));
      return;
    }
    setSaving(true);
    try {
      const cleanProducts = products
        .filter((p) => p.name.trim())
        .map((p) => ({
          name: p.name.trim(),
          price: Number(p.price) || 0,
          imageUrl: (p.imageUrl || '').trim(),
        }));
      const payload = {
        artisanId: user.uid,
        name,
        craftType,
        village,
        description,
        whatsapp,
        photoUrl,
        products: cleanProducts,
      };
      if (editingId) {
        await updateArtisanListing(editingId, payload);
        setSuccess(t('listingUpdated'));
      } else {
        await createArtisanListing(payload);
        setSuccess(t('listingPublished'));
      }
      resetForm();
      await refresh();
    } catch (err) {
      setError(err?.message || t('saveListingFail'));
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || (user && isArtisan && loading)) {
    return (
      <section className="mx-auto max-w-[1100px] px-5 py-10">
        <LoadingBlock label={t('loadingArtisanDash')} />
      </section>
    );
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-lg px-5 py-12">
        <h1 className="font-headline mb-3 text-3xl font-bold">{t('workshop')}</h1>
        <p className="mb-4 text-on-surface-variant">{t('artisanNeedAuth')}</p>
        <Link
          to="/auth?redirect=/artisan"
          className="inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary"
        >
          {t('signIn')}
        </Link>
      </section>
    );
  }

  if (!isArtisan) {
    const pendingArtisan =
      ['artisan', 'cooperative'].includes(profile?.role) &&
      ['pending_docs', 'pending_review', 'pending'].includes(profile?.partnerStatus);
    return (
      <section className="mx-auto max-w-lg px-5 py-12">
        <h1 className="font-headline mb-3 text-3xl font-bold">{t('workshop')}</h1>
        {pendingArtisan ? (
          <>
            <p className="mb-4 text-on-surface-variant">{t('partnerWaitingReview')}</p>
            <Link
              to="/partner"
              className="inline-flex rounded-xl bg-primary px-6 py-3 font-semibold text-on-primary"
            >
              {t('partnerCompleteProfile')}
            </Link>
          </>
        ) : (
          <>
            <p className="mb-4 text-on-surface-variant">
              {t('yourRoleIs')} <strong>{profile?.role || t('roleTourist')}</strong>.{' '}
              {t('artisanNeedApply')}
            </p>
            <Link
              to="/partner"
              className="inline-flex rounded-xl bg-primary px-6 py-3 font-semibold text-on-primary"
            >
              {t('applyAsArtisan')}
            </Link>
          </>
        )}
      </section>
    );
  }

  const tabs = [
    { id: 'catalog', label: t('dashTabCatalog'), icon: 'inventory_2' },
    { id: 'orders', label: t('dashTabOrders'), icon: 'shopping_bag', badge: stats.pending },
  ];

  return (
    <section className="mx-auto max-w-[1100px] px-5 py-8 md:px-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {t('workshop')}
          </p>
          <h1 className="font-headline mb-2 text-3xl font-bold md:text-5xl">{t('workshopTitle')}</h1>
          <p className="max-w-xl text-on-surface-variant">{t('workshopHint')}</p>
        </div>
        <Link to="/artisans" className="text-sm font-semibold text-primary hover:underline">
          {t('viewDirectory')}
        </Link>
      </header>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon="storefront" label={t('dashStatListings')} value={stats.listings} />
        <StatCard icon="category" label={t('dashStatProducts')} value={stats.products} />
        <StatCard icon="pending_actions" label={t('dashStatPendingOrders')} value={stats.pending} />
        <StatCard
          icon="payments"
          label={t('dashStatRevenue')}
          value={`${stats.revenue} ${t('mad')}`}
        />
      </div>

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}
      {success && (
        <p className="mb-4 rounded-xl bg-secondary-container px-4 py-3 text-sm text-on-secondary-container">
          {success}
        </p>
      )}

      <div
        role="tablist"
        className="mb-6 flex gap-1 rounded-2xl border border-outline-variant/20 bg-surface-container p-1"
      >
        {tabs.map((item) => {
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
              {item.label}
              {item.badge > 0 ? (
                <span className="rounded-md bg-tertiary px-1.5 py-0.5 font-dossier text-[10px] text-on-tertiary">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === 'catalog' && (
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm"
          >
            <h2 className="font-headline text-xl font-semibold">
              {editingId ? t('editListing') : t('newListing')}
            </h2>
            <label className="block text-sm font-semibold">
              {t('displayName')}
              <input
                className={fieldClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                {t('craftType')}
                <input
                  className={fieldClass}
                  value={craftType}
                  onChange={(e) => setCraftType(e.target.value)}
                  required
                />
              </label>
              <label className="block text-sm font-semibold">
                {t('village')}
                <input
                  className={fieldClass}
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  required
                />
              </label>
            </div>
            <label className="block text-sm font-semibold">
              {t('description')}
              <textarea
                className={fieldClass}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                {t('whatsappLabel')}
                <input
                  className={`${fieldClass} font-dossier`}
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  required
                  placeholder="212612345678"
                />
              </label>
              <label className="block text-sm font-semibold">
                {t('photoUrl')}
                <input
                  className={fieldClass}
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="/samples/artisans/…"
                />
              </label>
            </div>

            <fieldset className="rounded-xl border border-outline-variant/30 bg-surface p-4">
              <legend className="px-1 font-headline text-lg font-semibold">{t('products')}</legend>
              <div className="mt-2 space-y-4">
                {products.map((p, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-3"
                  >
                    <div className="flex flex-wrap gap-3">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-container-high">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-outline">
                            <span className="material-symbols-outlined">image</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <input
                            className={`${fieldClass} mt-0 min-w-[10rem] flex-1`}
                            placeholder={t('itemName')}
                            value={p.name}
                            onChange={(e) => updateProduct(i, 'name', e.target.value)}
                          />
                          <input
                            type="number"
                            min={0}
                            className={`${fieldClass} mt-0 w-28 font-dossier`}
                            placeholder={t('mad')}
                            value={p.price}
                            onChange={(e) => updateProduct(i, 'price', e.target.value)}
                          />
                          <IconButton
                            icon="delete"
                            label={t('remove')}
                            variant="bare"
                            size="sm"
                            className="text-error hover:text-error"
                            onClick={() =>
                              setProducts((prev) =>
                                prev.length === 1
                                  ? [emptyProduct()]
                                  : prev.filter((_, j) => j !== i)
                              )
                            }
                          />
                        </div>
                        <label className="block text-xs font-semibold text-on-surface-variant">
                          {t('productPhotoUrl')}
                          <input
                            className={`${fieldClass} mt-0.5 text-sm`}
                            value={p.imageUrl}
                            onChange={(e) => updateProduct(i, 'imageUrl', e.target.value)}
                            placeholder="/samples/products/…"
                          />
                        </label>
                        <div>
                          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                            {t('samplePhotos')}
                          </p>
                          <div className="flex max-h-20 flex-wrap gap-1.5 overflow-y-auto">
                            {SAMPLE_PRODUCT_IMAGES.map((sample) => (
                              <button
                                key={sample.id}
                                type="button"
                                title={sample.label}
                                onClick={() => updateProduct(i, 'imageUrl', sample.url)}
                                className={`h-9 w-9 overflow-hidden rounded-md border-2 transition ${
                                  p.imageUrl === sample.url
                                    ? 'border-primary'
                                    : 'border-transparent opacity-80 hover:opacity-100'
                                }`}
                              >
                                <img
                                  src={sample.url}
                                  alt={sample.label}
                                  className="h-full w-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <IconButton
                icon="add"
                label={t('addProduct')}
                showLabel
                variant="bare"
                size="sm"
                className="mt-3"
                onClick={() => setProducts((prev) => [...prev, emptyProduct()])}
              />
            </fieldset>

            <div className="flex flex-wrap gap-3">
              <IconButton
                type="submit"
                icon="save"
                label={editingId ? t('saveChanges') : t('publishListing')}
                showLabel
                variant="primary"
                size="lg"
                disabled={saving}
              >
                {saving ? t('saving') : editingId ? t('saveChanges') : t('publishListing')}
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

          <aside className="space-y-4">
            <h2 className="font-headline text-xl font-semibold">
              {t('yourListings')}{' '}
              <span className="font-dossier text-base text-on-surface-variant">
                ({listings.length})
              </span>
            </h2>
            {listings.length === 0 ? (
              <p className="text-on-surface-variant">{t('noListingsYet')}</p>
            ) : (
              <ul className="space-y-3">
                {listings.map((l) => {
                  const contact = parseArtisanContact(l.contactInfo);
                  const thumbs = (Array.isArray(l.products) ? l.products : [])
                    .map((p) => p.imageUrl)
                    .filter(Boolean)
                    .slice(0, 4);
                  return (
                    <li
                      key={l.id}
                      className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <strong className="block truncate">
                            {contact.name || t('untitled')}
                          </strong>
                          <p className="text-sm text-on-surface-variant">
                            {l.craftType} · {l.village}
                          </p>
                          {Array.isArray(l.products) && l.products.length > 0 && (
                            <p className="mt-1 text-xs text-on-surface-variant">
                              {t('productsCount', { n: l.products.length })}
                            </p>
                          )}
                        </div>
                        <IconButton
                          icon="edit"
                          label={t('edit')}
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(l)}
                        />
                      </div>
                      {thumbs.length > 0 && (
                        <div className="mt-3 flex gap-1.5">
                          {thumbs.map((src, idx) => (
                            <img
                              key={`${l.id}-${idx}`}
                              src={src}
                              alt=""
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ))}
                        </div>
                      )}
                      <Link
                        to={`/artisans/${l.id}`}
                        className="mt-3 inline-block text-xs font-semibold text-primary"
                      >
                        {t('visitStore')}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        </div>
      )}

      {tab === 'orders' && (
        <section>
          <h2 className="font-headline mb-4 text-xl font-semibold">
            {t('ordersReceived')}{' '}
            <span className="font-dossier text-base text-on-surface-variant">
              ({orders.length})
            </span>
          </h2>
          {orders.length === 0 ? (
            <p className="text-on-surface-variant">{t('noOrdersReceived')}</p>
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => {
                const busy = orderBusyId === o.id;
                return (
                  <li
                    key={o.id}
                    className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <strong>{o.productName}</strong>{' '}
                        <span className="font-dossier text-sm text-on-surface-variant">
                          × {o.quantity} · {o.total} {t('mad')}
                        </span>
                        <p className="text-sm text-on-surface-variant">
                          {o.touristName || '—'}
                          {o.createdAt ? ` · ${o.createdAt.slice(0, 10)}` : ''}
                        </p>
                        {o.note && (
                          <p className="mt-1 text-sm italic text-on-surface-variant">
                            “{o.note}”
                          </p>
                        )}
                        {o.options && Object.keys(o.options).length > 0 && (
                          <p className="mt-1 text-xs text-on-surface-variant">
                            {formatOrderOptions(o.options, t)}
                          </p>
                        )}
                      </div>
                      <span className="rounded-lg bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-container">
                        {t(statusLabelKey(o.status))}
                      </span>
                    </div>
                    {o.status === 'pending' && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleOrderStatus(o.id, 'confirmed')}
                          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-60"
                        >
                          {t('acceptOrder')}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleOrderStatus(o.id, 'declined')}
                          className="rounded-lg border border-outline-variant/40 px-4 py-2 text-sm font-semibold text-error disabled:opacity-60"
                        >
                          {t('declineOrder')}
                        </button>
                      </div>
                    )}
                    {o.status === 'confirmed' && (
                      <div className="mt-3">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleOrderStatus(o.id, 'delivered')}
                          className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary disabled:opacity-60"
                        >
                          {t('markDelivered')}
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </section>
  );
}

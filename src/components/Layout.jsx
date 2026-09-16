import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import AskTanmiyaChat from './AskTanmiyaChat';
import BrandLogo from './BrandLogo';
import IconButton from './IconButton';

const navItems = [
  { to: '/', labelKey: 'home', icon: 'home', end: true },
  { to: '/discover', labelKey: 'discover', icon: 'explore' },
  { to: '/assistant', labelKey: 'plan', icon: 'auto_awesome' },
  { to: '/ask', labelKey: 'ask', icon: 'forum' },
  { to: '/trips', labelKey: 'trips', icon: 'hiking' },
  { to: '/heritage', labelKey: 'heritageNav', icon: 'diversity_1' },
  { to: '/artisans', labelKey: 'artisans', icon: 'handyman' },
];

const mobileNav = [
  { to: '/', labelKey: 'home', icon: 'home', end: true },
  { to: '/discover', labelKey: 'discover', icon: 'explore' },
  { to: '/ask', labelKey: 'ask', icon: 'forum' },
  { to: '/assistant', labelKey: 'plan', icon: 'auto_awesome' },
  { to: '/artisans', labelKey: 'artisans', icon: 'handyman' },
  { to: '/trips', labelKey: 'trips', icon: 'hiking' },
];

/**
 * Public nav stays tourist-facing. Guide/Artisan/Admin tools live in Account menu.
 * Visual language matches design.html (surface glass + rounded-full CTAs).
 */
export default function Layout() {
  const { user, profile, loading, logout, isGuide, isArtisan, isAdmin } = useAuth();
  const { t, lang, setLang } = useLang();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const embedPromo = searchParams.get('embed') === 'promo';
  const isDiscover = location.pathname === '/discover';
  const isLanding = location.pathname === '/';
  const isAskPage = location.pathname === '/ask';
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  const guideCtaTo = isGuide ? '/guide' : '/partner';
  const guideCtaLabel = isGuide ? t('guideDesk') : t('partner');

  function closeNav() {
    setNavOpen(false);
  }

  // Clean chrome for /promo 3D mockup iframes
  if (embedPromo) {
    return (
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${isDiscover ? 'h-dvh overflow-hidden' : ''}`}>
      <nav className="fixed top-0 z-50 w-full bg-surface/80 shadow-sm shadow-primary/5 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-5 sm:py-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3 lg:gap-8">
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-on-surface transition-colors hover:bg-surface-container-high lg:hidden"
              aria-expanded={navOpen}
              aria-controls="main-nav-drawer"
              aria-label={navOpen ? t('closeMenu') : t('openMenu')}
              title={navOpen ? t('closeMenu') : t('openMenu')}
              onClick={() => {
                setMenuOpen(false);
                setNavOpen((v) => !v);
              }}
            >
              <span className="material-symbols-outlined text-[26px]">
                {navOpen ? 'close' : 'menu'}
              </span>
            </button>
            <NavLink
              to="/"
              end
              className="inline-flex min-w-0 items-center"
              aria-label="Tadla"
              onClick={closeNav}
            >
              <BrandLogo
                variant="horizontal"
                tone="light"
                size="md"
                className="min-w-0"
              />
            </NavLink>
            <div className="hidden items-center gap-1 lg:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  title={t(item.labelKey)}
                  aria-label={t(item.labelKey)}
                  className={({ isActive }) =>
                    `inline-flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span className="hidden xl:inline">{t(item.labelKey)}</span>
                </NavLink>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-4">
            <div className="flex rounded-full border border-outline-variant/30 bg-surface-container-low p-0.5 text-[10px] font-semibold sm:text-xs">
              {['en', 'fr', 'ar'].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  className={`rounded-full px-2 py-1.5 uppercase transition-colors sm:px-2.5 ${
                    lang === code
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>

            <NavLink
              to={guideCtaTo}
              title={guideCtaLabel}
              aria-label={guideCtaLabel}
              className="hidden h-10 w-10 items-center justify-center rounded-full border-2 border-primary text-primary transition-all hover:bg-primary/5 sm:inline-flex"
            >
              <span className="material-symbols-outlined text-[22px]">
                {isGuide ? 'hiking' : 'handshake'}
              </span>
            </NavLink>

            {loading ? (
              <span className="text-sm text-on-surface-variant">…</span>
            ) : user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNavOpen(false);
                    setMenuOpen((v) => !v);
                  }}
                  title={profile?.name || t('account')}
                  aria-label={profile?.name || t('account')}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-outline-variant/40 text-on-surface transition-all hover:border-primary hover:text-primary"
                >
                  <span className="material-symbols-outlined text-[22px]">person</span>
                </button>
                {menuOpen && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-40 cursor-default"
                      aria-label={t('closeMenu')}
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute end-0 z-50 mt-2 w-56 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest py-2 shadow-xl">
                      <p className="px-4 py-1 text-xs text-on-surface-variant">
                        {t(
                          profile?.role === 'guide'
                            ? 'roleGuide'
                            : profile?.role === 'artisan'
                              ? 'roleArtisan'
                              : profile?.role === 'admin'
                                ? 'roleAdmin'
                                : 'roleTourist'
                        )}
                      </p>
                      <NavLink
                        to="/bookings"
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-surface-container-high"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="material-symbols-outlined text-[18px]">event</span>
                        {t('myBookings')}
                      </NavLink>
                      <NavLink
                        to="/badges"
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-surface-container-high"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          workspace_premium
                        </span>
                        {t('myBadges')}
                      </NavLink>
                      <NavLink
                        to="/partner"
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-surface-container-high sm:hidden"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="material-symbols-outlined text-[18px]">handshake</span>
                        {t('partner')}
                      </NavLink>
                      {isGuide && (
                        <NavLink
                          to="/guide"
                          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary hover:bg-surface-container-high"
                          onClick={() => setMenuOpen(false)}
                        >
                          <span className="material-symbols-outlined text-[18px]">hiking</span>
                          {t('guideDesk')}
                        </NavLink>
                      )}
                      {isArtisan && (
                        <NavLink
                          to="/artisan"
                          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary hover:bg-surface-container-high"
                          onClick={() => setMenuOpen(false)}
                        >
                          <span className="material-symbols-outlined text-[18px]">handyman</span>
                          {t('workshop')}
                        </NavLink>
                      )}
                      {isAdmin && (
                        <NavLink
                          to="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary hover:bg-surface-container-high"
                          onClick={() => setMenuOpen(false)}
                        >
                          <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                          {t('adminDashboard')}
                        </NavLink>
                      )}
                      <IconButton
                        icon="logout"
                        label={t('signOut')}
                        showLabel
                        variant="bare"
                        className="w-full justify-start rounded-none px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-high"
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <NavLink
                to="/auth"
                title={t('signIn')}
                aria-label={t('signIn')}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-3 text-sm font-semibold text-on-primary transition-all hover:bg-primary-container hover:text-on-primary-container active:scale-95 sm:px-4"
              >
                <span className="material-symbols-outlined text-[20px]">login</span>
                <span className="hidden sm:inline">{t('signIn')}</span>
              </NavLink>
            )}
          </div>
        </div>

        {navOpen && (
          <div
            id="main-nav-drawer"
            className="border-t border-outline-variant/15 bg-surface/95 backdrop-blur-md lg:hidden"
          >
            <button
              type="button"
              className="fixed inset-0 top-[72px] z-40 bg-black/20"
              aria-label={t('closeMenu')}
              onClick={closeNav}
            />
            <div className="relative z-50 mx-auto max-w-[1280px] px-4 py-3 sm:px-5 md:px-6">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={closeNav}
                    className={({ isActive }) =>
                      `inline-flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                      }`
                    }
                  >
                    <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                    {t(item.labelKey)}
                  </NavLink>
                ))}
                <NavLink
                  to={guideCtaTo}
                  onClick={closeNav}
                  className="inline-flex items-center gap-2 rounded-xl bg-surface-container-low px-3 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-high sm:hidden"
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {isGuide ? 'hiking' : 'handshake'}
                  </span>
                  {guideCtaLabel}
                </NavLink>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main
        className={`pt-[72px] ${
          isDiscover
            ? 'h-dvh'
            : isLanding
              ? 'min-h-[calc(100dvh-72px)]'
              : 'min-h-[calc(100dvh-72px)] pb-20 md:pb-8'
        }`}
      >
        <Outlet />
      </main>

      {!isLanding && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-outline-variant/20 bg-surface/95 backdrop-blur-md md:hidden">
          <div className="flex justify-around px-2 py-2">
            {mobileNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={t(item.labelKey)}
                aria-label={t(item.labelKey)}
                className={({ isActive }) =>
                  `flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-on-surface-variant'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                <span className="max-w-full truncate">{t(item.labelKey)}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}

      {!isAskPage && !isDiscover && <AskTanmiyaChat />}
    </div>
  );
}

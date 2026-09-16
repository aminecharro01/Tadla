import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import { PromoLaptop, PromoPhone } from '../components/promo/PromoDevices';
import '../components/promo/PromoStudio.css';

/**
 * Promo cinématographique FR — timeline 2:00.
 * /promo · ?record=1 pour OBS (chrome masqué).
 */
const SCENES = [
  {
    id: 'intro',
    durationMs: 8000,
    layout: 'brand-intro',
    slogan: 'Cascades, cèdres et vallées — Béni Mellal-Khénifra vous attend',
    region: 'Béni Mellal–Khénifra',
    chips: ['Cascades', 'Cèdres', 'Vallées'],
  },
  {
    id: 'landing',
    durationMs: 11000,
    eyebrow: '01 · Accueil',
    title: 'Le tourisme intelligent de la région',
    sub: 'Carte, lieux et savoir-faire local — tout commence ici',
    layout: 'laptop',
    src: '/?embed=promo',
  },
  {
    id: 'languages',
    durationMs: 7000,
    eyebrow: '02 · Accessible à tous',
    title: 'Une expérience, trois langues',
    sub: 'Français · English · العربية — avec interface RTL',
    layout: 'languages',
  },
  {
    id: 'discover',
    durationMs: 11000,
    eyebrow: '03 · Découvrir',
    title: '45 lieux sur la carte',
    sub: 'Cascades, vallées, patrimoine — filtrez et explorez',
    layout: 'phone',
    src: '/discover?embed=promo',
  },
  {
    id: 'poi',
    durationMs: 12000,
    eyebrow: '04 · Fiche lieu',
    title: 'Chaque lieu, prêt à visiter',
    sub: 'Activités, darija, tamazight et météo locale',
    layout: 'phone',
    src: '/poi/poi-ouzoud-falls?embed=promo',
  },
  {
    id: 'heritage',
    durationMs: 9000,
    eyebrow: '05 · Patrimoine',
    title: 'Patrimoine vivant',
    sub: 'Ahidous, greniers, tbourida — liés aux lieux visités',
    layout: 'laptop',
    src: '/heritage?embed=promo',
  },
  {
    id: 'planner',
    durationMs: 13000,
    eyebrow: '06 · Intelligence artificielle',
    title: 'Planifiez avec Tadla',
    sub: 'L’IA crée un itinéraire jour par jour, avec carte et étapes',
    layout: 'laptop',
    src: '/assistant?embed=promo',
  },
  {
    id: 'ask',
    durationMs: 9000,
    eyebrow: '07 · Assistant IA',
    title: 'Demandez à Tadla',
    sub: 'Des réponses ancrées sur les lieux de la région',
    layout: 'phone',
    src: '/ask?embed=promo',
  },
  {
    id: 'artisans',
    durationMs: 10000,
    eyebrow: '08 · Artisans',
    title: 'L’annuaire des artisans',
    sub: 'Coopératives, poteries, tapis et produits du terroir',
    layout: 'laptop',
    src: '/artisans?embed=promo',
  },
  {
    id: 'store',
    durationMs: 11000,
    eyebrow: '09 · Boutique',
    title: 'Entrez dans la boutique',
    sub: 'Produits, prix et contact direct avec l’artisan',
    layout: 'laptop',
    src: '/artisans/artisan-poterie-demnate?embed=promo',
  },
  {
    id: 'trips',
    durationMs: 11000,
    eyebrow: '10 · Circuits',
    title: 'Circuits et badges',
    sub: 'Programmes guidés à réserver, souvenirs à collectionner',
    layout: 'duo',
    laptopSrc: '/trips?embed=promo',
    phoneSrc: '/badges?embed=promo',
  },
  {
    id: 'end',
    durationMs: 8000,
    layout: 'brand-end',
    title: 'Explorez. Planifiez. Soutenez le local.',
    sub: 'Béni Mellal–Khénifra',
    slogan: 'Cascades, cèdres et vallées — Béni Mellal-Khénifra vous attend',
    chips: ['Découvrir', 'Planifier', 'Vivre local'],
  },
];

function formatTime(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export default function PromoStudio() {
  const [searchParams] = useSearchParams();
  const recordMode =
    searchParams.get('record') === '1' || searchParams.get('record') === 'true';

  const totalMs = useMemo(
    () => SCENES.reduce((sum, s) => sum + s.durationMs, 0),
    []
  );

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [introReady, setIntroReady] = useState(false);
  const sceneStartedAt = useRef(performance.now());
  const elapsedBeforeScene = useRef(0);
  const localOffset = useRef(0);

  const scene = SCENES[index];

  // Force French UI inside app iframes
  useEffect(() => {
    localStorage.setItem('tanmiya_lang', 'fr');
    document.documentElement.lang = 'fr';
    document.documentElement.dir = 'ltr';
    const t = requestAnimationFrame(() => setIntroReady(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const goTo = useCallback((next) => {
    const clamped = Math.max(0, Math.min(SCENES.length - 1, next));
    let before = 0;
    for (let i = 0; i < clamped; i += 1) before += SCENES[i].durationMs;
    elapsedBeforeScene.current = before;
    localOffset.current = 0;
    sceneStartedAt.current = performance.now();
    setElapsed(before);
    setIndex(clamped);
  }, []);

  const next = useCallback(() => {
    if (index >= SCENES.length - 1) {
      setPlaying(false);
      setElapsed(totalMs);
      return;
    }
    goTo(index + 1);
  }, [goTo, index, totalMs]);

  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      if (p) {
        localOffset.current = performance.now() - sceneStartedAt.current;
      } else {
        sceneStartedAt.current = performance.now() - localOffset.current;
      }
      return !p;
    });
  }, []);

  useEffect(() => {
    if (!playing) return undefined;
    let raf;
    const tick = (now) => {
      const local = now - sceneStartedAt.current;
      const absolute = elapsedBeforeScene.current + local;
      setElapsed(Math.min(absolute, totalMs));
      if (local >= scene.durationMs) {
        if (index >= SCENES.length - 1) {
          setPlaying(false);
          setElapsed(totalMs);
          localOffset.current = scene.durationMs;
        } else {
          elapsedBeforeScene.current += scene.durationMs;
          localOffset.current = 0;
          sceneStartedAt.current = now;
          setIndex((i) => i + 1);
        }
      } else {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, index, scene.durationMs, totalMs]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'r' || e.key === 'R') {
        goTo(0);
        setPlaying(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, goTo, togglePlay]);

  const progressPct = Math.min(100, (elapsed / totalMs) * 100);
  const sceneLocal = Math.max(0, elapsed - elapsedBeforeScene.current);
  const sceneProgress = Math.min(1, sceneLocal / Math.max(1, scene.durationMs));

  return (
    <div
      className={`promo-studio${recordMode ? ' is-recording' : ''}${introReady ? ' is-ready' : ''}`}
    >
      <div className="promo-vignette" aria-hidden="true" />
      <div className="promo-beam" aria-hidden="true" />

      <div className="promo-progress" aria-hidden="true">
        <div className="promo-progress__bar" style={{ width: `${progressPct}%` }} />
      </div>

      <header className="promo-chrome-ui promo-topbar">
        <BrandLogo variant="horizontal" tone="light" size="sm" />
        <p className="promo-topbar__hint">
          Studio promo FR · {formatTime(totalMs)} · scroll manuel dans les écrans · Espace = pause · ← → · R = recommencer ·{' '}
          <Link to="/promo?record=1" className="font-semibold text-primary hover:underline">
            Mode enregistrement
          </Link>
        </p>
        <Link to="/" className="promo-btn">
          Quitter
        </Link>
      </header>

      <div className="promo-stage promo-perspective">
        {SCENES.map((s, i) => {
          const active = i === index;
          const near = Math.abs(i - index) <= 1;
          return (
            <section
              key={s.id}
              className={`promo-scene promo-scene--${s.layout}${active ? ' is-active' : ''}${i < index ? ' is-exit' : ''}${i > index ? ' is-enter' : ''}`}
              aria-hidden={!active}
              style={
                active
                  ? { '--scene-p': String(sceneProgress) }
                  : undefined
              }
            >
              {near && s.layout === 'brand-intro' && (
                <div className="promo-brand-slide promo-brand-slide--intro">
                  <div className="promo-black-fade" aria-hidden="true" />
                  <div className="promo-energy" aria-hidden="true">
                    <span className="promo-orb promo-orb--a" />
                    <span className="promo-orb promo-orb--b" />
                    <span className="promo-orb promo-orb--c" />
                    <span className="promo-ring" />
                  </div>
                  <div className="promo-logo-hero">
                    <p className="promo-kicker">Tourisme intelligent · BMK</p>
                    <BrandLogo
                      variant="horizontal"
                      tone="dark"
                      size="xl"
                      className="promo-hero-mark"
                    />
                    <p className="promo-slogan">{s.slogan}</p>
                    <div className="promo-chip-row" aria-hidden="true">
                      {(s.chips || []).map((chip) => (
                        <span key={chip} className="promo-chip">
                          {chip}
                        </span>
                      ))}
                    </div>
                    <p className="promo-ai-badge">✦ Propulsé par l’IA</p>
                  </div>
                </div>
              )}

              {near && s.layout === 'brand-end' && (
                <div className="promo-brand-slide promo-brand-slide--end">
                  <div className="promo-energy promo-energy--end" aria-hidden="true">
                    <span className="promo-orb promo-orb--a" />
                    <span className="promo-orb promo-orb--b" />
                    <span className="promo-orb promo-orb--c" />
                  </div>
                  <div className="promo-logo-hero">
                    <BrandLogo
                      variant="horizontal"
                      tone="dark"
                      size="xl"
                      className="promo-hero-mark"
                    />
                    <p className="promo-slogan promo-slogan--end">{s.slogan}</p>
                    <div className="promo-chip-row" aria-hidden="true">
                      {(s.chips || []).map((chip) => (
                        <span key={chip} className="promo-chip promo-chip--light">
                          {chip}
                        </span>
                      ))}
                    </div>
                    <p className="promo-brand-tag">{s.title}</p>
                    <p className="promo-ai-badge">✦ Propulsé par l’IA</p>
                    <p className="promo-brand-url">{s.sub}</p>
                  </div>
                </div>
              )}

              {near && s.layout === 'languages' && (
                <div className="promo-languages" aria-label="Langues prises en charge">
                  <article className="promo-language-card">
                    <span className="promo-language-code">FR</span>
                    <strong>Français</strong>
                    <p>Explorez la région</p>
                  </article>
                  <article className="promo-language-card">
                    <span className="promo-language-code">EN</span>
                    <strong>English</strong>
                    <p>Explore the region</p>
                  </article>
                  <article className="promo-language-card promo-language-card--rtl" dir="rtl">
                    <span className="promo-language-code">AR</span>
                    <strong>العربية</strong>
                    <p>اكتشفوا المنطقة</p>
                  </article>
                </div>
              )}

              {near && s.layout === 'laptop' && s.src && (
                <PromoLaptop
                  src={s.src}
                  title={s.title}
                  active={active}
                />
              )}

              {near && s.layout === 'phone' && s.src && (
                <PromoPhone
                  src={s.src}
                  title={s.title}
                  active={active}
                />
              )}

              {near && s.layout === 'duo' && (
                <div className="promo-duo">
                  <PromoLaptop
                    src={s.laptopSrc}
                    title="Circuits"
                    active={active}
                  />
                  <PromoPhone
                    src={s.phoneSrc}
                    title="Badges"
                    active={active}
                  />
                </div>
              )}

              {active && s.layout !== 'brand-intro' && s.layout !== 'brand-end' && (
                <div className="promo-copy">
                  <p className="promo-eyebrow">{s.eyebrow}</p>
                  <h1 className="promo-title">{s.title}</h1>
                  {s.sub && <p className="promo-sub">{s.sub}</p>}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <footer className="promo-chrome-ui promo-controls">
        <button type="button" className="promo-btn" onClick={prev} disabled={index === 0}>
          ←
        </button>
        <button
          type="button"
          className="promo-btn promo-btn--primary"
          onClick={togglePlay}
        >
          {playing ? 'Pause' : 'Lecture'}
        </button>
        <button
          type="button"
          className="promo-btn"
          onClick={next}
          disabled={index >= SCENES.length - 1}
        >
          →
        </button>
        <span className="promo-timer">
          {formatTime(elapsed)} / {formatTime(totalMs)}
        </span>
        <div className="promo-dots" role="tablist" aria-label="Scènes">
          {SCENES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`promo-dot${i === index ? ' is-active' : ''}`}
              aria-label={s.title || s.id}
              onClick={() => {
                goTo(i);
                setPlaying(true);
              }}
            />
          ))}
        </div>
        <button
          type="button"
          className="promo-btn"
          onClick={() => {
            goTo(0);
            setPlaying(true);
          }}
        >
          Recommencer
        </button>
      </footer>
    </div>
  );
}

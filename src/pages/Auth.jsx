import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import IconButton from '../components/IconButton';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';

export default function Auth() {
  const { login, register, loginGoogle } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirectTo = params.get('redirect') || '/';

  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'register') {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err?.message || t('authFailed'));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    try {
      await loginGoogle();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err?.message || t('googleFailed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-md px-5 py-12">
      <h1 className="font-headline mb-2 text-3xl font-bold text-on-surface">
        {mode === 'login' ? t('signIn') : t('createAccount')}
      </h1>
      <p className="mb-6 text-sm text-on-surface-variant">
        {t('authTouristNote')}{' '}
        <Link to="/partner" className="font-semibold text-primary">
          {t('partner')}
        </Link>
        .
      </p>

      <div className="mb-4 flex gap-2">
        {['login', 'register'].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-all ${
              mode === m
                ? 'bg-primary text-on-primary shadow-md'
                : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {m === 'login' ? 'login' : 'person_add'}
            </span>
            {m === 'login' ? t('signIn') : t('register')}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm"
      >
        {mode === 'register' && (
          <label className="grid gap-1 text-sm font-semibold">
            {t('name')}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-xl border border-outline-variant/40 px-3 py-2.5 font-normal"
            />
          </label>
        )}
        <label className="grid gap-1 text-sm font-semibold">
          {t('email')}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-xl border border-outline-variant/40 px-3 py-2.5 font-normal"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          {t('password')}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="rounded-xl border border-outline-variant/40 px-3 py-2.5 font-normal"
          />
        </label>
        {error && <p className="text-sm text-error">{error}</p>}
        <IconButton
          type="submit"
          icon="login"
          label={mode === 'login' ? t('signIn') : t('registerTourist')}
          showLabel
          variant="primary"
          size="lg"
          className="w-full"
          disabled={busy}
        >
          {busy
            ? t('pleaseWait')
            : mode === 'login'
              ? t('signIn')
              : t('registerTourist')}
        </IconButton>
      </form>

      <IconButton
        icon="person"
        label={t('continueGoogle')}
        showLabel
        variant="ghost"
        size="lg"
        className="mt-3 w-full"
        disabled={busy}
        onClick={handleGoogle}
      >
        {t('continueGoogle')}
      </IconButton>

      <p className="mt-6">
        <Link to="/discover" className="text-sm font-semibold text-primary">
          {t('backDiscover')}
        </Link>
      </p>
    </section>
  );
}

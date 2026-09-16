/**
 * Shared loading / error UI — styled to design system.
 */
import { useLang } from '../context/LanguageContext';
import IconButton from './IconButton';

export function LoadingBlock({ label }) {
  const { t } = useLang();
  return (
    <div
      className="flex items-center gap-3 rounded-xl bg-surface-container-low px-4 py-3 text-on-surface-variant"
      role="status"
      aria-live="polite"
    >
      <span
        className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-outline-variant border-t-primary"
        aria-hidden
      />
      <p className="m-0 text-sm">{label || t('loading')}</p>
    </div>
  );
}

export function ErrorBanner({ message, onRetry }) {
  const { t } = useLang();
  if (!message) return null;
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/20 bg-error-container px-4 py-3 text-on-error-container"
      role="alert"
    >
      <p className="m-0 text-sm">{message}</p>
      {onRetry && (
        <IconButton
          icon="refresh"
          label={t('tryAgain')}
          variant="danger"
          onClick={onRetry}
        />
      )}
    </div>
  );
}

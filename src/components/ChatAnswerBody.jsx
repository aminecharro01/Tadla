import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';

/**
 * Renders a humanized assistant reply: text, photo cards, follow-up chips.
 */
export default function ChatAnswerBody({
  text,
  media = [],
  followUps = [],
  sources = [],
  usedEmbeddings = false,
  onFollowUp,
  onNavigate,
  compact = false,
}) {
  const { t } = useLang();

  return (
    <div className="space-y-3">
      <p className="whitespace-pre-wrap leading-relaxed">{text}</p>

      {media.length > 0 && (
        <div
          className={`grid gap-2 ${compact ? 'grid-cols-1' : 'sm:grid-cols-2'}`}
        >
          {media.map((m) => (
            <Link
              key={m.id}
              to={m.href || '#'}
              onClick={onNavigate}
              className="group overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container-lowest shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {m.imageUrl ? (
                <img
                  src={m.imageUrl}
                  alt=""
                  loading="lazy"
                  className="h-28 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-20 items-center justify-center bg-surface-container-high">
                  <span className="material-symbols-outlined text-primary/40">
                    {m.type === 'artisan' ? 'handyman' : m.type === 'trip' ? 'hiking' : 'landscape'}
                  </span>
                </div>
              )}
              <div className="px-2.5 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                  {m.type === 'poi'
                    ? t('ragCardPlace')
                    : m.type === 'artisan'
                      ? t('ragCardArtisan')
                      : m.type === 'trip'
                        ? t('ragCardTrip')
                        : t('ragSources')}
                </p>
                <p className="line-clamp-2 text-xs font-semibold text-on-surface group-hover:text-primary">
                  {m.title}
                </p>
                {m.caption && (
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-on-surface-variant">
                    {m.caption}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {followUps.length > 0 && onFollowUp && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {followUps.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onFollowUp(q)}
              className="rounded-full border border-tertiary/30 bg-tertiary/5 px-2.5 py-1 text-[11px] font-semibold text-tertiary hover:bg-tertiary/10"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {sources.length > 0 && (
        <div className="border-t border-outline-variant/20 pt-2">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            {t('ragSources')}
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {sources.slice(0, 4).map((s) =>
              s.href ? (
                <li key={s.id}>
                  <Link
                    to={s.href}
                    className="inline-flex rounded-lg bg-secondary-container/60 px-2 py-0.5 text-[11px] font-semibold text-on-secondary-container hover:underline"
                    onClick={onNavigate}
                  >
                    {s.title}
                  </Link>
                </li>
              ) : (
                <li
                  key={s.id}
                  className="rounded-lg bg-surface-container-high px-2 py-0.5 text-[11px]"
                >
                  {s.title}
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Tadla brand mark — icon from /public/logo, wordmark in Fraunces.
 * SVG <img> wordmarks cannot load web fonts; text is rendered in HTML instead.
 */
const ICON = {
  light: '/logo/tadla-icon.svg',
  /** Same mark; dark surfaces tint via CSS filter when needed */
  dark: '/logo/tadla-icon.svg',
};

const ICON_HEIGHT = {
  sm: 'h-7',
  md: 'h-9',
  lg: 'h-11',
  xl: 'h-14',
};

const WORD_SIZE = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-4xl',
};

export default function BrandLogo({
  variant = 'horizontal',
  tone = 'light',
  size = 'md',
  className = '',
  alt = 'Tadla',
}) {
  const iconSrc = ICON[tone] || ICON.light;
  const iconH = ICON_HEIGHT[size] || ICON_HEIGHT.md;
  const wordSize = WORD_SIZE[size] || WORD_SIZE.md;
  const wordColor = tone === 'dark' ? 'text-[#F2E9DC]' : 'text-[#221F1C]';
  /** On dark/magenta CTAs callers often pass brightness/invert — keep icon filterable via className on wrapper. */
  const iconFilter =
    tone === 'dark' ? 'brightness-0 invert-[0.92] sepia-[0.25]' : '';

  if (variant === 'icon') {
    return (
      <img
        src={iconSrc}
        alt={alt}
        className={`${iconH} w-auto ${className}`.trim()}
        decoding="async"
      />
    );
  }

  if (variant === 'stacked') {
    return (
      <span
        className={`inline-flex flex-col items-center gap-1 ${className}`.trim()}
        role="img"
        aria-label={alt}
      >
        <img
          src={iconSrc}
          alt=""
          aria-hidden="true"
          className={`${iconH} w-auto ${iconFilter}`.trim()}
          decoding="async"
        />
        <span className={`font-logo font-semibold leading-none ${wordSize} ${wordColor}`}>
          Tadla
        </span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className}`.trim()}
      role="img"
      aria-label={alt}
    >
      <img
        src={iconSrc}
        alt=""
        aria-hidden="true"
        className={`${iconH} w-auto shrink-0 ${iconFilter}`.trim()}
        decoding="async"
      />
      <span className={`font-logo font-semibold leading-none ${wordSize} ${wordColor}`}>
        Tadla
      </span>
    </span>
  );
}

/**
 * Icon-first action control. Pass showLabel when the icon alone is ambiguous.
 */
const VARIANTS = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container shadow-sm shadow-primary/15',
  secondary: 'bg-secondary text-on-secondary hover:brightness-105',
  tertiary: 'bg-tertiary text-on-tertiary hover:brightness-110 shadow-sm shadow-tertiary/20',
  danger: 'border border-error/30 text-error hover:bg-error/5',
  ghost:
    'border border-outline-variant/40 text-on-surface hover:border-primary hover:text-primary',
  soft: 'bg-surface-container-high text-on-surface-variant hover:text-on-surface',
  bare: 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary',
};

const SIZES = {
  sm: showLabel => (showLabel ? 'h-9 gap-1.5 px-2.5 text-xs' : 'h-9 w-9'),
  md: showLabel => (showLabel ? 'h-10 gap-1.5 px-3 text-sm' : 'h-10 w-10'),
  lg: showLabel => (showLabel ? 'h-11 gap-2 px-4 text-sm' : 'h-11 w-11'),
};

export default function IconButton({
  icon,
  label,
  showLabel = false,
  variant = 'ghost',
  size = 'md',
  className = '',
  type = 'button',
  disabled = false,
  onClick,
  children,
  ...rest
}) {
  const sizeClass = SIZES[size]?.(showLabel) || SIZES.md(showLabel);
  const variantClass = VARIANTS[variant] || VARIANTS.ghost;

  return (
    <button
      type={type}
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex shrink-0 items-center justify-center rounded-xl font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${sizeClass} ${variantClass} ${className}`}
      {...rest}
    >
      <span
        className={`material-symbols-outlined leading-none ${
          size === 'sm' ? 'text-[18px]' : size === 'lg' ? 'text-[22px]' : 'text-[20px]'
        }`}
      >
        {icon}
      </span>
      {showLabel ? <span>{children || label}</span> : null}
    </button>
  );
}

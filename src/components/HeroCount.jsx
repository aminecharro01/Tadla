import { useEffect, useState } from 'react';

/**
 * Compact count-up for the landing hero panel.
 */
export default function HeroCount({ value, label, duration = 1100 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    if (target <= 0) {
      setDisplay(0);
      return undefined;
    }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return (
    <div className="flex items-baseline gap-2">
      <span className="font-headline text-3xl font-extrabold tracking-tight text-tertiary sm:text-4xl">
        {display}
      </span>
      <span className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        {label}
      </span>
    </div>
  );
}

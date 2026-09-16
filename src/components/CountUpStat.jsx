import { useEffect, useRef, useState } from 'react';

/**
 * Animated count-up when the stat enters the viewport.
 */
export default function CountUpStat({ value, label, duration = 1200 }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return undefined;
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
  }, [started, value, duration]);

  return (
    <div
      ref={ref}
      className={`flex flex-col items-center justify-center gap-2 px-4 py-8 transition-all duration-700 md:py-10 ${
        started ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <span className="font-headline text-5xl font-extrabold tracking-tight text-tertiary sm:text-6xl md:text-7xl">
        {display}
      </span>
      <span className="max-w-[12rem] text-center text-sm font-semibold uppercase tracking-wide text-on-surface-variant sm:text-base">
        {label}
      </span>
    </div>
  );
}

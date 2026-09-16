import { useLayoutEffect, useRef, useState } from 'react';

function useScaledFrame(logicalW) {
  const screenRef = useRef(null);
  const [scale, setScale] = useState(0.5);

  useLayoutEffect(() => {
    const el = screenRef.current;
    if (!el) return undefined;
    const update = () => setScale((el.clientWidth || 1) / logicalW);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [logicalW]);

  return { screenRef, scale };
}

function GlossOverlay() {
  return (
    <>
      <span className="promo-gloss" aria-hidden="true" />
      <span className="promo-screen-light" aria-hidden="true" />
      <span className="promo-rim-light" aria-hidden="true" />
    </>
  );
}

export function PromoLaptop({
  src,
  title = 'Tadla',
  className = '',
  active = false,
}) {
  const logicalW = 1440;
  const logicalH = 900;
  const { screenRef, scale } = useScaledFrame(logicalW);
  return (
    <div
      className={`promo-laptop promo-device promo-float ${active ? 'is-lit' : ''} ${className}`.trim()}
    >
      <div className="promo-laptop__lid">
        <span className="promo-laptop__camera" aria-hidden="true" />
        <div className="promo-laptop__screen" ref={screenRef}>
          <div className="promo-frame promo-frame--laptop">
            <iframe
              title={title}
              src={src}
              loading="eager"
              style={{
                width: logicalW,
                height: logicalH,
                transform: `scale(${scale})`,
              }}
            />
          </div>
          <GlossOverlay />
        </div>
      </div>
      <div className="promo-laptop__base" aria-hidden="true" />
      <div className="promo-laptop__notch" aria-hidden="true" />
      <div className="promo-device-shadow" aria-hidden="true" />
    </div>
  );
}

export function PromoPhone({
  src,
  title = 'Tadla mobile',
  className = '',
  active = false,
}) {
  const logicalW = 390;
  const logicalH = 844;
  const { screenRef, scale } = useScaledFrame(logicalW);
  return (
    <div
      className={`promo-phone promo-device promo-float promo-float-delay ${active ? 'is-lit' : ''} ${className}`.trim()}
    >
      <div className="promo-phone__body">
        <span className="promo-phone__island" aria-hidden="true" />
        <div className="promo-phone__screen" ref={screenRef}>
          <div className="promo-frame promo-frame--phone">
            <iframe
              title={title}
              src={src}
              loading="eager"
              style={{
                width: logicalW,
                height: logicalH,
                transform: `scale(${scale})`,
              }}
            />
          </div>
          <GlossOverlay />
        </div>
      </div>
      <div className="promo-device-shadow promo-device-shadow--phone" aria-hidden="true" />
    </div>
  );
}

'use client';

import { useEffect, useId, useRef, useState } from 'react';

/**
 * Liquid Glass refraction for a glass surface.
 *
 * Drop <LiquidLens /> inside any `.glass` element. In Chromium browsers it
 * builds an SVG displacement filter sized to its parent and applies it as the
 * parent's backdrop-filter, so content behind the glass bends at the rim like
 * a lens (with slight chromatic aberration). Other browsers (Safari, Firefox)
 * don't support SVG backdrop filters, and keep the regular frosted blur.
 */

let supportCache: boolean | null = null;

function supportsRefraction() {
  if (supportCache !== null) return supportCache;
  const brands = (navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } })
    .userAgentData?.brands;
  const isChromium = !!brands?.some((b) => b.brand === 'Chromium');
  const reduced =
    window.matchMedia('(prefers-reduced-transparency: reduce)').matches ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  supportCache = isChromium && !reduced;
  return supportCache;
}

/**
 * Displacement map: red encodes x-offset, green y-offset, 50% grey is "no
 * offset". Gradients run edge to edge, then a blurred neutral rounded rect
 * covers the middle, so only a bezel around the rim refracts.
 */
function displacementMap(w: number, h: number, r: number, bezel: number) {
  const inner = `x="${bezel}" y="${bezel}" width="${Math.max(w - bezel * 2, 0)}" height="${Math.max(h - bezel * 2, 0)}" rx="${Math.max(r - bezel, 0)}"`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<defs>` +
    `<linearGradient id="x" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#f00"/></linearGradient>` +
    `<linearGradient id="y" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#0f0"/></linearGradient>` +
    `<filter id="b"><feGaussianBlur stdDeviation="${bezel / 2.5}"/></filter>` +
    `</defs>` +
    `<rect width="${w}" height="${h}" fill="#000"/>` +
    `<rect width="${w}" height="${h}" rx="${r}" fill="url(#x)"/>` +
    `<rect width="${w}" height="${h}" rx="${r}" fill="url(#y)" style="mix-blend-mode:screen"/>` +
    `<rect ${inner} fill="#808080" filter="url(#b)"/>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

type Size = { w: number; h: number; r: number };

export function LiquidLens({ strength = 48 }: { strength?: number }) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  // useId can contain characters like ':' or '«»'; keep url(#id) references safe.
  const id = `lens-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [size, setSize] = useState<Size | null>(null);

  useEffect(() => {
    const surface = anchorRef.current?.parentElement;
    if (!surface || !supportsRefraction()) return;

    const measure = () => {
      const rect = surface.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (!w || !h) return;
      const radius = parseFloat(getComputedStyle(surface).borderTopLeftRadius) || 0;
      setSize((prev) =>
        prev && prev.w === w && prev.h === h ? prev : { w, h, r: Math.min(radius, h / 2, w / 2) }
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(surface);
    // A data attribute, not a class: React owns className and would wipe it.
    surface.setAttribute('data-refract', '');
    surface.style.setProperty('backdrop-filter', `url(#${id})`);

    return () => {
      observer.disconnect();
      surface.removeAttribute('data-refract');
      surface.style.removeProperty('backdrop-filter');
    };
  }, [id]);

  return (
    <span ref={anchorRef} aria-hidden="true" style={{ display: 'contents' }}>
      {size && (
        <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }} focusable="false">
          <filter
            id={id}
            x="0"
            y="0"
            width={size.w}
            height={size.h}
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={displacementMap(size.w, size.h, size.r, Math.min(18, size.h / 2.6))}
              x="0"
              y="0"
              width={size.w}
              height={size.h}
              preserveAspectRatio="none"
              result="map"
            />
            {/* Light frost so busy content stays readable */}
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="src" />
            {/* Refract each colour channel slightly differently: chromatic aberration */}
            <feDisplacementMap in="src" in2="map" scale={-strength} xChannelSelector="R" yChannelSelector="G" result="dr" />
            <feColorMatrix in="dr" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
            <feDisplacementMap in="src" in2="map" scale={-strength * 0.97} xChannelSelector="R" yChannelSelector="G" result="dg" />
            <feColorMatrix in="dg" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
            <feDisplacementMap in="src" in2="map" scale={-strength * 0.94} xChannelSelector="R" yChannelSelector="G" result="db" />
            <feColorMatrix in="db" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
            <feBlend in="r" in2="g" mode="screen" result="rg" />
            <feBlend in="rg" in2="b" mode="screen" result="rgb" />
            <feColorMatrix in="rgb" type="saturate" values="1.6" />
          </filter>
        </svg>
      )}
    </span>
  );
}

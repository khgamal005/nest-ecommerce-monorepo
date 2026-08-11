'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { SafeImage } from '@/components/media';

/** Inset + size of the image as drawn with object-fit: contain inside cw×ch. */
function getObjectFitContain(
  cw: number,
  ch: number,
  nw: number,
  nh: number
): { x: number; y: number; w: number; h: number } {
  if (cw <= 0 || ch <= 0 || nw <= 0 || nh <= 0) {
    return { x: 0, y: 0, w: 0, h: 0 };
  }
  const scale = Math.min(cw / nw, ch / nh);
  const w = nw * scale;
  const h = nh * scale;
  const x = (cw - w) / 2;
  const y = (ch - h) / 2;
  return { x, y, w, h };
}

export type CursorImageZoomProps = {
  src: string;
  alt: string;
  /** Outer preview box height */
  previewHeightClass?: string;
  /** Zoom strength vs the on-screen preview (2 = 2×) */
  zoom?: number;
  /** Zoom panel size (px) */
  lensWidth?: number;
  lensHeight?: number;
  className?: string;
};

/**
 * Hover zoom: the point under the cursor stays aligned with the center of the lens.
 * Math uses the real object-fit: contain rect so mapping stays accurate.
 */
export function CursorImageZoom({
  src,
  alt,
  previewHeightClass = 'h-[400px]',
  zoom = 2.5,
  lensWidth = 420,
  lensHeight = 420,
  className = '',
}: CursorImageZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [ready, setReady] = useState(false);
  const [box, setBox] = useState({ cw: 0, ch: 0 });
  const [hover, setHover] = useState(false);
  /** Normalized [0,1] position on the *drawn* image (inside letterbox). */
  const [n, setN] = useState({ x: 0.5, y: 0.5 });
  const [isMounted, setIsMounted] = useState(false);

  const zm = zoom;

  const syncImgDimensions = useCallback(() => {
    const el = imgRef.current;
    if (!el || el.naturalWidth < 1 || el.naturalHeight < 1) return;
    setNatural({ w: el.naturalWidth, h: el.naturalHeight });
    setReady(true);
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setReady(false);
    setNatural({ w: 0, h: 0 });
    setN({ x: 0.5, y: 0.5 });
  }, [src]);

  /** Cached images often fire `load` before React attaches `onLoad`. */
  useLayoutEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    if (el.complete && el.naturalWidth > 0) {
      syncImgDimensions();
    }
  }, [src, syncImgDimensions]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      setBox({ cw: el.clientWidth, ch: el.clientHeight });
    };

    if (isMounted) {
      measure();
      const ro = new ResizeObserver(() => {
        measure();
      });
      ro.observe(el);
      return () => ro.disconnect();
    }
    return;
  }, [isMounted]);

  const fit = useMemo(
    () => getObjectFitContain(box.cw, box.ch, natural.w, natural.h),
    [box.cw, box.ch, natural.w, natural.h]
  );

  const updatePointer = useCallback(
    (clientX: number, clientY: number) => {
      const root = containerRef.current;
      if (!root || !ready || !isMounted || fit.w <= 0 || fit.h <= 0) return;

      const r = root.getBoundingClientRect();
      const u = clientX - r.left;
      const v = clientY - r.top;

      const lx = u - fit.x;
      const ly = v - fit.y;
      if (lx < 0 || ly < 0 || lx > fit.w || ly > fit.h) return;

      setN({
        x: Math.min(1, Math.max(0, lx / fit.w)),
        y: Math.min(1, Math.max(0, ly / fit.h)),
      });
    },
    [ready, fit.x, fit.y, fit.w, fit.h, isMounted]
  );

  const onMouseMove = (e: React.MouseEvent) => {
    updatePointer(e.clientX, e.clientY);
  };

  const onMouseEnter = () => setHover(true);
  const onMouseLeave = () => setHover(false);

  // Center of lens shows (n.x, n.y) on the scaled preview → translate the magnified bitmap.
  const tx = lensWidth / 2 - n.x * fit.w * zm;
  const ty = lensHeight / 2 - n.y * fit.h * zm;

  const zoomedW = fit.w * zm;
  const zoomedH = fit.h * zm;

  // Don't render interactive elements during SSR
  if (!isMounted) {
    return (
      <div className={`w-full ${previewHeightClass} rounded-lg bg-white border border-gray-100 flex items-center justify-center`}>
        <div className="text-gray-400 text-sm">Loading zoom...</div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-row items-start gap-4 w-full ${className}`}
      style={{ direction: 'ltr' }}
    >
      <div
        ref={containerRef}
        className={`relative w-full flex-1 min-w-0 min-h-[280px] ${previewHeightClass} rounded-lg bg-white border border-gray-100 overflow-hidden`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onMouseMove={onMouseMove}
      >
        <SafeImage
          ref={imgRef}
          src={src}
          alt={alt}
          useNextImage={false}
          className="absolute inset-0 h-full w-full object-contain select-none pointer-events-none"
          onLoad={syncImgDimensions}
        />

        {hover && ready && fit.w > 0 && isMounted && (
          <div
            className="absolute pointer-events-none border-2 border-blue-500/80 bg-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)] rounded-sm z-10"
            style={{
              left: fit.x + n.x * fit.w - fit.w / (zm * 2),
              top: fit.y + n.y * fit.h - fit.h / (zm * 2),
              width: fit.w / zm,
              height: fit.h / zm,
            }}
          />
        )}

        <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-500 bg-white/90 px-2 py-0.5 rounded-md pointer-events-none z-20">
          مرر الماوس للتكبير
        </p>
      </div>

      {hover && ready && fit.w > 0 && isMounted && (
        <div
          className="absolute rounded-lg border border-gray-200 bg-white shadow-2xl overflow-hidden hidden lg:block pointer-events-none"
          style={{
            width: lensWidth,
            height: lensHeight,
            top: 0,
            right: '100%',
            marginRight: '16px',
            zIndex: 9999,
          }}
          aria-hidden={!hover}
        >
          <div
            className="relative w-full h-full overflow-hidden bg-white"
            style={{ width: lensWidth, height: lensHeight }}
          >
            <div
              style={{
                width: zoomedW,
                height: zoomedH,
                transform: `translate3d(${tx}px, ${ty}px, 0)`,
                willChange: 'transform',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="block pointer-events-none select-none max-w-none"
                draggable={false}
                style={{
                  width: zoomedW,
                  height: zoomedH,
                  objectFit: 'contain',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

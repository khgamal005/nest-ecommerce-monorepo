'use client'

import { forwardRef, useState } from 'react'
import Image from 'next/image'
import { MediaPlaceholder } from './MediaPlaceholder'
import { getSafeMediaUrl } from '@/utils/mediaUtils'

/** Check if URL is from R2 — already CDN-optimized, skip Next.js optimization */
const isR2Url = (url: string): boolean => {
  try {
    const { hostname } = new URL(url)
    return hostname.endsWith('.r2.dev')
  } catch {
    return false
  }
}

/**
 * Props for the SafeImage component.
 * Provides a shimmer-to-image loading experience with fallback handling.
 *
 * @example
 * <SafeImage
 *   src="https://ik.imagekit.io/product.jpg"
 *   alt="Product image"
 *   fill
 *   sizes="(max-width: 768px) 100vw, 300px"
 *   className="object-cover"
 * />
 */
interface SafeImageProps {
  /** Image URL — validated against trusted domains */
  src: string | null | undefined
  /** Alt text for accessibility */
  alt?: string
  /** Use fill mode (requires parent with position: relative) */
  fill?: boolean
  /** Fixed width (when not using fill) */
  width?: number
  /** Fixed height (when not using fill) */
  height?: number
  /** Additional CSS classes */
  className?: string
  /** Sizes attribute for responsive images */
  sizes?: string
  /** Load with high priority (for above-fold images) */
  priority?: boolean
  /** Use next/image (default) or plain img tag */
  useNextImage?: boolean
  /** Callback when image successfully loads */
  onLoad?: () => void
  /** Callback when image fails to load */
  onError?: () => void
}

export const SafeImage = forwardRef<HTMLImageElement, SafeImageProps>(({
  src,
  alt = '',
  fill,
  width,
  height,
  className = '',
  sizes,
  priority,
  useNextImage = true,
  onLoad,
  onError,
}, ref) => {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const safeSrc = getSafeMediaUrl(src)

  // No valid src — show empty placeholder immediately, no network request
  if (!safeSrc) {
    return <MediaPlaceholder state="empty" className={className} />
  }

  // Error state
  if (error) {
    return <MediaPlaceholder state="error" type="image" className={className} />
  }

  const handleLoad = () => {
    setLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setError(true)
    onError?.()
  }

  return (
    <div className="relative w-full h-full">
      {/* Shimmer underneath — z-index 1 (spec TC-006) */}
      {!loaded && (
        <div className="absolute inset-0" style={{ zIndex: 1 }}>
          <MediaPlaceholder state="loading" />
        </div>
      )}

      {/* Image on top — z-index 2, fades in on load (spec TC-006) */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ zIndex: 2, opacity: loaded ? 1 : 0 }}
      >
        {/* Use plain img for R2 URLs (already CDN-optimized) or when useNextImage=false */}
        {useNextImage && !isR2Url(safeSrc) ? (
          <Image
            ref={ref}
            src={safeSrc}
            alt={alt}
            fill={fill}
            width={!fill ? width : undefined}
            height={!fill ? height : undefined}
            sizes={sizes}
            priority={priority}
            className={`w-full h-full ${className}`}
            onLoad={handleLoad}
            onError={handleError}
          />
        ) : (
          <img
            ref={ref}
            src={safeSrc}
            alt={alt}
            width={width}
            height={height}
            className={`w-full h-full ${className}`}
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
      </div>
    </div>
  )
})

SafeImage.displayName = 'SafeImage'

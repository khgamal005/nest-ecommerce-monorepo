'use client'

import { useState } from 'react'
import { MediaPlaceholder } from './MediaPlaceholder'
import { getSafeMediaUrl } from '@/utils/mediaUtils'

/**
 * Props for the SafeVideo component.
 * Provides a shimmer-to-video loading experience with fallback handling.
 *
 * @example
 * <SafeVideo
 *   src="https://ik.imagekit.io/product.mp4"
 *   poster="https://ik.imagekit.io/thumbnail.jpg"
 *   controls
 *   className="rounded-lg"
 * />
 */
interface SafeVideoProps {
  /** Video URL — validated against trusted domains */
  src: string | null | undefined
  /** Additional CSS classes */
  className?: string
  /** Show video controls */
  controls?: boolean
  /** Play inline on mobile (prevents fullscreen) */
  playsInline?: boolean
  /** Auto-play when ready */
  autoPlay?: boolean
  /** Loop playback */
  loop?: boolean
  /** Mute audio */
  muted?: boolean
  /** Poster image URL */
  poster?: string
  /** Callback when video metadata loads */
  onLoad?: () => void
  /** Callback when video fails to load */
  onError?: () => void
}

export function SafeVideo({
  src,
  className = '',
  controls = true,
  playsInline = true,
  autoPlay,
  loop,
  muted,
  poster,
  onLoad,
  onError,
}: SafeVideoProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const safeSrc = getSafeMediaUrl(src)

  if (!safeSrc) {
    return <MediaPlaceholder state="empty" type="video" className={className} />
  }

  if (error) {
    return <MediaPlaceholder state="error" type="video" className={className} />
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
      {/* Shimmer underneath — z-index 1 */}
      {!loaded && (
        <div className="absolute inset-0" style={{ zIndex: 1 }}>
          <MediaPlaceholder state="loading" type="video" />
        </div>
      )}

      {/* Video on top — z-index 2, fades in */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ zIndex: 2, opacity: loaded ? 1 : 0 }}
      >
        <video
          src={safeSrc}
          className={`w-full h-full ${className}`}
          controls={controls}
          playsInline={playsInline}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          poster={poster}
          onLoadedMetadata={handleLoad}
          onError={handleError}
        />
      </div>
    </div>
  )
}

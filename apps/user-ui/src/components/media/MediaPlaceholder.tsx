'use client'

import { ImageOff, VideoOff } from 'lucide-react'

/**
 * Props for the MediaPlaceholder component.
 * Displays loading shimmer, error state, or empty state for media.
 *
 * @example
 * <MediaPlaceholder state="loading" type="image" />
 * <MediaPlaceholder state="error" type="video" message="Video unavailable" />
 */
interface MediaPlaceholderProps {
  /** Media type for error icons */
  type?: 'image' | 'video'
  /** Display state: loading (shimmer), error (icon), or empty (gray box) */
  state?: 'loading' | 'error' | 'empty'
  /** Additional CSS classes */
  className?: string
  /** Optional error message to display */
  message?: string
}

export function MediaPlaceholder({
  type = 'image',
  state = 'loading',
  className = '',
  message,
}: MediaPlaceholderProps) {
  if (state === 'loading') {
    return (
      <div
        className={`w-full h-full ${className}`}
        style={{
          background: 'linear-gradient(90deg, #f0f0f0 0%, #e8e8e8 50%, #f0f0f0 100%)',
          backgroundSize: '800px 100%',
          animation: 'shimmer 1.5s infinite linear',
        }}
      >
        <style>{`
          @keyframes shimmer {
            0% { background-position: -800px 0; }
            100% { background-position: 800px 0; }
          }
        `}</style>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center bg-gray-100 ${className}`}>
        {type === 'video'
          ? <VideoOff className="w-6 h-6 text-gray-400" />
          : <ImageOff className="w-6 h-6 text-gray-400" />
        }
        {message && (
          <span className="mt-1 text-xs text-gray-400">{message}</span>
        )}
      </div>
    )
  }

  // empty state
  return (
    <div className={`w-full h-full bg-gray-100 ${className}`} />
  )
}

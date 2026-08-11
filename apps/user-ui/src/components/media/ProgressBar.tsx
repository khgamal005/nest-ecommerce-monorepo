'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Route change progress indicator.
 * Shows a blue bar at the top of the page during navigation.
 * Automatically starts on route change, crawls to 85%, then completes to 100%.
 *
 * @example
 * // In your layout or page:
 * <ProgressBar />
 */
export function ProgressBar() {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    let timer: NodeJS.Timeout

    // Route change started
    setFadeOut(false)
    setVisible(true)
    setProgress(0)
    // Animate to ~85% — crawl
    timer = setTimeout(() => setProgress(85), 50)

    // Route change completed
    const completeTimer = setTimeout(() => {
      setProgress(100)
      timer = setTimeout(() => {
        setFadeOut(true)
        timer = setTimeout(() => {
          setVisible(false)
          setProgress(0)
          setFadeOut(false)
        }, 400)
      }, 200)
    }, 100)

    return () => {
      clearTimeout(timer)
      clearTimeout(completeTimer)
    }
  }, [pathname, searchParams])

  if (!visible) return null

  // Compute transition values based on state
  const transitionProperty = fadeOut ? 'opacity' : 'width'
  const transitionDuration = fadeOut ? '0.4s' : progress === 100 ? '0.2s' : '0.8s'
  const transitionTimingFunction = 'ease'

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${progress}%`,
        height: '3px',
        background: '#2D7FF9',
        zIndex: 9999,
        opacity: fadeOut ? 0 : 1,
        transitionProperty,
        transitionDuration,
        transitionTimingFunction,
      }}
    />
  )
}

/**
 * Media components with shimmer loading, error handling, and security validation.
 *
 * @example
 * // SafeImage with fill mode (responsive)
 * import { SafeImage } from '@/components/media'
 * <div className="relative h-56">
 *   <SafeImage src={imageUrl} alt={title} fill sizes="300px" className="object-cover" />
 * </div>
 *
 * @example
 * // SafeImage with fixed dimensions
 * <SafeImage src={url} alt={title} width={300} height={200} />
 *
 * @example
 * // SafeVideo with poster
 * import { SafeVideo } from '@/components/media'
 * <SafeVideo src={videoUrl} poster={thumbnailUrl} controls className="rounded-lg" />
 *
 * @example
 * // Progress bar for route changes
 * import { ProgressBar } from '@/components/media'
 * <ProgressBar />
 */
export { MediaPlaceholder } from './MediaPlaceholder'
export { SafeImage } from './SafeImage'
export { SafeVideo } from './SafeVideo'
export { ProgressBar } from './ProgressBar'

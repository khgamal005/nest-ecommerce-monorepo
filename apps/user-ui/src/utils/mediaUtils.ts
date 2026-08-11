const TRUSTED_PROTOCOLS = ['http:', 'https:'];
const TRUSTED_HOSTNAMES = [
  'ik.imagekit.io',
  'res.cloudinary.com',
  'images.unsplash.com',
  'cdn.shopify.com',
  'storage.googleapis.com',
];

const isR2Url = (url: string): boolean => {
  try {
    const { hostname } = new URL(url);
    return hostname.endsWith('.r2.dev');
  } catch {
    return false;
  }
};

export function getSafeMediaUrl(
  url: string | null | undefined,
): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (!TRUSTED_PROTOCOLS.includes(parsed.protocol)) return null;

    const isTrustedHost =
      TRUSTED_HOSTNAMES.some((h) => parsed.hostname === h) ||
      parsed.hostname.endsWith('.r2.dev') ||
      parsed.hostname.endsWith('.cloudfront.net') ||
      parsed.hostname.endsWith('.amazonaws.com') ||
      parsed.hostname === 'localhost' ||
      parsed.hostname.endsWith('.localhost');

    if (!isTrustedHost) return null;
    return trimmed;
  } catch {
    return null;
  }
}

export function isSafeMediaUrl(url: string | null | undefined): boolean {
  return getSafeMediaUrl(url) !== null;
}

export { isR2Url };

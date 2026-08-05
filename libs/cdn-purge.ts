// packages/libs/cdn-purge.ts
export function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}

export async function purgeCdnCache(urls: string[]): Promise<void> {
  if (!urls.length) return;
  if (!process.env.CLOUDFLARE_ZONE_ID || !process.env.CLOUDFLARE_API_TOKEN) {
    console.log('⚠️ CF purge skipped — no zone configured');
    return;
  }

  const chunks = chunk(urls, 30);
  for (const batch of chunks) {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/purge_cache`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: batch }),
      }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(`CF purge failed: ${JSON.stringify(err)}`);
    }
  }
}


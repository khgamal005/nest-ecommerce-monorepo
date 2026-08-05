// Thin typed fetch wrapper shared by user-ui and Admin-ui.
// Both apps set NEXT_PUBLIC_API_URL to point at the same NestJS backend.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333/api';

export interface ApiOptions extends RequestInit {
  token?: string;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

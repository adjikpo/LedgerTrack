const BASE_URL = (globalThis as any).process?.env?.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export async function apiFetch(path: string, opts?: { method?: string; body?: any; token?: string }) {
  const { method = 'GET', body, token } = opts || {};
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Request failed');
  return data;
}

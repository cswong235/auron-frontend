import { API_BASE } from '../supabaseClient';

export async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Some responses have no body (e.g. a 401 from verifySession), so don't assume JSON
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};

  if (!res.ok) {
    // The backend sends errors as { error: "message" }
    const err = new Error(json.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return json;
}

/**
 * Direct REST API helper for Supabase queries.
 * Bypasses the Supabase JS SDK which can hang in certain browser environments.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function getHeaders(accessToken?: string) {
  return {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${accessToken || SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}

/**
 * Build query string from params, supporting duplicate keys via array values
 * e.g. { start_time: ['gte.X', 'lt.Y'] } => start_time=gte.X&start_time=lt.Y
 */
function buildQuery(params: Record<string, string | string[]>): string {
  const parts: string[] = [];
  for (const [key, val] of Object.entries(params)) {
    if (Array.isArray(val)) {
      for (const v of val) {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
      }
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
    }
  }
  return parts.join('&');
}

export async function restSelect<T = any>(
  table: string,
  params: Record<string, string | string[]> = {},
  accessToken?: string
): Promise<{ data: T[] | null; error: string | null }> {
  try {
    const allParams = { select: '*', ...params };
    const query = buildQuery(allParams);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: getHeaders(accessToken),
    });
    if (!res.ok) {
      const body = await res.text();
      return { data: null, error: `${res.status}: ${body}` };
    }
    const data = await res.json();
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

export async function restInsert<T = any>(
  table: string,
  body: Record<string, any> | Record<string, any>[],
  accessToken: string
): Promise<{ data: T[] | null; error: string | null }> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: getHeaders(accessToken),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      return { data: null, error: `${res.status}: ${text}` };
    }
    const data = await res.json();
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

export async function restUpdate(
  table: string,
  body: Record<string, any>,
  filters: Record<string, string>,
  accessToken: string
): Promise<{ error: string | null }> {
  try {
    const query = buildQuery(filters);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      method: 'PATCH',
      headers: getHeaders(accessToken),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      return { error: `${res.status}: ${text}` };
    }
    return { error: null };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function restDelete(
  table: string,
  filters: Record<string, string>,
  accessToken: string
): Promise<{ error: string | null }> {
  try {
    const query = buildQuery(filters);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      method: 'DELETE',
      headers: getHeaders(accessToken),
    });
    if (!res.ok) {
      const text = await res.text();
      return { error: `${res.status}: ${text}` };
    }
    return { error: null };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function restSelectSingle<T = any>(
  table: string,
  params: Record<string, string>,
  accessToken?: string
): Promise<{ data: T | null; error: string | null }> {
  try {
    const query = buildQuery({ select: '*', ...params });
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: {
        ...getHeaders(accessToken),
        'Accept': 'application/vnd.pgrst.object+json',
      },
    });
    if (!res.ok) {
      const text = await res.text();
      return { data: null, error: `${res.status}: ${text}` };
    }
    const data = await res.json();
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

export async function restRpc<T = any>(
  fnName: string,
  params: Record<string, any>,
  accessToken: string
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fnName}`, {
      method: 'POST',
      headers: getHeaders(accessToken),
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const text = await res.text();
      return { data: null, error: `${res.status}: ${text}` };
    }
    const data = await res.json();
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

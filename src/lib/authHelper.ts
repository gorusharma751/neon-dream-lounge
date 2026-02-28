import { supabase } from '@/integrations/supabase/client';

/**
 * Wrapper around supabase.auth.getSession() with a timeout
 * to prevent infinite hanging in certain browser environments.
 */
export async function getSessionSafe(timeoutMs = 5000) {
  try {
    const result = await Promise.race([
      supabase.auth.getSession(),
      new Promise<{ data: { session: null } }>((resolve) =>
        setTimeout(() => resolve({ data: { session: null } }), timeoutMs)
      ),
    ]);
    return (result as any).data.session;
  } catch (err) {
    console.error('getSessionSafe error:', err);
    return null;
  }
}

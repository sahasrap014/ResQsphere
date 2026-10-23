import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default project URL provided by owner
export const SUPABASE_URL: string =
  (import.meta.env.VITE_SUPABASE_URL as string) || 'https://xlihhtmqfbaymzddzjqp.supabase.co';

export const SUPABASE_ANON_KEY: string =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 10);

let supabaseInstance: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    supabaseInstance = null;
  }
}

export const supabase = supabaseInstance;

export interface SupabaseConnectionStatus {
  isConfigured: boolean;
  status: 'connected' | 'unverified' | 'not_configured' | 'error';
  message: string;
  url: string;
}

export async function checkSupabaseConnection(): Promise<SupabaseConnectionStatus> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      isConfigured: false,
      status: 'not_configured',
      message: 'Authentication is not configured yet. Set the Supabase URL and anon key in environment (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY).',
      url: SUPABASE_URL,
    };
  }

  try {
    // Attempt a lightweight test call to verify connection
    const { data: _data, error } = await supabase.from('incidents').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist yet, client is initialized but tables need setup
      return {
        isConfigured: true,
        status: 'unverified',
        message: `Client initialized · project access not yet verified (${error.message})`,
        url: SUPABASE_URL,
      };
    }
    return {
      isConfigured: true,
      status: 'connected',
      message: 'Supabase Cloud Connected · Live Storage Active',
      url: SUPABASE_URL,
    };
  } catch (err: any) {
    return {
      isConfigured: true,
      status: 'error',
      message: `Connection test failed: ${err?.message || 'Network unreachable'}`,
      url: SUPABASE_URL,
    };
  }
}

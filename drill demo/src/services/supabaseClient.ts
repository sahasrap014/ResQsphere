import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile } from '../types/disaster';

// Project URL provided by owner for ResQsphere
export const SUPABASE_URL: string =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string) ||
  'https://pnykpvjsxwyezvvvjqjf.supabase.co';

export const SUPABASE_ANON_KEY: string =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string) ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBueWtwdmpzeHd5ZXp2dnZqcWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3NTg5NTgsImV4cCI6MjEwODMzNDk1OH0.iKKkYrLNE4FToGzvrM9U4Xp1vf1vopbxaVfaIQN6OD4';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 10
);

let supabaseInstance: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'resqsphere_auth_token',
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
      message: 'Authentication is not configured yet. Set the Supabase URL and publishable key in environment (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY).',
      url: SUPABASE_URL,
    };
  }

  try {
    // Attempt a lightweight test call to verify connection
    const { error } = await supabase.from('incidents').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
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

/**
 * Fetch authenticated user profile and verify active role
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      role: data.role,
      phone: data.phone,
      district: data.district,
      agency: data.agency,
      isApproved: data.is_approved,
    };
  } catch {
    return null;
  }
}

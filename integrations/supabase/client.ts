import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedSupabaseClient: SupabaseClient | null = null;

/**
 * Lazily initializes and returns the Supabase client.
 * Returns null if environment variables are missing.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (cachedSupabaseClient) {
    return cachedSupabaseClient;
  }

  // Access Vite environment variables
  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase Client] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Supabase features are disabled.');
    return null;
  }

  try {
    // Initialize the client only if keys are present
    cachedSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    console.log('[Supabase Client] Initialized successfully.');
    return cachedSupabaseClient;
  } catch (error) {
    console.error('[Supabase Client] Failed to initialize Supabase client:', error);
    return null;
  }
}
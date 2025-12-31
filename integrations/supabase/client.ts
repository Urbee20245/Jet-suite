import { createClient } from '@supabase/supabase-js';

// Access Vite environment variables with proper fallbacks
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// Create a dummy client or the real one to prevent top-level crashes
let supabaseClient: any;

try {
  if (supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    console.log('[Supabase Client] Initialized successfully.');
  } else {
    console.warn('[Supabase Client] Missing credentials. Authentication will be disabled.');
    // Mock client for environments without credentials
    supabaseClient = {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: async () => {},
        signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Auth disabled' } }),
        getUser: async () => ({ data: { user: null }, error: { message: 'Auth disabled' } }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }), order: () => ({ limit: () => ({}) }) }), insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }), update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }) }) }),
        rpc: async () => ({ error: { message: 'Supabase disabled' } })
      }),
      channel: () => ({
        on: () => ({
          subscribe: () => ({ unsubscribe: () => {} })
        })
      })
    };
  }
} catch (error) {
  console.error('[Supabase Client] Failed to initialize Supabase client:', error);
  // Fallback mock on critical failure
  supabaseClient = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => {},
      signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Auth disabled' } }),
      getUser: async () => ({ data: { user: null }, error: { message: 'Auth disabled' } }),
    },
    from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }), order: () => ({ limit: () => ({}) }) }), insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }), update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }) }) }),
        rpc: async () => ({ error: { message: 'Supabase disabled' } })
    }),
    channel: () => ({
        on: () => ({
          subscribe: () => ({ unsubscribe: () => {} })
        })
    })
  };
}

export const supabase = supabaseClient;
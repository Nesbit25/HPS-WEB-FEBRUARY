import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Singleton Supabase client to avoid multiple instances
// Use globalThis to ensure truly global singleton across module reloads
declare global {
  var __supabaseClient: ReturnType<typeof createClient> | undefined;
}

export function getSupabaseClient() {
  if (!globalThis.__supabaseClient) {
    globalThis.__supabaseClient = createClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey,
      {
        auth: {
          persistSession: true,
          storageKey: 'sb-jrzzakhpyoujpfrjllrh-auth-token',
        }
      }
    );
  }
  return globalThis.__supabaseClient;
}
import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null | undefined;

/**
 * Get a Supabase client using the service-role key for privileged writes.
 * This should ONLY be used in server-side code (routes, API handlers).
 * Never call from client components.
 */
export function getAdminSupabaseClient() {
  if (adminClient !== undefined) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    console.error('NEXT_PUBLIC_SUPABASE_URL is not set');
    adminClient = null;
    return adminClient;
  }

  if (!serviceRoleKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set. Cron jobs will fail.');
    adminClient = null;
    return adminClient;
  }

  try {
    adminClient = createClient(url, serviceRoleKey);
  } catch (error) {
    console.error('Failed to create admin Supabase client:', error);
    adminClient = null;
  }

  return adminClient;
}

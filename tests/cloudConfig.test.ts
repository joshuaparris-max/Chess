import { describe, expect, it } from 'vitest';
import { getSupabaseClient } from '@/lib/supabaseClient';

describe('optional cloud configuration', () => {
  it('stays disabled without public Supabase variables', () => {
    expect(getSupabaseClient()).toBeNull();
  });
});

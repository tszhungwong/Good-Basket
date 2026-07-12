import { getSupabaseClient } from './supabase';

test('returns null when public Supabase values are absent', () => {
  expect(getSupabaseClient()).toBeNull();
});

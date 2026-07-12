import { hasSupabaseConfig } from './env';

test('requires both public Supabase values', () => {
  expect(hasSupabaseConfig('https://example.supabase.co', 'publishable-key')).toBe(true);
  expect(hasSupabaseConfig('https://example.supabase.co', '')).toBe(false);
  expect(hasSupabaseConfig(undefined, 'publishable-key')).toBe(false);
});

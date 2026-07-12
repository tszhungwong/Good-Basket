export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
export const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function hasSupabaseConfig(url?: string, key?: string): boolean {
  return Boolean(url?.trim() && key?.trim());
}

export const isSupabaseConfigured = hasSupabaseConfig(
  supabaseUrl,
  supabasePublishableKey,
);

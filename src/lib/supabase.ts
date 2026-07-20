import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import {
  isSupabaseConfigured,
  supabasePublishableKey,
  supabaseUrl,
} from './env';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured || !supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  client ??= createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storage: AsyncStorage,
    },
  });

  return client;
}

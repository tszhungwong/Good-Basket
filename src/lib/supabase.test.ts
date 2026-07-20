afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

test('returns null when public Supabase values are absent', () => {
  jest.isolateModules(() => {
    jest.doMock('./env', () => ({
      isSupabaseConfigured: false,
      supabasePublishableKey: undefined,
      supabaseUrl: undefined,
    }));

    // Jest isolation runs in CommonJS mode in this Expo test preset.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getSupabaseClient } = require('./supabase') as typeof import('./supabase');

    expect(getSupabaseClient()).toBeNull();
  });
});

test('creates one client with persistent session storage', () => {
  const createClient = jest.fn().mockReturnValue({ auth: {} });
  const storage = {
    getItem: jest.fn(),
    removeItem: jest.fn(),
    setItem: jest.fn(),
  };

  jest.isolateModules(() => {
    jest.doMock('./env', () => ({
      isSupabaseConfigured: true,
      supabasePublishableKey: 'publishable-key',
      supabaseUrl: 'https://example.supabase.co',
    }));
    jest.doMock('@supabase/supabase-js', () => ({ createClient }));
    jest.doMock('@react-native-async-storage/async-storage', () => storage);

    // Jest isolation runs in CommonJS mode in this Expo test preset.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getSupabaseClient } = require('./supabase') as typeof import('./supabase');

    expect(getSupabaseClient()).toBe(getSupabaseClient());
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'publishable-key',
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          storage,
        },
      },
    );
  });
});

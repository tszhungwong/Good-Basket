import type { AuthClient } from './authRepository';
import { createAuthRepository } from './authRepository';

function createClientDouble() {
  return {
    auth: {
      signInWithOAuth: jest.fn().mockResolvedValue({ data: { url: null }, error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: { session: {} }, error: null }),
      signUp: jest.fn().mockResolvedValue({ data: { session: {} }, error: null }),
    },
  } as unknown as AuthClient;
}

test('signs in with a normalized email and password', async () => {
  const client = createClientDouble();
  const repository = createAuthRepository(client, () => 'goodgoods://account');

  await repository.signInWithEmail(' Jamie@Example.com ', 'market88');

  expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
    email: 'jamie@example.com',
    password: 'market88',
  });
});

test('uses a neutral message when email sign in fails', async () => {
  const client = createClientDouble();
  client.auth.signInWithPassword = jest.fn().mockResolvedValue({
    data: { session: null },
    error: new Error('Invalid login credentials'),
  });
  const repository = createAuthRepository(client, () => 'goodgoods://account');

  await expect(repository.signInWithEmail('jamie@example.com', 'wrongpass')).rejects.toThrow(
    'Email or password is incorrect.',
  );
});

test('starts Google OAuth with the account redirect URL', async () => {
  const client = createClientDouble();
  const repository = createAuthRepository(client, () => 'goodgoods://account');

  await repository.signInWithGoogle();

  expect(client.auth.signInWithOAuth).toHaveBeenCalledWith({
    provider: 'google',
    options: { redirectTo: 'goodgoods://account' },
  });
});

test('reports Google provider errors', async () => {
  const client = createClientDouble();
  client.auth.signInWithOAuth = jest.fn().mockResolvedValue({
    data: { url: null },
    error: new Error('Provider is not enabled'),
  });
  const repository = createAuthRepository(client, () => 'goodgoods://account');

  await expect(repository.signInWithGoogle()).rejects.toThrow(
    'Google sign-in is unavailable. Check the provider configuration.',
  );
});

test('creates an account and reports an active session', async () => {
  const client = createClientDouble();
  const repository = createAuthRepository(client, () => 'goodgoods://account');

  await expect(repository.createAccount(' Jamie@Example.com ', 'market88')).resolves.toEqual({
    requiresEmailConfirmation: false,
  });
  expect(client.auth.signUp).toHaveBeenCalledWith({
    email: 'jamie@example.com',
    password: 'market88',
    options: { emailRedirectTo: 'goodgoods://account' },
  });
});

test('reports when registration requires email confirmation', async () => {
  const client = createClientDouble();
  client.auth.signUp = jest.fn().mockResolvedValue({
    data: { session: null },
    error: null,
  });
  const repository = createAuthRepository(client, () => 'goodgoods://account');

  await expect(repository.createAccount('jamie@example.com', 'market88')).resolves.toEqual({
    requiresEmailConfirmation: true,
  });
});

test('requires Supabase configuration for every auth action', async () => {
  const repository = createAuthRepository(null, () => 'goodgoods://account');

  await expect(repository.signInWithEmail('jamie@example.com', 'market88')).rejects.toThrow(
    'Supabase is not configured.',
  );
  await expect(repository.signInWithGoogle()).rejects.toThrow('Supabase is not configured.');
  await expect(repository.createAccount('jamie@example.com', 'market88')).rejects.toThrow(
    'Supabase is not configured.',
  );
});

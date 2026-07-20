import * as Linking from 'expo-linking';

import { getSupabaseClient } from '@/lib/supabase';

type AuthResult = {
  data: { session: unknown | null };
  error: Error | null;
};

type OAuthResult = {
  data: { url: string | null };
  error: Error | null;
};

export type AuthClient = {
  auth: {
    signInWithOAuth(input: {
      provider: 'google';
      options: { redirectTo: string };
    }): Promise<OAuthResult>;
    signInWithPassword(input: { email: string; password: string }): Promise<AuthResult>;
    signUp(input: {
      email: string;
      password: string;
      options: { emailRedirectTo: string };
    }): Promise<AuthResult>;
  };
};

export type CreateAccountResult = {
  requiresEmailConfirmation: boolean;
};

export interface AuthRepository {
  createAccount(email: string, password: string): Promise<CreateAccountResult>;
  signInWithEmail(email: string, password: string): Promise<void>;
  signInWithGoogle(): Promise<void>;
}

export function createAuthRepository(
  client: AuthClient | null = getSupabaseClient() as AuthClient | null,
  createRedirectUrl: () => string = () => Linking.createURL('account'),
): AuthRepository {
  const requireClient = (): AuthClient => {
    if (!client) {
      throw new Error('Supabase is not configured.');
    }
    return client;
  };

  return {
    signInWithEmail: async (email, password) => {
      const { error } = await requireClient().auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      });
      if (error) {
        throw new Error('Email or password is incorrect.', { cause: error });
      }
    },
    signInWithGoogle: async () => {
      const { error } = await requireClient().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: createRedirectUrl() },
      });
      if (error) {
        throw new Error('Google sign-in is unavailable. Check the provider configuration.', {
          cause: error,
        });
      }
    },
    createAccount: async (email, password) => {
      const { data, error } = await requireClient().auth.signUp({
        email: normalizeEmail(email),
        password,
        options: { emailRedirectTo: createRedirectUrl() },
      });
      if (error) {
        throw new Error(error.message, { cause: error });
      }
      return { requiresEmailConfirmation: !data.session };
    },
  };
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

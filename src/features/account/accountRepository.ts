import { getSupabaseClient } from '@/lib/supabase';

export type AccountProfile = {
  displayName: string;
  email: string;
  memberSince: string;
  username: string;
};

export type DeliveryPreference = {
  defaultAddress: string;
  deliveryInstructions: string;
  preferredWindow: string;
  substitutionPreference: string;
};

export type PaymentMethod = {
  id: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  lastFour: string;
};

export type AccountOrderItem = {
  productId: string | null;
  productName: string;
  quantity: number;
  unit: string;
};

export type AccountOrder = {
  id: string;
  orderNumber: string;
  placedAt: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  total: number;
  currency: string;
  items: AccountOrderItem[];
};

export type AccountData = {
  profile: AccountProfile;
  deliveryPreference: DeliveryPreference | null;
  paymentMethods: PaymentMethod[];
  orders: AccountOrder[];
};

export interface AccountRepository {
  getAccount(): Promise<AccountData>;
  requestAccountDeletion(): Promise<void>;
  signOut(): Promise<void>;
}

type AccountUser = {
  email?: string;
  id: string;
  user_metadata: Record<string, unknown>;
};

type AccountProfileInsert = {
  display_name: string;
  user_id: string;
  username: string;
};

type QueryResult = {
  data: unknown;
  error: Error | null;
};

export type AccountClient = {
  auth: {
    getUser(): Promise<{
      data: { user: AccountUser | null };
      error: Error | null;
    }>;
    signOut(input: { scope: 'local' }): Promise<{ error: Error | null }>;
  };
  from(table: 'account_profiles'): {
    upsert(
      values: AccountProfileInsert,
      options: { ignoreDuplicates: true; onConflict: 'user_id' },
    ): PromiseLike<QueryResult>;
  };
  rpc(name: 'delete_current_user' | 'get_account_overview'): PromiseLike<QueryResult>;
};

type AccountOverviewRow = {
  profile?: Partial<AccountProfile>;
  deliveryPreference?: Partial<DeliveryPreference> | null;
  paymentMethods?: Partial<PaymentMethod>[];
  orders?: (Partial<AccountOrder> & { items?: Partial<AccountOrderItem>[] })[];
};

function parseAccountOverview(value: unknown, email: string): AccountData {
  const overview = value as AccountOverviewRow | null;
  if (!overview?.profile?.displayName || !overview.profile.username) {
    throw new Error('Your account profile is not ready yet.');
  }

  return {
    profile: {
      displayName: overview.profile.displayName,
      email,
      memberSince: overview.profile.memberSince ?? '',
      username: overview.profile.username,
    },
    deliveryPreference: overview.deliveryPreference
      ? {
          defaultAddress: overview.deliveryPreference.defaultAddress ?? '',
          deliveryInstructions: overview.deliveryPreference.deliveryInstructions ?? '',
          preferredWindow: overview.deliveryPreference.preferredWindow ?? '',
          substitutionPreference:
            overview.deliveryPreference.substitutionPreference ?? 'Replace unavailable items',
        }
      : null,
    paymentMethods: (overview.paymentMethods ?? []).map((method) => ({
      id: String(method.id),
      brand: method.brand ?? 'Card',
      expiryMonth: Number(method.expiryMonth),
      expiryYear: Number(method.expiryYear),
      isDefault: Boolean(method.isDefault),
      lastFour: method.lastFour ?? '',
    })),
    orders: (overview.orders ?? []).map((order) => ({
      id: String(order.id),
      orderNumber: order.orderNumber ?? '',
      placedAt: order.placedAt ?? '',
      status: order.status ?? 'pending',
      total: Number(order.total),
      currency: order.currency ?? 'USD',
      items: (order.items ?? []).map((item) => ({
        productId: item.productId ?? null,
        productName: item.productName ?? '',
        quantity: Number(item.quantity),
        unit: item.unit ?? '',
      })),
    })),
  };
}

function hasAccountProfile(value: unknown): boolean {
  const overview = value as AccountOverviewRow | null;
  return Boolean(overview?.profile?.displayName && overview.profile.username);
}

function metadataText(metadata: Record<string, unknown>, key: string): string {
  const value = metadata[key];
  return typeof value === 'string' ? value.trim() : '';
}

function createProfileInsert(user: AccountUser): AccountProfileInsert {
  const emailName = user.email?.split('@')[0] ?? '';
  const emailDisplayName = emailName
    .replace(/[._]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();
  const displayName =
    metadataText(user.user_metadata, 'full_name') ||
    metadataText(user.user_metadata, 'name') ||
    emailDisplayName ||
    'Good Goods shopper';
  const usernameBase = (
    metadataText(user.user_metadata, 'username') ||
    emailName ||
    'shopper'
  )
    .replace(/[^a-zA-Z0-9_]+/g, '')
    .toLowerCase();

  return {
    display_name: displayName.slice(0, 80),
    user_id: user.id,
    username: `${(usernameBase || 'shopper').slice(0, 40)}_${user.id.replace(/-/g, '').slice(0, 8)}`,
  };
}

export function createAccountRepository(
  client: AccountClient | null = getSupabaseClient() as unknown as AccountClient | null,
): AccountRepository {
  return {
    getAccount: async () => {
      if (!client) {
        throw new Error('Supabase is not configured.');
      }

      const { data: authData, error: authError } = await client.auth.getUser();
      if (authError || !authData.user) {
        throw new Error('Could not load your account. Please sign in and try again.', {
          cause: authError ?? undefined,
        });
      }

      const user = authData.user;
      let { data, error } = await client.rpc('get_account_overview');
      if (error) {
        throw new Error('Could not load your account. Please sign in and try again.', {
          cause: error,
        });
      }

      if (!hasAccountProfile(data)) {
        const { error: profileError } = await client
          .from('account_profiles')
          .upsert(createProfileInsert(user), {
            ignoreDuplicates: true,
            onConflict: 'user_id',
          });
        if (profileError) {
          throw new Error('Could not prepare your account profile. Please try again.', {
            cause: profileError,
          });
        }

        ({ data, error } = await client.rpc('get_account_overview'));
        if (error) {
          throw new Error('Could not load your account. Please try again.', { cause: error });
        }
      }

      const account = parseAccountOverview(data, user.email ?? '');
      if (!account.profile.email) {
        account.profile.email = account.profile.username;
      }
      return account;
    },
    requestAccountDeletion: async () => {
      if (!client) {
        throw new Error('Supabase is not configured.');
      }

      const { error } = await client.rpc('delete_current_user');
      if (error) {
        throw new Error('Could not delete your account. Please try again.', { cause: error });
      }
    },
    signOut: async () => {
      if (!client) {
        throw new Error('Supabase is not configured.');
      }

      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) {
        throw new Error('Could not sign out. Please try again.', { cause: error });
      }
    },
  };
}

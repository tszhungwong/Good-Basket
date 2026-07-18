import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseClient } from '@/lib/supabase';

export type AccountProfile = {
  displayName: string;
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
}

type AccountOverviewRow = {
  profile?: Partial<AccountProfile>;
  deliveryPreference?: Partial<DeliveryPreference> | null;
  paymentMethods?: Partial<PaymentMethod>[];
  orders?: (Partial<AccountOrder> & { items?: Partial<AccountOrderItem>[] })[];
};

function parseAccountOverview(value: unknown): AccountData {
  const overview = value as AccountOverviewRow | null;
  if (!overview?.profile?.displayName || !overview.profile.username) {
    throw new Error('Your account profile is not ready yet.');
  }

  return {
    profile: {
      displayName: overview.profile.displayName,
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

export function createAccountRepository(
  client: SupabaseClient | null = getSupabaseClient(),
): AccountRepository {
  return {
    getAccount: async () => {
      if (!client) {
        throw new Error('Supabase is not configured.');
      }

      const { data, error } = await client.rpc('get_account_overview');
      if (error) {
        throw new Error('Could not load your account. Please sign in and try again.', {
          cause: error,
        });
      }

      return parseAccountOverview(data);
    },
  };
}


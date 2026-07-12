import type { SupabaseClient } from '@supabase/supabase-js';

import type { CatalogData } from '@/features/catalog/catalogTypes';
import { getSupabaseClient } from '@/lib/supabase';

import type {
  OrderRequest,
  OrderResult,
} from './checkoutTypes';

export interface OrderRepository {
  createOrder(request: OrderRequest, catalog: CatalogData): Promise<OrderResult>;
}

type OrderResultRow = {
  id: string;
  order_number: string;
  subtotal: number | string;
  delivery_fee: number | string;
  total: number | string;
  currency: string;
};


async function createSupabaseOrder(
  client: SupabaseClient,
  request: OrderRequest,
): Promise<OrderResult> {
  const { data, error } = await client.rpc('create_order', {
    p_customer_name: request.customer.fullName,
    p_phone: request.customer.phone,
    p_email: request.customer.email,
    p_address: request.customer.address,
    p_note: request.customer.note,
    p_items: request.items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
    })),
  });

  if (error) {
    throw new Error('Could not place your order. Please review your cart and try again.', {
      cause: error,
    });
  }

  const row = (Array.isArray(data) ? data[0] : data) as OrderResultRow | undefined;
  if (!row) {
    throw new Error('The shop did not return an order confirmation.');
  }

  return {
    id: row.id,
    orderNumber: row.order_number,
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee),
    total: Number(row.total),
    currency: row.currency,
  };
}

export function createOrderRepository(
  client: SupabaseClient | null = getSupabaseClient(),
): OrderRepository {
  return {
    createOrder: async (request) => {
      if (!client) {
        throw new Error('Supabase is not configured.');
      }

      return createSupabaseOrder(client, request);
    },
  };
}

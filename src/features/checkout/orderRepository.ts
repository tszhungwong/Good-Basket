import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { CatalogData, Product } from '@/features/catalog/catalogTypes';
import { getSupabaseClient } from '@/lib/supabase';

import type {
  OrderRequest,
  OrderResult,
  OrderStorage,
} from './checkoutTypes';

export const LOCAL_ORDERS_KEY = 'good-goods.orders.v1';

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

type LocalOrderItem = {
  productId: string;
  productName: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

function createOrderNumber(now: Date): string {
  const date = now.toISOString().slice(0, 10).replaceAll('-', '');
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';

  for (let index = 0; index < 4; index += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return `GG-${date}-${suffix}`;
}

function parseStoredOrders(stored: string | null): unknown[] {
  if (!stored) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function resolveOrderItems(request: OrderRequest, catalog: CatalogData): LocalOrderItem[] {
  const products = new Map(catalog.products.map((product) => [product.id, product]));
  const quantities = new Map<string, number>();

  for (const item of request.items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error('One or more products are unavailable.');
    }

    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }

  return [...quantities.entries()].map(([productId, quantity]) => {
    const product: Product | undefined = products.get(productId);
    if (!product || product.stock < quantity) {
      throw new Error('One or more products are unavailable.');
    }

    return {
      productId,
      productName: product.name,
      unit: product.unit,
      unitPrice: product.price,
      quantity,
      lineTotal: product.price * quantity,
    };
  });
}

async function createLocalOrder(
  request: OrderRequest,
  catalog: CatalogData,
  storage: OrderStorage,
): Promise<OrderResult> {
  if (request.items.length === 0) {
    throw new Error('Your cart is empty.');
  }

  const items = resolveOrderItems(request, catalog);
  const subtotal = items.reduce((total, item) => total + item.lineTotal, 0);
  if (subtotal < catalog.settings.minimumOrder) {
    throw new Error(`Order must be at least ${catalog.settings.minimumOrder.toFixed(2)}.`);
  }

  const now = new Date();
  const orderNumber = createOrderNumber(now);
  const deliveryFee = catalog.settings.deliveryFee;
  const total = subtotal + deliveryFee;
  const result: OrderResult = {
    id: `local-${now.getTime()}-${orderNumber.slice(-4)}`,
    orderNumber,
    subtotal,
    deliveryFee,
    total,
    currency: catalog.settings.currency,
  };
  const storedOrders = parseStoredOrders(await storage.getItem(LOCAL_ORDERS_KEY));

  await storage.setItem(
    LOCAL_ORDERS_KEY,
    JSON.stringify([
      ...storedOrders,
      {
        ...result,
        createdAt: now.toISOString(),
        items,
        request,
      },
    ]),
  );

  return result;
}

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
  storage: OrderStorage = AsyncStorage,
): OrderRepository {
  return {
    createOrder: (request, catalog) =>
      client
        ? createSupabaseOrder(client, request)
        : createLocalOrder(request, catalog, storage),
  };
}

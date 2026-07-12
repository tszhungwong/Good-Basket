import type { SupabaseClient } from '@supabase/supabase-js';

import { mockCategories, mockProducts, mockStoreSettings } from '@/data/mock_catalog';
import type { CatalogData } from '@/features/catalog/catalogTypes';

import { createOrderRepository, LOCAL_ORDERS_KEY } from './orderRepository';
import type { OrderRequest, OrderStorage } from './checkoutTypes';

const catalog: CatalogData = {
  categories: mockCategories,
  products: mockProducts,
  settings: mockStoreSettings,
};

const request: OrderRequest = {
  customer: {
    fullName: 'Ari Lee',
    phone: '0912345678',
    email: 'ari@example.com',
    address: '1 Market Road',
    note: '',
  },
  items: [
    { productId: mockProducts[1].id, quantity: 2 },
    { productId: mockProducts[5].id, quantity: 1 },
  ],
};

function createMemoryStorage(): OrderStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();

  return {
    values,
    getItem: jest.fn(async (key) => values.get(key) ?? null),
    setItem: jest.fn(async (key, value) => {
      values.set(key, value);
    }),
  };
}

test('calculates and persists a local order from current catalog data', async () => {
  const storage = createMemoryStorage();
  const repository = createOrderRepository(null, storage);
  const result = await repository.createOrder(request, catalog);

  expect(result).toMatchObject({
    subtotal: 16.25,
    deliveryFee: 2.5,
    total: 18.75,
    currency: 'USD',
  });
  expect(result.orderNumber).toMatch(/^GG-\d{8}-[A-Z0-9]{4}$/);
  expect(JSON.parse(storage.values.get(LOCAL_ORDERS_KEY) ?? '[]')).toEqual([
    expect.objectContaining({ orderNumber: result.orderNumber, request }),
  ]);
});

test('rejects missing products and quantities above stock', async () => {
  const repository = createOrderRepository(null, createMemoryStorage());

  await expect(
    repository.createOrder(
      { ...request, items: [{ productId: 'missing', quantity: 1 }] },
      catalog,
    ),
  ).rejects.toThrow('One or more products are unavailable.');

  await expect(
    repository.createOrder(
      {
        ...request,
        items: [{ productId: mockProducts[1].id, quantity: mockProducts[1].stock + 1 }],
      },
      catalog,
    ),
  ).rejects.toThrow('One or more products are unavailable.');
});

test('maps order requests and responses through the Supabase RPC', async () => {
  const rpc = jest.fn().mockResolvedValue({
    data: [
      {
        id: 'order-1',
        order_number: 'GG-20260712-AB12',
        subtotal: '16.25',
        delivery_fee: '2.50',
        total: '18.75',
        currency: 'USD',
      },
    ],
    error: null,
  });
  const client = { rpc } as unknown as SupabaseClient;
  const repository = createOrderRepository(client, createMemoryStorage());

  await expect(repository.createOrder(request, catalog)).resolves.toEqual({
    id: 'order-1',
    orderNumber: 'GG-20260712-AB12',
    subtotal: 16.25,
    deliveryFee: 2.5,
    total: 18.75,
    currency: 'USD',
  });
  expect(rpc).toHaveBeenCalledWith('create_order', {
    p_customer_name: 'Ari Lee',
    p_phone: '0912345678',
    p_email: 'ari@example.com',
    p_address: '1 Market Road',
    p_note: '',
    p_items: [
      { product_id: mockProducts[1].id, quantity: 2 },
      { product_id: mockProducts[5].id, quantity: 1 },
    ],
  });
});

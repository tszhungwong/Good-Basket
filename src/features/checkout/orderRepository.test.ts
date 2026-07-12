import type { SupabaseClient } from '@supabase/supabase-js';

import { mockCategories, mockProducts, mockStoreSettings } from '@/test/mock_catalog';
import type { CatalogData } from '@/features/catalog/catalogTypes';

import { createOrderRepository } from './orderRepository';
import type { OrderRequest } from './checkoutTypes';

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

test('requires a Supabase client instead of persisting a local order', async () => {
  const repository = createOrderRepository(null);

  await expect(repository.createOrder(request, catalog)).rejects.toThrow(
    'Supabase is not configured.',
  );
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
  const repository = createOrderRepository(client);

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

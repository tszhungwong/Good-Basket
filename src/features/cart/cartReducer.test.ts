import type { Product } from '@/features/catalog/catalogTypes';

import { cartReducer, getCartSummary, initialCartState } from './cartReducer';

const product: Product = {
  id: 'product-1',
  slug: 'tomato',
  name: 'Tomatoes',
  description: 'Fresh tomatoes',
  categoryId: 'fresh',
  categoryName: 'Fresh',
  price: 4.5,
  unit: 'lb',
  imageUrl: 'tomato.jpg',
  rating: 4.8,
  stock: 2,
  deliveryMinutes: 20,
  tags: [],
  badge: null,
  featured: false,
};

test('adds and increments a product without exceeding stock', () => {
  let state = cartReducer(initialCartState, { type: 'add', product });
  state = cartReducer(state, { type: 'add', product });
  state = cartReducer(state, { type: 'add', product });

  expect(state.items).toHaveLength(1);
  expect(state.items[0].quantity).toBe(2);
});

test('does not add an out-of-stock product', () => {
  const state = cartReducer(initialCartState, {
    type: 'add',
    product: { ...product, id: 'sold-out', stock: 0 },
  });

  expect(state.items).toEqual([]);
});

test('removes a line when quantity becomes zero', () => {
  const added = cartReducer(initialCartState, { type: 'add', product });
  const result = cartReducer(added, {
    type: 'set-quantity',
    productId: product.id,
    quantity: 0,
  });

  expect(result.items).toEqual([]);
});

test('hydrates and clears stored lines while preserving hydration state', () => {
  const line = {
    productId: product.id,
    name: product.name,
    imageUrl: product.imageUrl,
    price: product.price,
    unit: product.unit,
    stock: product.stock,
    quantity: 1,
  };
  const hydrated = cartReducer(initialCartState, { type: 'hydrate', items: [line] });

  expect(hydrated.hydrated).toBe(true);
  expect(cartReducer(hydrated, { type: 'clear' })).toEqual({ hydrated: true, items: [] });
});

test('derives item count and subtotal', () => {
  const added = cartReducer(initialCartState, { type: 'add', product });

  expect(getCartSummary(added)).toEqual({ itemCount: 1, subtotal: 4.5 });
});

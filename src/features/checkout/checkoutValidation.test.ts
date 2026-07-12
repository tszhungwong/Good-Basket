import type { CartLine } from '@/features/cart/cartTypes';

import { buildOrderRequest, validateCheckout } from './checkoutValidation';

const validDetails = {
  fullName: 'Ari Lee',
  phone: '0912345678',
  email: '',
  address: '1 Market Road',
  note: '',
};

const line: CartLine = {
  productId: 'product-1',
  name: 'Tomatoes',
  imageUrl: 'tomato.jpg',
  price: 4.5,
  unit: 'lb',
  stock: 4,
  quantity: 2,
};

test('requires name, phone, and address', () => {
  expect(
    validateCheckout({ fullName: '', phone: '', email: '', address: '', note: '' }),
  ).toEqual({
    fullName: 'Enter your name.',
    phone: 'Enter your phone number.',
    address: 'Enter a delivery address.',
  });
});

test('rejects a malformed optional email', () => {
  expect(validateCheckout({ ...validDetails, email: 'bad-email' }).email).toBe(
    'Enter a valid email address.',
  );
});

test('normalizes details and maps cart lines to quantity-only items', () => {
  expect(
    buildOrderRequest(
      {
        fullName: ' Ari Lee ',
        phone: ' 0912345678 ',
        email: ' ari@example.com ',
        address: ' 1 Market Road ',
        note: ' Leave at door ',
      },
      [line],
    ),
  ).toEqual({
    customer: {
      fullName: 'Ari Lee',
      phone: '0912345678',
      email: 'ari@example.com',
      address: '1 Market Road',
      note: 'Leave at door',
    },
    items: [{ productId: 'product-1', quantity: 2 }],
  });
});

test('rejects an empty cart before creating an order request', () => {
  expect(() => buildOrderRequest(validDetails, [])).toThrow('Your cart is empty.');
});

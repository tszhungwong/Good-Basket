import type { CartLine } from '@/features/cart/cartTypes';

import type { CheckoutDetails, CheckoutErrors, OrderRequest } from './checkoutTypes';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCheckout(details: CheckoutDetails): CheckoutErrors {
  const errors: CheckoutErrors = {};

  if (!details.fullName.trim()) {
    errors.fullName = 'Enter your name.';
  }

  if (!details.phone.trim()) {
    errors.phone = 'Enter your phone number.';
  }

  const email = details.email.trim();
  if (email && !emailPattern.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!details.address.trim()) {
    errors.address = 'Enter a delivery address.';
  }

  return errors;
}

export function buildOrderRequest(
  details: CheckoutDetails,
  items: CartLine[],
): OrderRequest {
  if (items.length === 0) {
    throw new Error('Your cart is empty.');
  }

  return {
    customer: {
      fullName: details.fullName.trim(),
      phone: details.phone.trim(),
      email: details.email.trim(),
      address: details.address.trim(),
      note: details.note.trim(),
    },
    items: items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
  };
}

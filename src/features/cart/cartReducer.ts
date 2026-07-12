import type { Product } from '@/features/catalog/catalogTypes';

import type { CartAction, CartLine, CartState, CartSummary } from './cartTypes';

export const initialCartState: CartState = {
  hydrated: false,
  items: [],
};

function createCartLine(product: Product, quantity: number): CartLine {
  return {
    productId: product.id,
    name: product.name,
    imageUrl: product.imageUrl,
    price: product.price,
    unit: product.unit,
    stock: product.stock,
    quantity,
  };
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  if (action.type === 'hydrate') {
    return { hydrated: true, items: action.items };
  }

  if (action.type === 'clear') {
    return { ...state, items: [] };
  }

  if (action.type === 'remove') {
    return {
      ...state,
      items: state.items.filter((item) => item.productId !== action.productId),
    };
  }

  if (action.type === 'set-quantity') {
    if (!Number.isFinite(action.quantity) || action.quantity <= 0) {
      return {
        ...state,
        items: state.items.filter((item) => item.productId !== action.productId),
      };
    }

    return {
      ...state,
      items: state.items.map((item) =>
        item.productId === action.productId
          ? { ...item, quantity: Math.min(Math.floor(action.quantity), item.stock) }
          : item,
      ),
    };
  }

  if (action.product.stock <= 0) {
    return state;
  }

  const existing = state.items.find((item) => item.productId === action.product.id);
  if (!existing) {
    return {
      ...state,
      items: [...state.items, createCartLine(action.product, 1)],
    };
  }

  const quantity = Math.min(existing.quantity + 1, action.product.stock);
  return {
    ...state,
    items: state.items.map((item) =>
      item.productId === action.product.id ? createCartLine(action.product, quantity) : item,
    ),
  };
}

export function getCartSummary(state: CartState): CartSummary {
  return state.items.reduce(
    (summary, item) => ({
      itemCount: summary.itemCount + item.quantity,
      subtotal: summary.subtotal + item.price * item.quantity,
    }),
    { itemCount: 0, subtotal: 0 },
  );
}

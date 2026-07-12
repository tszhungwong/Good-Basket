import type { Product } from '@/features/catalog/catalogTypes';

export type CartLine = {
  productId: string;
  name: string;
  imageUrl: string;
  price: number;
  unit: string;
  stock: number;
  quantity: number;
};

export type CartState = {
  hydrated: boolean;
  items: CartLine[];
};

export type CartAction =
  | { type: 'hydrate'; items: CartLine[] }
  | { type: 'add'; product: Product }
  | { type: 'set-quantity'; productId: string; quantity: number }
  | { type: 'remove'; productId: string }
  | { type: 'clear' };

export type CartSummary = {
  itemCount: number;
  subtotal: number;
};

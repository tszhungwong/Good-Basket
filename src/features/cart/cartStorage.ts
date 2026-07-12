import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CartLine } from './cartTypes';

export const CART_STORAGE_KEY = 'good-goods.cart.v1';

export interface CartStorage {
  load(): Promise<CartLine[]>;
  save(items: CartLine[]): Promise<void>;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const line = value as Record<string, unknown>;
  return (
    isNonEmptyString(line.productId) &&
    isNonEmptyString(line.name) &&
    typeof line.imageUrl === 'string' &&
    typeof line.price === 'number' &&
    Number.isFinite(line.price) &&
    line.price >= 0 &&
    isNonEmptyString(line.unit) &&
    typeof line.stock === 'number' &&
    Number.isInteger(line.stock) &&
    line.stock > 0 &&
    typeof line.quantity === 'number' &&
    Number.isInteger(line.quantity) &&
    line.quantity > 0 &&
    line.quantity <= line.stock
  );
}

async function load(): Promise<CartLine[]> {
  const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.every(isCartLine) ? parsed : [];
  } catch {
    return [];
  }
}

async function save(items: CartLine[]): Promise<void> {
  await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export const cartStorage: CartStorage = { load, save };

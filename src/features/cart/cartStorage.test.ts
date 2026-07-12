import AsyncStorage from '@react-native-async-storage/async-storage';

import { cartStorage, CART_STORAGE_KEY } from './cartStorage';

const line = {
  productId: 'product-1',
  name: 'Tomatoes',
  imageUrl: 'tomato.jpg',
  price: 4.5,
  unit: 'lb',
  stock: 4,
  quantity: 2,
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('returns validated cart lines from storage', async () => {
  await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify([line]));

  await expect(cartStorage.load()).resolves.toEqual([line]);
});

test('returns an empty cart for malformed or invalid stored data', async () => {
  await AsyncStorage.setItem(CART_STORAGE_KEY, '{bad-json');
  await expect(cartStorage.load()).resolves.toEqual([]);

  await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify([{ ...line, quantity: -1 }]));
  await expect(cartStorage.load()).resolves.toEqual([]);
});

test('saves the serializable cart lines', async () => {
  await cartStorage.save([line]);

  await expect(AsyncStorage.getItem(CART_STORAGE_KEY)).resolves.toBe(JSON.stringify([line]));
});

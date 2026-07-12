import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Pressable, Text, View } from 'react-native';

import type { Product } from '@/features/catalog/catalogTypes';

import { CartProvider, useCart } from './CartProvider';
import type { CartStorage } from './cartStorage';

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
  stock: 4,
  deliveryMinutes: 20,
  tags: [],
  badge: null,
  featured: false,
};

function CartConsumer() {
  const { addProduct, hydrated, itemCount, subtotal } = useCart();

  return (
    <View>
      <Text>{hydrated ? 'Hydrated' : 'Loading cart'}</Text>
      <Text>{`Items ${itemCount}`}</Text>
      <Text>{`Subtotal ${subtotal}`}</Text>
      <Pressable
        accessibilityLabel="Add tomatoes"
        accessibilityRole="button"
        onPress={() => addProduct(product)}
      >
        <Text>Add</Text>
      </Pressable>
    </View>
  );
}

test('hydrates once and persists user cart changes', async () => {
  const storage: CartStorage = {
    load: jest.fn().mockResolvedValue([]),
    save: jest.fn().mockResolvedValue(undefined),
  };
  const screen = await render(
    <CartProvider storage={storage}>
      <CartConsumer />
    </CartProvider>,
  );

  expect(await screen.findByText('Hydrated')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Add tomatoes' }));

  expect(screen.getByText('Items 1')).toBeTruthy();
  expect(screen.getByText('Subtotal 4.5')).toBeTruthy();
  await waitFor(() => expect(storage.save).toHaveBeenLastCalledWith([expect.objectContaining({ quantity: 1 })]));
});

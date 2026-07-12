import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { mockCategories, mockProducts, mockStoreSettings } from '@/test/mock_catalog';
import { CatalogProvider } from '@/features/catalog/CatalogProvider';
import type { CatalogRepository } from '@/features/catalog/catalogRepository';

import { CartProvider } from '../CartProvider';
import type { CartStorage } from '../cartStorage';
import { CartScreen } from './CartScreen';

const mockRouter = {
  back: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 24, left: 0, right: 0, bottom: 20 },
};

const renderCart = async () => {
  const product = mockProducts[1];
  const storage: CartStorage = {
    load: jest.fn().mockResolvedValue([
      {
        productId: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        price: product.price,
        unit: product.unit,
        stock: product.stock,
        quantity: 1,
      },
    ]),
    save: jest.fn().mockResolvedValue(undefined),
  };
  const repository: CatalogRepository = {
    getCatalog: jest.fn().mockResolvedValue({
      categories: mockCategories,
      products: mockProducts,
      settings: mockStoreSettings,
    }),
  };

  return {
    product,
    screen: await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <CatalogProvider repository={repository}>
          <CartProvider storage={storage}>
            <CartScreen />
          </CartProvider>
        </CatalogProvider>
      </SafeAreaProvider>,
    ),
  };
};

test('removes the final quantity and shows the empty cart state', async () => {
  const { product, screen } = await renderCart();

  expect(await screen.findByText(product.name)).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: `Remove ${product.name}` }));

  expect(await screen.findByText('Your cart is empty')).toBeTruthy();
});

test('clears the cart after in-app confirmation', async () => {
  const { product, screen } = await renderCart();

  expect(await screen.findByText(product.name)).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Clear cart' }));

  expect(screen.getByText('Remove every item from your cart?')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Confirm clear cart' }));

  expect(await screen.findByText('Your cart is empty')).toBeTruthy();
});

import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { mockCategories, mockProducts, mockStoreSettings } from '@/data/mock_catalog';
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

test('removes the final quantity and shows the empty cart state', async () => {
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
  const screen = await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <CatalogProvider repository={repository}>
        <CartProvider storage={storage}>
          <CartScreen />
        </CartProvider>
      </CatalogProvider>
    </SafeAreaProvider>,
  );

  expect(await screen.findByText(product.name)).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: `Remove ${product.name}` }));

  expect(await screen.findByText('Your cart is empty')).toBeTruthy();
});

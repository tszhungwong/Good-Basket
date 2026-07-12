import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { mockCategories, mockProducts, mockStoreSettings } from '@/data/mock_catalog';
import { CartProvider } from '@/features/cart/CartProvider';
import type { CartStorage } from '@/features/cart/cartStorage';

import { CatalogProvider } from '../CatalogProvider';
import type { CatalogRepository } from '../catalogRepository';
import { ProductDetailScreen } from './ProductDetailScreen';

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

test('adds the product and exposes a view-cart action', async () => {
  const product = mockProducts[1];
  const repository: CatalogRepository = {
    getCatalog: jest.fn().mockResolvedValue({
      categories: mockCategories,
      products: mockProducts,
      settings: mockStoreSettings,
    }),
  };
  const storage: CartStorage = {
    load: jest.fn().mockResolvedValue([]),
    save: jest.fn().mockResolvedValue(undefined),
  };
  const screen = await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <CatalogProvider repository={repository}>
        <CartProvider storage={storage}>
          <ProductDetailScreen productId={product.id} />
        </CartProvider>
      </CatalogProvider>
    </SafeAreaProvider>,
  );

  expect(await screen.findByText(product.name)).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: `Add ${product.name}` }));

  expect(screen.getByRole('button', { name: 'View cart' })).toBeTruthy();
});

import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { mockCategories, mockProducts, mockStoreSettings } from '@/test/mock_catalog';
import { CartProvider } from '@/features/cart/CartProvider';
import type { CartStorage } from '@/features/cart/cartStorage';

import { CatalogProvider } from '../CatalogProvider';
import type { CatalogRepository } from '../catalogRepository';
import { StorefrontScreen } from './StorefrontScreen';

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

test('searches the catalog and adds a visible product to cart', async () => {
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
          <StorefrontScreen />
        </CartProvider>
      </CatalogProvider>
    </SafeAreaProvider>,
  );

  expect(await screen.findByText('Good Goods')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Search products'), 'sourdough');
  expect(screen.getByText('Country Sourdough')).toBeTruthy();
  expect(screen.queryByText('Organic Tomatoes')).toBeNull();

  await fireEvent.press(screen.getByRole('button', { name: 'Add Country Sourdough' }));
  expect(screen.getByRole('button', { name: /View cart, 1 item/ })).toBeTruthy();
});

test('shows the retryable catalog error instead of a permanent loading state', async () => {
  const repository: CatalogRepository = {
    getCatalog: jest.fn().mockRejectedValue(new Error('Catalog is offline.')),
  };
  const storage: CartStorage = {
    load: jest.fn().mockResolvedValue([]),
    save: jest.fn().mockResolvedValue(undefined),
  };
  const screen = await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <CatalogProvider repository={repository}>
        <CartProvider storage={storage}>
          <StorefrontScreen />
        </CartProvider>
      </CatalogProvider>
    </SafeAreaProvider>,
  );

  expect(await screen.findByText('Could not load products')).toBeTruthy();
  expect(screen.getByText('Catalog is offline.')).toBeTruthy();
});

import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { mockCategories, mockProducts, mockStoreSettings } from '@/data/mock_catalog';
import { CartProvider } from '@/features/cart/CartProvider';
import type { CartStorage } from '@/features/cart/cartStorage';
import { CatalogProvider } from '@/features/catalog/CatalogProvider';
import type { CatalogRepository } from '@/features/catalog/catalogRepository';

import type { OrderRepository } from '../orderRepository';
import { CheckoutScreen } from './CheckoutScreen';

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

test('validates fields and submits one normalized order', async () => {
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
  const catalogRepository: CatalogRepository = {
    getCatalog: jest.fn().mockResolvedValue({
      categories: mockCategories,
      products: mockProducts,
      settings: mockStoreSettings,
    }),
  };
  const orderRepository: OrderRepository = {
    createOrder: jest.fn().mockResolvedValue({
      id: 'order-1',
      orderNumber: 'GG-20260712-AB12',
      subtotal: 4.5,
      deliveryFee: 2.5,
      total: 7,
      currency: 'USD',
    }),
  };
  const screen = await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <CatalogProvider repository={catalogRepository}>
        <CartProvider storage={storage}>
          <CheckoutScreen repository={orderRepository} />
        </CartProvider>
      </CatalogProvider>
    </SafeAreaProvider>,
  );

  expect(await screen.findByText('Checkout')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Place order' }));
  expect(screen.getByText('Enter your name.')).toBeTruthy();
  expect(screen.getByText('Enter your phone number.')).toBeTruthy();
  expect(screen.getByText('Enter a delivery address.')).toBeTruthy();

  await fireEvent.changeText(screen.getByLabelText('Full name'), ' Ari Lee ');
  await fireEvent.changeText(screen.getByLabelText('Phone'), ' 0912345678 ');
  await fireEvent.changeText(screen.getByLabelText('Delivery address'), ' 1 Market Road ');
  await fireEvent.press(screen.getByRole('button', { name: 'Place order' }));

  expect(orderRepository.createOrder).toHaveBeenCalledWith(
    expect.objectContaining({
      customer: expect.objectContaining({ fullName: 'Ari Lee', phone: '0912345678' }),
      items: [{ productId: product.id, quantity: 1 }],
    }),
    expect.objectContaining({ products: mockProducts }),
  );
  expect(mockRouter.replace).toHaveBeenCalled();
});

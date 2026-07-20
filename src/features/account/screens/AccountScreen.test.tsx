import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CartProvider } from '@/features/cart/CartProvider';
import type { CartStorage } from '@/features/cart/cartStorage';
import { CatalogProvider } from '@/features/catalog/CatalogProvider';
import type { CatalogRepository } from '@/features/catalog/catalogRepository';
import { catalogCategories, catalogProducts, catalogSettings } from '@/test/catalogFixtures';

import type { AccountData, AccountRepository } from '../accountRepository';
import { AccountScreen } from './AccountScreen';

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

const accountData: AccountData = {
  profile: {
    displayName: 'Jamie Chen',
    email: 'jamie@example.com',
    memberSince: '2024',
    username: 'jamie.chen',
  },
  deliveryPreference: {
    defaultAddress: '42 Garden Lane, Apt 5B',
    deliveryInstructions: 'Leave at door',
    preferredWindow: 'Today, before dinner',
    substitutionPreference: 'Replace unavailable items',
  },
  paymentMethods: [
    {
      id: 'card-1',
      brand: 'Visa',
      expiryMonth: 8,
      expiryYear: 2029,
      isDefault: true,
      lastFour: '4242',
    },
  ],
  orders: [
    {
      id: 'order-1',
      orderNumber: 'GG-2048',
      placedAt: '2024-05-12T18:32:00.000Z',
      status: 'delivered',
      total: 36,
      currency: 'USD',
      items: [
        {
          productId: catalogProducts[0].id,
          productName: catalogProducts[0].name,
          quantity: 1,
          unit: catalogProducts[0].unit,
        },
      ],
    },
  ],
};

function renderAccount(repository: AccountRepository) {
  const catalogRepository: CatalogRepository = {
    getCatalog: jest.fn().mockResolvedValue({
      categories: catalogCategories,
      products: catalogProducts,
      settings: catalogSettings,
    }),
  };
  const storage: CartStorage = {
    load: jest.fn().mockResolvedValue([]),
    save: jest.fn().mockResolvedValue(undefined),
  };

  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <CatalogProvider repository={catalogRepository}>
        <CartProvider storage={storage}>
          <AccountScreen repository={repository} />
        </CartProvider>
      </CatalogProvider>
    </SafeAreaProvider>,
  );
}

test('renders account information with delivery preferences collapsed by default', async () => {
  const repository: AccountRepository = {
    getAccount: jest.fn().mockResolvedValue(accountData),
    requestAccountDeletion: jest.fn(),
    signOut: jest.fn(),
  };
  const screen = await renderAccount(repository);

  expect(await screen.findByText('Personal information')).toBeTruthy();
  expect(screen.getByText('Jamie Chen')).toBeTruthy();
  expect(screen.getByText('Signed in as jamie@example.com')).toBeTruthy();
  expect(screen.getByText('jamie.chen')).toBeTruthy();
  expect(screen.getByText('••••••••')).toBeTruthy();
  expect(screen.getByText('Delivery preferences')).toBeTruthy();
  expect(screen.queryByText('42 Garden Lane, Apt 5B')).toBeNull();

  await fireEvent.press(screen.getByRole('button', { name: 'Expand delivery preferences' }));
  expect(await screen.findByText('42 Garden Lane, Apt 5B')).toBeTruthy();
  expect(screen.getByText('Replace unavailable items')).toBeTruthy();
});

test('adds a previous order back to the cart from history', async () => {
  const repository: AccountRepository = {
    getAccount: jest.fn().mockResolvedValue(accountData),
    requestAccountDeletion: jest.fn(),
    signOut: jest.fn(),
  };
  const screen = await renderAccount(repository);

  expect(await screen.findByText('GG-2048')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Reorder GG-2048' }));

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /Open cart, 1 item/ })).toBeTruthy();
  });
});

test('shows account as the active bottom navigation item and returns to shop', async () => {
  const repository: AccountRepository = {
    getAccount: jest.fn().mockResolvedValue(accountData),
    requestAccountDeletion: jest.fn(),
    signOut: jest.fn(),
  };
  const screen = await renderAccount(repository);

  expect(await screen.findByText('Personal information')).toBeTruthy();
  expect(screen.getByText('Shop')).toBeTruthy();
  expect(screen.getByText('You')).toBeTruthy();

  fireEvent.press(screen.getByRole('button', { name: 'Go to shop' }));

  expect(mockRouter.push).toHaveBeenCalledWith('/');
});

test('offers sign in and keeps navigation available when account details fail to load', async () => {
  const repository: AccountRepository = {
    getAccount: jest.fn().mockRejectedValue(new Error('Account requires sign in.')),
    requestAccountDeletion: jest.fn(),
    signOut: jest.fn(),
  };
  const screen = await renderAccount(repository);

  expect(await screen.findByText('Could not load account')).toBeTruthy();

  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  expect(mockRouter.push).toHaveBeenCalledWith('/sign-in');

  await fireEvent.press(screen.getByRole('button', { name: 'Go to shop' }));

  expect(mockRouter.push).toHaveBeenCalledWith('/');
});

test('signs out from the account page and returns to sign in', async () => {
  const repository: AccountRepository = {
    getAccount: jest.fn().mockResolvedValue(accountData),
    requestAccountDeletion: jest.fn(),
    signOut: jest.fn().mockResolvedValue(undefined),
  };
  const screen = await renderAccount(repository);

  expect(await screen.findByText('Personal information')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));

  await waitFor(() => {
    expect(repository.signOut).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith('/sign-in');
  });
});

test('requests account deletion, signs out, and returns to sign in', async () => {
  const repository: AccountRepository = {
    getAccount: jest.fn().mockResolvedValue(accountData),
    requestAccountDeletion: jest.fn().mockResolvedValue(undefined),
    signOut: jest.fn().mockResolvedValue(undefined),
  };
  const screen = await renderAccount(repository);

  expect(await screen.findByText('Personal information')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Delete account' }));
  expect(await screen.findByText('Delete your account?')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Confirm delete account' }));

  await waitFor(() => {
    expect(repository.requestAccountDeletion).toHaveBeenCalledTimes(1);
    expect(repository.signOut).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith('/sign-in');
  });
});

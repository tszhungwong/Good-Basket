import { fireEvent, render } from '@testing-library/react-native';

import { OrderConfirmationScreen } from './OrderConfirmationScreen';

const mockRouter = {
  back: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

test('shows the order result and returns to shopping', async () => {
  const screen = await render(
    <OrderConfirmationScreen
      currency="USD"
      orderNumber="GG-20260712-AB12"
      total={18.75}
    />,
  );

  expect(screen.getByText('GG-20260712-AB12')).toBeTruthy();
  expect(screen.getByText('$18.75')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Continue shopping' }));

  expect(mockRouter.replace).toHaveBeenCalledWith('/');
});

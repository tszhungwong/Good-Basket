import { fireEvent, render } from '@testing-library/react-native';

import { ScreenState } from './ScreenState';

test('renders a retry action when recovery is available', async () => {
  const onRetry = jest.fn();
  const screen = await render(
    <ScreenState
      icon="cloud-offline-outline"
      message="Check your connection and try again."
      onRetry={onRetry}
      title="Could not load products"
    />,
  );

  await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  expect(onRetry).toHaveBeenCalledTimes(1);
});

test('supports a context-specific recovery label', async () => {
  const onAction = jest.fn();
  const screen = await render(
    <ScreenState
      actionLabel="Start shopping"
      icon="bag-outline"
      message="Add a few goods from the storefront."
      onRetry={onAction}
      title="Your cart is empty"
    />,
  );

  await fireEvent.press(screen.getByRole('button', { name: 'Start shopping' }));
  expect(onAction).toHaveBeenCalledTimes(1);
});

test('supports a secondary recovery action', async () => {
  const onRetry = jest.fn();
  const onSignIn = jest.fn();
  const screen = await render(
    <ScreenState
      icon="person-circle-outline"
      message="Sign in to load your account."
      onRetry={onRetry}
      onSecondaryAction={onSignIn}
      secondaryActionLabel="Sign in"
      title="Could not load account"
    />,
  );

  await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

  expect(onRetry).toHaveBeenCalledTimes(1);
  expect(onSignIn).toHaveBeenCalledTimes(1);
});

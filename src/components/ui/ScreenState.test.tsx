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

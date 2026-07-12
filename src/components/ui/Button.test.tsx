import { fireEvent, render } from '@testing-library/react-native';

import { Button } from './Button';

test('runs the supplied action and exposes button semantics', async () => {
  const onPress = jest.fn();
  const screen = await render(<Button label="Add to cart" onPress={onPress} />);

  const button = screen.getByRole('button', { name: 'Add to cart' });
  await fireEvent.press(button);

  expect(onPress).toHaveBeenCalledTimes(1);
});

test('disables interaction while loading', async () => {
  const screen = await render(<Button label="Place order" loading />);
  const button = screen.getByRole('button', { name: 'Place order' });

  expect(button).toBeBusy();
  expect(button).toBeDisabled();
});

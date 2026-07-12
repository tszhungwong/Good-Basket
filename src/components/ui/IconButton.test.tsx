import { fireEvent, render } from '@testing-library/react-native';

import { IconButton } from './IconButton';

test('uses its accessibility label as the button name', async () => {
  const onPress = jest.fn();
  const screen = await render(
    <IconButton accessibilityLabel="Open cart" icon="bag-outline" onPress={onPress} />,
  );

  await fireEvent.press(screen.getByRole('button', { name: 'Open cart' }));
  expect(onPress).toHaveBeenCalledTimes(1);
});

import { fireEvent, render } from '@testing-library/react-native';

import { BottomNavigationBar } from './BottomNavigationBar';

test('marks the active bottom navigation item and calls enabled item actions', async () => {
  const onShopPress = jest.fn();
  const onAccountPress = jest.fn();
  const screen = await render(
    <BottomNavigationBar
      activeItem="shop"
      onAccountPress={onAccountPress}
      onShopPress={onShopPress}
    />,
  );

  expect(screen.getByRole('button', { name: 'Current tab, shop' })).toBeTruthy();

  fireEvent.press(screen.getByRole('button', { name: 'Go to account' }));
  expect(onAccountPress).toHaveBeenCalledTimes(1);

  fireEvent.press(screen.getByRole('button', { name: 'Explore unavailable' }));
  expect(onShopPress).not.toHaveBeenCalled();
});

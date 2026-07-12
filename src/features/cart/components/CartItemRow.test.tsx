import { fireEvent, render } from '@testing-library/react-native';

import type { CartLine } from '../cartTypes';
import { CartItemRow } from './CartItemRow';

const item: CartLine = {
  productId: 'product-1',
  name: 'Tomatoes',
  imageUrl: 'tomato.jpg',
  price: 4.5,
  unit: 'lb',
  stock: 4,
  quantity: 2,
};

test('shows line total and delegates quantity changes', async () => {
  const onDecrease = jest.fn();
  const onIncrease = jest.fn();
  const screen = await render(
    <CartItemRow
      currency="USD"
      item={item}
      onDecrease={onDecrease}
      onIncrease={onIncrease}
    />,
  );

  expect(screen.getByText('$9.00')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Decrease Tomatoes' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Increase Tomatoes' }));

  expect(onDecrease).toHaveBeenCalledTimes(1);
  expect(onIncrease).toHaveBeenCalledTimes(1);
});

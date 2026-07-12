import { fireEvent, render } from '@testing-library/react-native';

import { catalogProducts } from '@/test/catalogFixtures';

import { FeaturedProduct } from './FeaturedProduct';

test('supports details and add actions for the featured product', async () => {
  const onAdd = jest.fn();
  const onPress = jest.fn();
  const product = catalogProducts[0];
  const screen = await render(
    <FeaturedProduct currency="USD" onAdd={onAdd} onPress={onPress} product={product} />,
  );

  await fireEvent.press(screen.getByRole('button', { name: `View ${product.name}` }));
  await fireEvent.press(screen.getByRole('button', { name: `Add ${product.name}` }));

  expect(onPress).toHaveBeenCalledTimes(1);
  expect(onAdd).toHaveBeenCalledTimes(1);
});

import { fireEvent, render } from '@testing-library/react-native';

import { mockProducts } from '@/test/mock_catalog';

import { ProductCard } from './ProductCard';

test('keeps product navigation and add actions separate', async () => {
  const onAdd = jest.fn();
  const onPress = jest.fn();
  const product = mockProducts[1];
  const screen = await render(
    <ProductCard currency="USD" onAdd={onAdd} onPress={onPress} product={product} />,
  );

  await fireEvent.press(screen.getByRole('button', { name: `View ${product.name}` }));
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(onAdd).not.toHaveBeenCalled();

  await fireEvent.press(screen.getByRole('button', { name: `Add ${product.name}` }));
  expect(onAdd).toHaveBeenCalledTimes(1);
});

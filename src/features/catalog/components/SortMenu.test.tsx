import { fireEvent, render } from '@testing-library/react-native';

import { SortMenu } from './SortMenu';

test('opens the option sheet and applies a sort choice', async () => {
  const onChange = jest.fn();
  const screen = await render(<SortMenu onChange={onChange} value="recommended" />);

  await fireEvent.press(screen.getByRole('button', { name: 'Sort products' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Price: low to high' }));

  expect(onChange).toHaveBeenCalledWith('price-low');
});

import { fireEvent, render } from '@testing-library/react-native';

import { SearchField } from './SearchField';

test('reports text changes and provides a clear action', async () => {
  const onChange = jest.fn();
  const screen = await render(<SearchField onChange={onChange} value="tomato" />);

  await fireEvent.changeText(screen.getByLabelText('Search products'), 'bread');
  expect(onChange).toHaveBeenCalledWith('bread');

  await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
  expect(onChange).toHaveBeenCalledWith('');
});

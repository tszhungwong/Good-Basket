import { fireEvent, render } from '@testing-library/react-native';

import { FormField } from './FormField';

test('composes a visible label, input, and inline error', async () => {
  const onChangeText = jest.fn();
  const screen = await render(
    <FormField
      error="Enter your name."
      label="Full name"
      onChangeText={onChangeText}
      required
      value=""
    />,
  );

  expect(screen.getByText('Full name *')).toBeTruthy();
  expect(screen.getByText('Enter your name.')).toBeTruthy();
  const input = screen.getByLabelText('Full name');
  expect(input).toHaveProp('aria-invalid', true);

  await fireEvent.changeText(input, 'Ari Lee');
  expect(onChangeText).toHaveBeenCalledWith('Ari Lee');
});

import { fireEvent, render } from '@testing-library/react-native';

import { QuantityStepper } from './QuantityStepper';

test('uses remove semantics at one and disables increase at stock limit', async () => {
  const onDecrease = jest.fn();
  const onIncrease = jest.fn();
  const screen = await render(
    <QuantityStepper
      label="Tomatoes"
      max={1}
      onDecrease={onDecrease}
      onIncrease={onIncrease}
      quantity={1}
    />,
  );

  await fireEvent.press(screen.getByRole('button', { name: 'Remove Tomatoes' }));
  expect(onDecrease).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Increase Tomatoes' })).toBeDisabled();
});

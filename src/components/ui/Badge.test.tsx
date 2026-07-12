import { render } from '@testing-library/react-native';

import { Badge } from './Badge';

test('renders its status label', async () => {
  const screen = await render(<Badge label="Fresh" tone="success" />);

  expect(screen.getByText('Fresh')).toBeTruthy();
});

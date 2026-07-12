import { fireEvent, render } from '@testing-library/react-native';

import { catalogCategories } from '@/test/catalogFixtures';

import { CategoryFilter } from './CategoryFilter';

test('exposes selected state and changes category on press', async () => {
  const onChange = jest.fn();
  const screen = await render(
    <CategoryFilter categories={catalogCategories} onChange={onChange} selectedId="all" />,
  );

  expect(screen.getByRole('button', { name: 'All products' })).toBeSelected();
  await fireEvent.press(screen.getByRole('button', { name: 'Fresh' }));

  expect(onChange).toHaveBeenCalledWith(catalogCategories[0].id);
});

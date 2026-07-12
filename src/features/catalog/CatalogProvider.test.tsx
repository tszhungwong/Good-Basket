import { fireEvent, render } from '@testing-library/react-native';
import { Pressable, Text, View } from 'react-native';

import { mockCategories, mockProducts, mockStoreSettings } from '@/test/mock_catalog';

import { CatalogProvider, useCatalog } from './CatalogProvider';
import type { CatalogRepository } from './catalogRepository';

const catalog = {
  categories: mockCategories,
  products: mockProducts,
  settings: mockStoreSettings,
};

function CatalogConsumer() {
  const { data, error, loading, retry } = useCatalog();

  return (
    <View>
      <Text>{loading ? 'Loading catalog' : data?.products[0]?.name}</Text>
      {error ? <Text>{error}</Text> : null}
      <Pressable accessibilityLabel="Retry catalog" accessibilityRole="button" onPress={retry}>
        <Text>Retry</Text>
      </Pressable>
    </View>
  );
}

test('loads catalog data from the supplied repository', async () => {
  const repository: CatalogRepository = {
    getCatalog: jest.fn().mockResolvedValue(catalog),
  };

  const screen = await render(
    <CatalogProvider repository={repository}>
      <CatalogConsumer />
    </CatalogProvider>,
  );

  expect(await screen.findByText('Weekend Market Basket')).toBeTruthy();
  expect(repository.getCatalog).toHaveBeenCalledTimes(1);
});

test('exposes a retry after loading fails', async () => {
  const repository: CatalogRepository = {
    getCatalog: jest
      .fn()
      .mockRejectedValueOnce(new Error('Catalog is offline.'))
      .mockResolvedValueOnce(catalog),
  };

  const screen = await render(
    <CatalogProvider repository={repository}>
      <CatalogConsumer />
    </CatalogProvider>,
  );

  expect(await screen.findByText('Catalog is offline.')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Retry catalog' }));

  expect(await screen.findByText('Weekend Market Basket')).toBeTruthy();
  expect(repository.getCatalog).toHaveBeenCalledTimes(2);
});

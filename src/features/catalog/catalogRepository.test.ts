import { mockCategories, mockProducts, mockStoreSettings } from '@/data/mock_catalog';

import { createCatalogRepository } from './catalogRepository';

test('uses mock data when no Supabase client is provided', async () => {
  const repository = createCatalogRepository(null);
  const catalog = await repository.getCatalog();

  expect(catalog.categories).toEqual(mockCategories);
  expect(catalog.products).toEqual(mockProducts);
  expect(catalog.settings).toEqual(mockStoreSettings);
});

test('returns defensive copies of mock arrays and tags', async () => {
  const repository = createCatalogRepository(null);
  const first = await repository.getCatalog();
  const second = await repository.getCatalog();

  expect(first.products).not.toBe(second.products);
  expect(first.products[0]).not.toBe(second.products[0]);
  expect(first.products[0].tags).not.toBe(second.products[0].tags);
});

import { createCatalogRepository } from './catalogRepository';

test('requires a Supabase client instead of falling back to local catalog data', async () => {
  const repository = createCatalogRepository(null);

  await expect(repository.getCatalog()).rejects.toThrow('Supabase is not configured.');
});

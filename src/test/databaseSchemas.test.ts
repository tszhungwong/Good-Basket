import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { catalogCategories, catalogProducts, catalogSettings } from '@/test/catalogFixtures';

const readSchema = (name: string) =>
  readFileSync(resolve(process.cwd(), 'supabase', name), 'utf8').toLocaleLowerCase();

test('focused schema contains the catalog, order, security, and RPC contracts', () => {
  const schema = readSchema('schema.sql');

  for (const table of ['categories', 'products', 'store_settings', 'orders', 'order_items']) {
    expect(schema).toContain(`create table if not exists public.${table}`);
  }

  expect(schema).toContain('create or replace function public.create_order');
  expect(schema).toContain('security definer');
  expect(schema).toContain('enable row level security');
  expect(schema).toContain('grant execute on function public.create_order');
  expect(schema).not.toContain('create table if not exists public.profiles');
  expect(schema.match(/on conflict \(id\) do update/g)).toHaveLength(3);
  expect(schema).not.toContain('stock = excluded.stock');
  expect(schema).toContain(`'${catalogSettings.currency.toLocaleLowerCase()}'`);
  expect(schema).toContain(catalogSettings.deliveryFee.toFixed(2));
  expect(schema).toContain(`'${catalogSettings.deliveryMessage.toLocaleLowerCase()}'`);
  expect(schema).toContain(catalogSettings.minimumOrder.toFixed(0));

  for (const category of catalogCategories) {
    expect(schema).toContain(category.id);
    expect(schema).toContain(`'${category.name.toLocaleLowerCase()}'`);
  }
  for (const product of catalogProducts) {
    expect(schema).toContain(product.id);
    expect(schema).toContain(`'${product.slug}'`);
    expect(schema).toContain(`'${product.name.toLocaleLowerCase()}'`);
  }
});

test('schema files contain no unfinished implementation markers', () => {
  const combined = readSchema('schema.sql');

  expect(combined).not.toMatch(/\btodo\b|\btbd\b|implement later|placeholder/);
});

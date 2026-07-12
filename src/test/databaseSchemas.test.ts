import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { mockCategories, mockProducts } from '@/data/mock_catalog';

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
  expect(schema.match(/on conflict \(id\) do nothing;/g)).toHaveLength(3);
  expect(schema).not.toContain('stock = excluded.stock');

  for (const category of mockCategories) {
    expect(schema).toContain(category.id);
  }
  for (const product of mockProducts) {
    expect(schema).toContain(product.id);
  }
});

test('future schema is one explicit extension for deferred auth and seller features', () => {
  const schema = readSchema('future_features_schema.sql');

  expect(schema).toContain('apply supabase/schema.sql first');
  for (const table of [
    'profiles',
    'saved_addresses',
    'product_variants',
    'inventory_movements',
    'order_status_history',
  ]) {
    expect(schema).toContain(`create table if not exists public.${table}`);
  }

  expect(schema).toContain('auth.uid()');
  expect(schema).toContain('create or replace function public.is_admin');
  expect(schema).toContain('create or replace function public.attach_order_customer');
  expect(schema).toContain('create trigger orders_attach_customer');
  expect(schema).toContain('create policy profiles_manage_admin');
  expect(schema).toContain('create policy saved_addresses_read_seller');
  expect(schema).not.toContain('create policy profiles_manage_seller');
  expect(schema).not.toContain('user_id = auth.uid() or public.is_seller()');
  expect(schema).not.toContain('grant usage on all sequences');
  expect(schema).not.toContain('insert into auth.users');
});

test('schema files contain no unfinished implementation markers', () => {
  const combined = `${readSchema('schema.sql')}\n${readSchema('future_features_schema.sql')}`;

  expect(combined).not.toMatch(/\btodo\b|\btbd\b|implement later|placeholder/);
});

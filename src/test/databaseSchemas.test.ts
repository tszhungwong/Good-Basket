import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { catalogCategories, catalogProducts, catalogSettings } from '@/test/catalogFixtures';

const readSchema = (name: string) =>
  readFileSync(resolve(process.cwd(), 'supabase', name), 'utf8').toLocaleLowerCase();

test('focused schema contains the catalog, order, security, and RPC contracts', () => {
  const schema = readSchema('schema.sql');

  for (const table of [
    'categories',
    'products',
    'store_settings',
    'orders',
    'order_items',
    'account_profiles',
    'delivery_preferences',
    'payment_methods',
  ]) {
    expect(schema).toContain(`create table if not exists public.${table}`);
  }

  expect(schema).toContain('create or replace function public.create_order');
  expect(schema).toContain('create or replace function public.get_account_overview');
  expect(schema).toContain('security definer');
  expect(schema).toContain('enable row level security');
  expect(schema).toContain('grant execute on function public.create_order');
  expect(schema).toContain('grant execute on function public.get_account_overview');
  expect(schema).toContain('create or replace function public.delete_current_user');
  expect(schema).toContain('grant execute on function public.delete_current_user() to authenticated');
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

test('schema creates an account profile for each Supabase Auth user', () => {
  const schema = readSchema('schema.sql');

  expect(schema).toContain('create schema if not exists private');
  expect(schema).toContain('create or replace function private.handle_new_auth_user()');
  expect(schema).toContain("set search_path = ''");
  expect(schema).toContain('after insert on auth.users');
  expect(schema).toContain('execute function private.handle_new_auth_user()');
  expect(schema).toContain(
    'revoke all on function private.handle_new_auth_user() from public, anon, authenticated',
  );
  expect(schema).toContain('insert into public.account_profiles');
  expect(schema).toContain('from auth.users as existing_user');
  expect(schema).toContain('on conflict (user_id) do nothing');
});

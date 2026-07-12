import type { SupabaseClient } from '@supabase/supabase-js';

import {
  deleteFromTable,
  insertIntoTable,
  queryTable,
  updateTable,
} from './database';

type Step =
  | ['select', string]
  | ['insert', unknown]
  | ['update', unknown]
  | ['delete']
  | ['eq', string, unknown]
  | ['order', string, unknown]
  | ['limit', number];

type QueryBuilder = PromiseLike<{ data: unknown; error: Error | null }> & {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
};

function createQueryClient(result: { data: unknown; error: Error | null }) {
  const steps: Step[] = [];
  const builder = {} as QueryBuilder;

  Object.assign(builder, {
    select: jest.fn((columns = '*'): QueryBuilder => {
      steps.push(['select', columns]);
      return builder;
    }),
    insert: jest.fn((values: unknown): QueryBuilder => {
      steps.push(['insert', values]);
      return builder;
    }),
    update: jest.fn((values: unknown): QueryBuilder => {
      steps.push(['update', values]);
      return builder;
    }),
    delete: jest.fn((): QueryBuilder => {
      steps.push(['delete']);
      return builder;
    }),
    eq: jest.fn((column: string, value: unknown): QueryBuilder => {
      steps.push(['eq', column, value]);
      return builder;
    }),
    order: jest.fn((column: string, options: unknown): QueryBuilder => {
      steps.push(['order', column, options]);
      return builder;
    }),
    limit: jest.fn((count: number) => {
      steps.push(['limit', count]);
      return Promise.resolve(result);
    }),
    then: (resolve: (value: typeof result) => void) => Promise.resolve(result).then(resolve),
  });

  const client = {
    from: jest.fn(() => builder),
  } as unknown as SupabaseClient;

  return { client, steps };
}

test('queries rows with columns, filters, ordering, and limit', async () => {
  const { client, steps } = createQueryClient({
    data: [{ id: 'category-1', name: 'Fresh' }],
    error: null,
  });

  await expect(
    queryTable<{ id: string; name: string }>('categories', {
      client,
      columns: 'id,name',
      filters: { active: true },
      order: { column: 'sort_order', ascending: true },
      limit: 5,
    }),
  ).resolves.toEqual([{ id: 'category-1', name: 'Fresh' }]);
  expect(client.from).toHaveBeenCalledWith('categories');
  expect(steps).toEqual([
    ['select', 'id,name'],
    ['eq', 'active', true],
    ['order', 'sort_order', { ascending: true }],
    ['limit', 5],
  ]);
});

test('inserts rows and returns selected data', async () => {
  const values = { name: 'New category', sort_order: 5 };
  const { client, steps } = createQueryClient({
    data: [{ id: 'category-2', ...values }],
    error: null,
  });

  await expect(insertIntoTable('categories', values, { client })).resolves.toEqual([
    { id: 'category-2', ...values },
  ]);
  expect(steps).toEqual([
    ['insert', values],
    ['select', '*'],
  ]);
});

test('updates rows by filters and returns selected data', async () => {
  const { client, steps } = createQueryClient({
    data: [{ id: 'category-2', active: false }],
    error: null,
  });

  await expect(
    updateTable('categories', { active: false }, { id: 'category-2' }, { client }),
  ).resolves.toEqual([{ id: 'category-2', active: false }]);
  expect(steps).toEqual([
    ['update', { active: false }],
    ['eq', 'id', 'category-2'],
    ['select', '*'],
  ]);
});

test('deletes rows by filters and returns selected data', async () => {
  const { client, steps } = createQueryClient({
    data: [{ id: 'category-2' }],
    error: null,
  });

  await expect(deleteFromTable('categories', { id: 'category-2' }, { client })).resolves.toEqual([
    { id: 'category-2' },
  ]);
  expect(steps).toEqual([
    ['delete'],
    ['eq', 'id', 'category-2'],
    ['select', '*'],
  ]);
});

test('throws a helpful error when a database operation fails', async () => {
  const { client } = createQueryClient({
    data: null,
    error: new Error('permission denied'),
  });

  await expect(queryTable('orders', { client })).rejects.toThrow(
    'Could not query table "orders".',
  );
});

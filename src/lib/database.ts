import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseClient } from './supabase';

type TableValue = string | number | boolean | null;

type QueryFilters = Record<string, TableValue>;

type DatabaseOptions = {
  client?: SupabaseClient | null;
  columns?: string;
};

type QueryOptions = DatabaseOptions & {
  filters?: QueryFilters;
  order?: {
    column: string;
    ascending?: boolean;
  };
  limit?: number;
};

function requireClient(client: SupabaseClient | null | undefined): SupabaseClient {
  const resolvedClient = client ?? getSupabaseClient();

  if (!resolvedClient) {
    throw new Error('Supabase is not configured.');
  }

  return resolvedClient;
}

function applyFilters<QueryBuilder>(query: QueryBuilder, filters: QueryFilters = {}): QueryBuilder {
  return Object.entries(filters).reduce(
    (currentQuery, [column, value]) =>
      (currentQuery as { eq: (filterColumn: string, filterValue: TableValue) => QueryBuilder }).eq(
        column,
        value,
      ),
    query,
  );
}

async function readResult<T>(
  table: string,
  action: 'query' | 'insert into' | 'update' | 'delete from',
  query: PromiseLike<{ data: unknown; error: Error | null }>,
): Promise<T[]> {
  const { data, error } = await query;

  if (error) {
    throw new Error(`Could not ${action} table "${table}".`, { cause: error });
  }

  return Array.isArray(data) ? (data as T[]) : [];
}

export async function queryTable<T>(
  table: string,
  options: QueryOptions = {},
): Promise<T[]> {
  const client = requireClient(options.client);
  let query = client.from(table).select(options.columns ?? '*');

  query = applyFilters(query, options.filters);

  if (options.order) {
    query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
  }

  if (options.limit !== undefined) {
    query = query.limit(options.limit);
  }

  return readResult<T>(table, 'query', query);
}

export async function insertIntoTable<T>(
  table: string,
  values: Record<string, unknown> | Record<string, unknown>[],
  options: DatabaseOptions = {},
): Promise<T[]> {
  const client = requireClient(options.client);
  const query = client.from(table).insert(values).select(options.columns ?? '*');

  return readResult<T>(table, 'insert into', query);
}

export async function updateTable<T>(
  table: string,
  values: Record<string, unknown>,
  filters: QueryFilters,
  options: DatabaseOptions = {},
): Promise<T[]> {
  const client = requireClient(options.client);
  const query = applyFilters(client.from(table).update(values), filters).select(
    options.columns ?? '*',
  );

  return readResult<T>(table, 'update', query);
}

export async function deleteFromTable<T>(
  table: string,
  filters: QueryFilters,
  options: DatabaseOptions = {},
): Promise<T[]> {
  const client = requireClient(options.client);
  const query = applyFilters(client.from(table).delete(), filters).select(options.columns ?? '*');

  return readResult<T>(table, 'delete from', query);
}

import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseClient } from '@/lib/supabase';

import type { CatalogData, Category, Product, StoreSettings } from './catalogTypes';

export interface CatalogRepository {
  getCatalog(): Promise<CatalogData>;
}

type CategoryRow = {
  id: string;
  name: string;
  sort_order: number;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category_id: string;
  price: number | string;
  unit: string;
  image_url: string;
  rating: number | string;
  stock: number;
  delivery_minutes: number;
  tags: string[] | null;
  badge: string | null;
  featured: boolean;
};

type StoreSettingsRow = {
  currency: string;
  delivery_fee: number | string;
  delivery_message: string;
  minimum_order: number | string;
};

async function getSupabaseCatalog(client: SupabaseClient): Promise<CatalogData> {
  const [categoryResult, productResult, settingsResult] = await Promise.all([
    client.from('categories').select('id,name,sort_order').order('sort_order'),
    client
      .from('products')
      .select(
        'id,slug,name,description,category_id,price,unit,image_url,rating,stock,delivery_minutes,tags,badge,featured',
      )
      .eq('active', true)
      .order('featured', { ascending: false })
      .order('name'),
    client
      .from('store_settings')
      .select('currency,delivery_fee,delivery_message,minimum_order')
      .limit(1)
      .maybeSingle(),
  ]);

  const firstError = categoryResult.error ?? productResult.error ?? settingsResult.error;
  if (firstError) {
    throw new Error('Could not load the shop catalog. Please try again.', {
      cause: firstError,
    });
  }

  if (!settingsResult.data) {
    throw new Error('Store settings are missing.');
  }

  const categoryRows = (categoryResult.data ?? []) as CategoryRow[];
  const productRows = (productResult.data ?? []) as ProductRow[];
  const settingsRow = settingsResult.data as StoreSettingsRow;
  const categoryNames = new Map(categoryRows.map((row) => [row.id, row.name]));

  const categories: Category[] = categoryRows.map((row) => ({
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
  }));

  const products: Product[] = productRows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    categoryId: row.category_id,
    categoryName: categoryNames.get(row.category_id) ?? 'Other',
    price: Number(row.price),
    unit: row.unit,
    imageUrl: row.image_url,
    rating: Number(row.rating),
    stock: row.stock,
    deliveryMinutes: row.delivery_minutes,
    tags: Array.isArray(row.tags) ? [...row.tags] : [],
    badge: row.badge,
    featured: row.featured,
  }));

  const settings: StoreSettings = {
    currency: settingsRow.currency,
    deliveryFee: Number(settingsRow.delivery_fee),
    deliveryMessage: settingsRow.delivery_message,
    minimumOrder: Number(settingsRow.minimum_order),
  };

  return { categories, products, settings };
}

export function createCatalogRepository(
  client: SupabaseClient | null = getSupabaseClient(),
): CatalogRepository {
  return {
    getCatalog: async () => {
      if (!client) {
        throw new Error('Supabase is not configured.');
      }

      return getSupabaseCatalog(client);
    },
  };
}

export type CatalogSort = 'recommended' | 'price-low' | 'fastest' | 'popular';

export type Category = {
  id: string;
  name: string;
  sortOrder: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  price: number;
  unit: string;
  imageUrl: string;
  rating: number;
  stock: number;
  deliveryMinutes: number;
  tags: string[];
  badge: string | null;
  featured: boolean;
};

export type StoreSettings = {
  currency: string;
  deliveryFee: number;
  deliveryMessage: string;
  minimumOrder: number;
};

export type CatalogData = {
  categories: Category[];
  products: Product[];
  settings: StoreSettings;
};

export type CatalogQuery = {
  categoryId: string;
  query: string;
  sort: CatalogSort;
};

import type {
  Category,
  Product,
  StoreSettings,
} from '@/features/catalog/catalogTypes';

export const catalogCategories: Category[] = [
  { id: '10000000-0000-4000-8000-000000000001', name: 'Fresh', sortOrder: 1 },
  { id: '10000000-0000-4000-8000-000000000002', name: 'Pantry', sortOrder: 2 },
  { id: '10000000-0000-4000-8000-000000000003', name: 'Bakery', sortOrder: 3 },
  { id: '10000000-0000-4000-8000-000000000004', name: 'Home', sortOrder: 4 },
];

export const catalogProducts: Product[] = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    slug: 'weekend-market-basket',
    name: 'Weekend Market Basket',
    description: 'Greens, tomatoes, sourdough, and pantry staples packed as one easy restock.',
    categoryId: '10000000-0000-4000-8000-000000000001',
    categoryName: 'Fresh',
    price: 36,
    unit: 'bundle',
    imageUrl:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=85',
    rating: 4.9,
    stock: 12,
    deliveryMinutes: 28,
    tags: ['bundle', 'produce', 'weekend', 'market'],
    badge: 'Best seller',
    featured: true,
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    slug: 'organic-tomatoes',
    name: 'Organic Tomatoes',
    description: 'Bright, firm tomatoes selected for salads, sandwiches, and sauces.',
    categoryId: '10000000-0000-4000-8000-000000000001',
    categoryName: 'Fresh',
    price: 4.5,
    unit: 'lb',
    imageUrl:
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=900&q=85',
    rating: 4.8,
    stock: 28,
    deliveryMinutes: 22,
    tags: ['vegetable', 'salad', 'organic'],
    badge: 'Fresh today',
    featured: false,
  },
  {
    id: '20000000-0000-4000-8000-000000000006',
    slug: 'country-sourdough',
    name: 'Country Sourdough',
    description: 'A naturally leavened loaf with a crisp crust and tender crumb.',
    categoryId: '10000000-0000-4000-8000-000000000003',
    categoryName: 'Bakery',
    price: 7.25,
    unit: 'loaf',
    imageUrl:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=85',
    rating: 4.9,
    stock: 14,
    deliveryMinutes: 26,
    tags: ['bread', 'breakfast', 'baked'],
    badge: 'Baked today',
    featured: false,
  },
];

export const catalogSettings: StoreSettings = {
  currency: 'USD',
  deliveryFee: 2.5,
  deliveryMessage: 'Today, before dinner',
  minimumOrder: 0,
};

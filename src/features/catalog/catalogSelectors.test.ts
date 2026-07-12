import { selectProducts } from './catalogSelectors';
import type { Product } from './catalogTypes';

const products: Product[] = [
  {
    id: '1',
    slug: 'tomato',
    name: 'Organic Tomatoes',
    description: 'Fresh salad tomatoes',
    categoryId: 'fresh',
    categoryName: 'Fresh',
    price: 4.5,
    unit: 'lb',
    imageUrl: 'tomato.jpg',
    rating: 4.8,
    stock: 8,
    deliveryMinutes: 20,
    tags: ['salad'],
    badge: 'Fresh',
    featured: false,
  },
  {
    id: '2',
    slug: 'oil',
    name: 'Olive Oil',
    description: 'Pantry cooking oil',
    categoryId: 'pantry',
    categoryName: 'Pantry',
    price: 18,
    unit: '500 ml',
    imageUrl: 'oil.jpg',
    rating: 4.6,
    stock: 4,
    deliveryMinutes: 30,
    tags: ['cooking'],
    badge: null,
    featured: true,
  },
  {
    id: '3',
    slug: 'bread',
    name: 'Sourdough Loaf',
    description: 'Slow-fermented bakery loaf',
    categoryId: 'bakery',
    categoryName: 'Bakery',
    price: 7.25,
    unit: 'loaf',
    imageUrl: 'bread.jpg',
    rating: 4.9,
    stock: 5,
    deliveryMinutes: 25,
    tags: ['breakfast'],
    badge: 'Baked today',
    featured: false,
  },
];

test('filters by normalized search text and category', () => {
  expect(
    selectProducts(products, {
      categoryId: 'fresh',
      query: '  SALAD ',
      sort: 'recommended',
    }),
  ).toEqual([products[0]]);
});

test('searches product name, description, and tags', () => {
  expect(
    selectProducts(products, {
      categoryId: 'all',
      query: 'breakfast',
      sort: 'recommended',
    }).map(({ id }) => id),
  ).toEqual(['3']);
});

test.each([
  ['price-low', ['1', '3', '2']],
  ['fastest', ['1', '3', '2']],
  ['popular', ['3', '1', '2']],
  ['recommended', ['2', '3', '1']],
] as const)('applies the %s sort without mutating source data', (sort, expectedIds) => {
  const sourceOrder = products.map(({ id }) => id);
  const result = selectProducts(products, { categoryId: 'all', query: '', sort });

  expect(result.map(({ id }) => id)).toEqual(expectedIds);
  expect(products.map(({ id }) => id)).toEqual(sourceOrder);
});

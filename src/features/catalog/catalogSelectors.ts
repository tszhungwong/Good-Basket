import type { CatalogQuery, Product } from './catalogTypes';

export function selectProducts(products: Product[], selection: CatalogQuery): Product[] {
  const query = selection.query.trim().toLocaleLowerCase();
  const matches = products.filter((product) => {
    const inCategory =
      selection.categoryId === 'all' || product.categoryId === selection.categoryId;
    const searchableText = [product.name, product.description, ...product.tags]
      .join(' ')
      .toLocaleLowerCase();

    return inCategory && (!query || searchableText.includes(query));
  });

  return [...matches].sort((first, second) => {
    if (selection.sort === 'price-low') {
      return first.price - second.price;
    }

    if (selection.sort === 'fastest') {
      return first.deliveryMinutes - second.deliveryMinutes;
    }

    if (selection.sort === 'popular') {
      return second.rating - first.rating;
    }

    return Number(second.featured) - Number(first.featured) || second.rating - first.rating;
  });
}

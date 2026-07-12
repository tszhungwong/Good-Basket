import { useLocalSearchParams } from 'expo-router';

import { ProductDetailScreen } from '@/features/catalog/screens/ProductDetailScreen';

export default function ProductDetailRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  return <ProductDetailScreen productId={id} />;
}

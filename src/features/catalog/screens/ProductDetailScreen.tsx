import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { ScreenState } from '@/components/ui/ScreenState';
import { useCart } from '@/features/cart/CartProvider';
import { formatCurrency } from '@/lib/format';
import { colors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

import { useCatalog } from '../CatalogProvider';

type ProductDetailScreenProps = {
  productId?: string;
};

export function ProductDetailScreen({ productId }: ProductDetailScreenProps) {
  const router = useRouter();
  const { data, error, loading, retry } = useCatalog();
  const { addProduct, items } = useCart();

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenState
          icon="cloud-offline-outline"
          message={error}
          onRetry={retry}
          title="Could not load this product"
        />
      </SafeAreaView>
    );
  }

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenState
          icon="cube-outline"
          message="Loading product details and availability."
          title="Opening product"
        />
      </SafeAreaView>
    );
  }

  const product = data.products.find((candidate) => candidate.id === productId);
  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenState
          actionLabel="Back to shop"
          icon="search-outline"
          message="This product is no longer available in the current catalog."
          onRetry={() => router.replace('/')}
          title="Product not found"
        />
      </SafeAreaView>
    );
  }

  const cartLine = items.find((item) => item.productId === product.id);
  const soldOut = product.stock <= 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ImageBackground
          accessibilityLabel={product.name}
          imageStyle={styles.heroImage}
          resizeMode="cover"
          source={{ uri: product.imageUrl }}
          style={styles.hero}
        >
          <View style={styles.heroShade}>
            <View style={styles.heroHeader}>
              <IconButton
                accessibilityLabel="Go back"
                icon="arrow-back"
                onPress={() => router.back()}
              />
              {product.badge ? <Badge label={product.badge} tone="accent" /> : null}
            </View>
          </View>
        </ImageBackground>

        <View style={styles.detailHeader}>
          <View style={styles.titleWrap}>
            <Text style={styles.category}>{product.categoryName}</Text>
            <Text style={styles.title}>{product.name}</Text>
          </View>
          <View style={styles.priceWrap}>
            <Text style={styles.price}>{formatCurrency(product.price, data.settings.currency)}</Text>
            <Text style={styles.unit}>per {product.unit}</Text>
          </View>
        </View>

        <Text style={styles.description}>{product.description}</Text>

        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Ionicons color={colors.brass} name="star" size={20} />
            <Text style={styles.metricValue}>{product.rating.toFixed(1)}</Text>
            <Text style={styles.metricLabel}>Rating</Text>
          </View>
          <View style={styles.metric}>
            <Ionicons color={colors.brand} name="cube-outline" size={20} />
            <Text style={styles.metricValue}>{product.stock}</Text>
            <Text style={styles.metricLabel}>In stock</Text>
          </View>
          <View style={styles.metric}>
            <Ionicons color={colors.accent} name="time-outline" size={20} />
            <Text style={styles.metricValue}>{product.deliveryMinutes}</Text>
            <Text style={styles.metricLabel}>Minutes</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            accessibilityLabel={`Add ${product.name}`}
            disabled={soldOut || cartLine?.quantity === product.stock}
            icon="add"
            label={soldOut ? 'Sold out' : cartLine ? 'Add another' : 'Add to cart'}
            onPress={() => addProduct(product)}
          />
          {cartLine ? (
            <Button
              icon="bag-outline"
              label="View cart"
              onPress={() => router.push('/cart')}
              variant="outline"
            />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    width: '100%',
    maxWidth: layout.maxReadingWidth,
    alignSelf: 'center',
    gap: spacing.lg,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  hero: {
    minHeight: 340,
    overflow: 'hidden',
    borderRadius: layout.radius,
    backgroundColor: colors.brandSoft,
  },
  heroImage: {
    borderRadius: layout.radius,
  },
  heroShade: {
    minHeight: 340,
    padding: spacing.md,
    backgroundColor: 'rgba(8, 18, 13, 0.16)',
  },
  heroHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  titleWrap: {
    minWidth: 0,
    flex: 1,
    gap: spacing.xxs,
  },
  category: {
    color: colors.brand,
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.small,
    lineHeight: typography.lineHeights.small,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontFamily: typography.fonts.headingBold,
    fontSize: typography.sizes.display,
    lineHeight: typography.lineHeights.display,
  },
  priceWrap: {
    alignItems: 'flex-end',
  },
  price: {
    color: colors.ink,
    fontFamily: typography.fonts.headingSemibold,
    fontSize: typography.sizes.title,
    lineHeight: typography.lineHeights.title,
  },
  unit: {
    color: colors.muted,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
  },
  description: {
    color: colors.muted,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  metric: {
    minWidth: 0,
    flex: 1,
    gap: spacing.xxs,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: layout.radius,
    padding: spacing.sm,
    backgroundColor: colors.surface,
  },
  metricValue: {
    color: colors.ink,
    fontFamily: typography.fonts.headingSemibold,
    fontSize: typography.sizes.lead,
    lineHeight: typography.lineHeights.lead,
  },
  metricLabel: {
    color: colors.muted,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
  },
  actions: {
    gap: spacing.sm,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui/IconButton';
import { ScreenState } from '@/components/ui/ScreenState';
import { useCart } from '@/features/cart/CartProvider';
import { formatCurrency } from '@/lib/format';
import { colors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

import { useCatalog } from '../CatalogProvider';
import { selectProducts } from '../catalogSelectors';
import type { CatalogSort, Product } from '../catalogTypes';
import { CategoryFilter } from '../components/CategoryFilter';
import { FeaturedProduct } from '../components/FeaturedProduct';
import { ProductCard } from '../components/ProductCard';
import { SearchField } from '../components/SearchField';
import { SortMenu } from '../components/SortMenu';

export function StorefrontScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { data, error, loading, retry } = useCatalog();
  const { addProduct, itemCount, subtotal } = useCart();
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [sort, setSort] = useState<CatalogSort>('recommended');

  const products = useMemo(
    () =>
      data
        ? selectProducts(data.products, {
            categoryId,
            query,
            sort,
          })
        : [],
    [categoryId, data, query, sort],
  );

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenState
          icon="cloud-offline-outline"
          message={error}
          onRetry={retry}
          title="Could not load products"
        />
      </SafeAreaView>
    );
  }

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenState
          icon="basket-outline"
          message="Fresh products and pantry goods are being prepared."
          title="Stocking the shelves"
        />
      </SafeAreaView>
    );
  }

  const featured = data.products.find((product) => product.featured) ?? data.products[0];
  const wideGrid = width >= layout.tabletBreakpoint;
  const openProduct = (product: Product) =>
    router.push({ pathname: '/products/[id]', params: { id: product.id } });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.identity}>
            <View style={styles.logo}>
              <Ionicons color={colors.onBrand} name="storefront-outline" size={22} />
            </View>
            <View style={styles.identityCopy}>
              <Text style={styles.eyebrow}>Neighborhood market</Text>
              <Text style={styles.brandName}>Good Goods</Text>
            </View>
          </View>
          <View style={styles.cartButtonWrap}>
            <IconButton
              accessibilityLabel={`Open cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
              icon="bag-outline"
              onPress={() => router.push('/cart')}
            />
            {itemCount > 0 ? (
              <View style={styles.cartCount}>
                <Text style={styles.cartCountText}>{itemCount > 99 ? '99+' : itemCount}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <SearchField onChange={setQuery} value={query} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          itemCount > 0 && styles.scrollContentWithCart,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.deliveryStrip}>
            <View style={styles.deliveryIcon}>
              <Ionicons color={colors.brass} name="bicycle-outline" size={22} />
            </View>
            <View style={styles.deliveryCopy}>
              <Text style={styles.deliveryTitle}>Delivery in about 30 minutes</Text>
              <Text style={styles.deliveryText}>{data.settings.deliveryMessage}</Text>
            </View>
            <Ionicons color={colors.brass} name="time-outline" size={20} />
          </View>

          {featured ? (
            <FeaturedProduct
              currency={data.settings.currency}
              onAdd={() => addProduct(featured)}
              onPress={() => openProduct(featured)}
              product={featured}
            />
          ) : null}

          <View style={styles.shelfHeading}>
            <View style={styles.shelfCopy}>
              <Text style={styles.eyebrow}>Shop shelf</Text>
              <Text style={styles.sectionTitle}>Fresh picks</Text>
            </View>
            <SortMenu onChange={setSort} value={sort} />
          </View>

          <CategoryFilter
            categories={data.categories}
            onChange={setCategoryId}
            selectedId={categoryId}
          />

          {products.length > 0 ? (
            <View style={styles.grid}>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  currency={data.settings.currency}
                  onAdd={() => addProduct(product)}
                  onPress={() => openProduct(product)}
                  product={product}
                  style={wideGrid ? styles.gridCardWide : styles.gridCardNarrow}
                />
              ))}
            </View>
          ) : (
            <ScreenState
              actionLabel="Clear search"
              icon="search-outline"
              message="Try a different search or choose another category."
              onRetry={() => {
                setQuery('');
                setCategoryId('all');
              }}
              title="No matching products"
            />
          )}
        </View>
      </ScrollView>

      {itemCount > 0 ? (
        <View style={styles.cartBar}>
          <Pressable
            accessibilityLabel={`View cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}, ${formatCurrency(subtotal, data.settings.currency)}`}
            accessibilityRole="button"
            onPress={() => router.push('/cart')}
            style={({ pressed }) => [styles.cartBarButton, pressed && styles.cartBarPressed]}
          >
            <View style={styles.cartBarLead}>
              <Ionicons color={colors.onBrand} name="bag-outline" size={20} />
              <Text style={styles.cartBarText}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </Text>
            </View>
            <View style={styles.cartBarLead}>
              <Text style={styles.cartBarTotal}>
                {formatCurrency(subtotal, data.settings.currency)}
              </Text>
              <Ionicons color={colors.onBrand} name="chevron-forward" size={18} />
            </View>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.canvas,
  },
  headerTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  identity: {
    minWidth: 0,
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  identityCopy: {
    minWidth: 0,
    flex: 1,
  },
  logo: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: layout.radius,
    backgroundColor: colors.brand,
  },
  eyebrow: {
    color: colors.brand,
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
    textTransform: 'uppercase',
  },
  brandName: {
    color: colors.ink,
    fontFamily: typography.fonts.headingBold,
    fontSize: typography.sizes.title,
    lineHeight: typography.lineHeights.title,
  },
  cartButtonWrap: {
    position: 'relative',
  },
  cartCount: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 21,
    height: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.canvas,
    borderRadius: 11,
    paddingHorizontal: 4,
    backgroundColor: colors.accent,
  },
  cartCountText: {
    color: colors.onBrand,
    fontFamily: typography.fonts.bodyBold,
    fontSize: 10,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  scrollContentWithCart: {
    paddingBottom: 112,
  },
  content: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    gap: spacing.lg,
    padding: spacing.md,
  },
  deliveryStrip: {
    minHeight: 72,
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#ECD9AE',
    borderRadius: layout.radius,
    padding: spacing.sm,
    backgroundColor: colors.brassSoft,
  },
  deliveryIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: layout.radius,
    backgroundColor: colors.surface,
  },
  deliveryCopy: {
    minWidth: 0,
    flex: 1,
  },
  deliveryTitle: {
    color: colors.ink,
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.small,
    lineHeight: typography.lineHeights.small,
  },
  deliveryText: {
    color: colors.muted,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
  },
  shelfHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  shelfCopy: {
    minWidth: 0,
    flex: 1,
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: typography.fonts.headingBold,
    fontSize: typography.sizes.title,
    lineHeight: typography.lineHeights.title,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridCardNarrow: {
    width: '100%',
  },
  gridCardWide: {
    width: '48.9%',
  },
  cartBar: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    padding: spacing.md,
    backgroundColor: colors.canvas,
  },
  cartBarButton: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    minHeight: 56,
    alignSelf: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: layout.radius,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.brand,
  },
  cartBarPressed: {
    backgroundColor: colors.brandPressed,
  },
  cartBarLead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  cartBarText: {
    color: colors.onBrand,
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.body,
  },
  cartBarTotal: {
    color: colors.onBrand,
    fontFamily: typography.fonts.headingSemibold,
    fontSize: typography.sizes.body,
  },
});

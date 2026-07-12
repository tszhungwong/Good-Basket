import { Ionicons } from '@expo/vector-icons';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/IconButton';
import { formatCurrency } from '@/lib/format';
import { colors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

import type { Product } from '../catalogTypes';

type ProductCardProps = {
  currency: string;
  onAdd: () => void;
  onPress: () => void;
  product: Product;
  style?: StyleProp<ViewStyle>;
};

export function ProductCard({ currency, onAdd, onPress, product, style }: ProductCardProps) {
  const soldOut = product.stock <= 0;

  return (
    <View style={[styles.card, style]}>
      <Pressable
        accessibilityLabel={`View ${product.name}`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.details, pressed && styles.pressed]}
      >
        <Image
          accessibilityLabel={product.name}
          resizeMode="cover"
          source={{ uri: product.imageUrl }}
          style={styles.image}
        />
        <View style={styles.content}>
          <View style={styles.metaRow}>
            {product.badge ? <Badge label={product.badge} tone="brand" /> : <View />}
            <View style={styles.rating}>
              <Ionicons color={colors.brass} name="star" size={15} />
              <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
            </View>
          </View>
          <Text numberOfLines={2} style={styles.name}>
            {product.name}
          </Text>
          <Text numberOfLines={2} style={styles.description}>
            {product.description}
          </Text>
        </View>
      </Pressable>

      <View style={styles.footer}>
        <View style={styles.priceWrap}>
          <Text style={styles.price}>{formatCurrency(product.price, currency)}</Text>
          <Text style={styles.unit}>per {product.unit}</Text>
        </View>
        <View style={styles.deliveryWrap}>
          <Text style={[styles.stock, soldOut && styles.soldOut]}>
            {soldOut ? 'Sold out' : `${product.stock} in stock`}
          </Text>
          <Text style={styles.delivery}>{product.deliveryMinutes} min</Text>
        </View>
        <IconButton
          accessibilityLabel={`Add ${product.name}`}
          disabled={soldOut}
          icon="add"
          onPress={onAdd}
          tone="brand"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: layout.radius,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  details: {
    flex: 1,
  },
  pressed: {
    opacity: 0.78,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: colors.brandSoft,
  },
  content: {
    gap: spacing.xs,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  metaRow: {
    minHeight: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rating: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xxs,
  },
  ratingText: {
    color: colors.muted,
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
  },
  name: {
    color: colors.ink,
    fontFamily: typography.fonts.headingSemibold,
    fontSize: typography.sizes.lead,
    lineHeight: typography.lineHeights.lead,
  },
  description: {
    minHeight: 40,
    color: colors.muted,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.small,
    lineHeight: typography.lineHeights.small,
  },
  footer: {
    minHeight: 76,
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    padding: spacing.md,
  },
  priceWrap: {
    flex: 1,
  },
  price: {
    color: colors.ink,
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.lead,
    lineHeight: typography.lineHeights.lead,
  },
  unit: {
    color: colors.muted,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
  },
  deliveryWrap: {
    alignItems: 'flex-end',
  },
  stock: {
    color: colors.success,
    fontFamily: typography.fonts.bodySemibold,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
  },
  soldOut: {
    color: colors.danger,
  },
  delivery: {
    color: colors.muted,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
  },
});

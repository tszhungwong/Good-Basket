import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/format';
import { colors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

import type { Product } from '../catalogTypes';

type FeaturedProductProps = {
  currency: string;
  onAdd: () => void;
  onPress: () => void;
  product: Product;
};

export function FeaturedProduct({
  currency,
  onAdd,
  onPress,
  product,
}: FeaturedProductProps) {
  return (
    <ImageBackground
      accessibilityLabel={product.name}
      imageStyle={styles.image}
      resizeMode="cover"
      source={{ uri: product.imageUrl }}
      style={styles.card}
    >
      <View style={styles.scrim}>
        <Pressable
          accessibilityLabel={`View ${product.name}`}
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => [styles.copy, pressed && styles.pressed]}
        >
          <Badge label={product.badge ?? 'Featured'} tone="accent" />
          <Text style={styles.kicker}>Market basket</Text>
          <Text style={styles.title}>Weekend restock, packed fast</Text>
          <Text style={styles.description}>{product.description}</Text>
        </Pressable>

        <View style={styles.footer}>
          <View>
            <Text style={styles.priceLabel}>Bundle from</Text>
            <Text style={styles.price}>{formatCurrency(product.price, currency)}</Text>
          </View>
          <View style={styles.action}>
            <Button
              accessibilityLabel={`${product.stock > 0 ? 'Add' : 'Sold out'} ${product.name}`}
              disabled={product.stock <= 0}
              icon="add"
              label={product.stock > 0 ? 'Add' : 'Sold out'}
              onPress={onAdd}
            />
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 320,
    overflow: 'hidden',
    borderRadius: layout.radius,
    backgroundColor: colors.brand,
  },
  image: {
    borderRadius: layout.radius,
  },
  scrim: {
    minHeight: 320,
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: 'rgba(8, 18, 13, 0.54)',
  },
  copy: {
    maxWidth: 540,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.78,
  },
  kicker: {
    marginTop: spacing.sm,
    color: colors.brassSoft,
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.small,
    lineHeight: typography.lineHeights.small,
    textTransform: 'uppercase',
  },
  title: {
    maxWidth: 430,
    color: colors.onBrand,
    fontFamily: typography.fonts.headingBold,
    fontSize: typography.sizes.display,
    lineHeight: typography.lineHeights.display,
  },
  description: {
    maxWidth: 500,
    color: '#F4F7F5',
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  footer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  priceLabel: {
    color: '#DCE6E0',
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
  },
  price: {
    color: colors.onBrand,
    fontFamily: typography.fonts.headingSemibold,
    fontSize: typography.sizes.title,
    lineHeight: typography.lineHeights.title,
  },
  action: {
    minWidth: 112,
  },
});

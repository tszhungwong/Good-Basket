import { Image, StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@/lib/format';
import { colors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

import type { CartLine } from '../cartTypes';
import { QuantityStepper } from './QuantityStepper';

type CartItemRowProps = {
  currency: string;
  item: CartLine;
  onDecrease: () => void;
  onIncrease: () => void;
};

export function CartItemRow({ currency, item, onDecrease, onIncrease }: CartItemRowProps) {
  return (
    <View style={styles.row}>
      <Image
        accessibilityLabel={item.name}
        resizeMode="cover"
        source={{ uri: item.imageUrl }}
        style={styles.image}
      />
      <View style={styles.body}>
        <View style={styles.heading}>
          <View style={styles.copy}>
            <Text numberOfLines={2} style={styles.name}>
              {item.name}
            </Text>
            <Text style={styles.meta}>
              {formatCurrency(item.price, currency)} per {item.unit}
            </Text>
          </View>
          <Text style={styles.total}>{formatCurrency(item.price * item.quantity, currency)}</Text>
        </View>
        <QuantityStepper
          label={item.name}
          max={item.stock}
          onDecrease={onDecrease}
          onIncrease={onIncrease}
          quantity={item.quantity}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: layout.radius,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  image: {
    width: 88,
    height: 88,
    borderRadius: layout.radius,
    backgroundColor: colors.brandSoft,
  },
  body: {
    minWidth: 0,
    flex: 1,
    gap: spacing.sm,
  },
  heading: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  copy: {
    minWidth: 0,
    flex: 1,
  },
  name: {
    color: colors.ink,
    fontFamily: typography.fonts.headingSemibold,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  meta: {
    color: colors.muted,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
  },
  total: {
    color: colors.ink,
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
});

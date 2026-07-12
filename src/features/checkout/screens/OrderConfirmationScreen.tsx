import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/format';
import { colors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type OrderConfirmationScreenProps = {
  currency: string;
  orderNumber: string;
  total: number;
};

export function OrderConfirmationScreen({
  currency,
  orderNumber,
  total,
}: OrderConfirmationScreenProps) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View accessibilityRole="summary" style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons color={colors.onBrand} name="checkmark" size={40} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Order received</Text>
          <Text style={styles.title}>Your goods are being prepared.</Text>
          <Text style={styles.description}>
            The shop will contact you to confirm delivery. No payment has been collected.
          </Text>
        </View>

        <View style={styles.receipt}>
          <View style={styles.receiptLine}>
            <Text style={styles.receiptLabel}>Order number</Text>
            <Text style={styles.orderNumber}>{orderNumber}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.receiptLine}>
            <Text style={styles.receiptLabel}>Order total</Text>
            <Text style={styles.total}>{formatCurrency(total, currency)}</Text>
          </View>
        </View>

        <Button
          icon="storefront-outline"
          label="Continue shopping"
          onPress={() => router.replace('/')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.canvas,
  },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  iconWrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: layout.radius,
    backgroundColor: colors.success,
  },
  copy: {
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.success,
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
  description: {
    color: colors.muted,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  receipt: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: layout.radius,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  receiptLine: {
    gap: spacing.xxs,
  },
  receiptLabel: {
    color: colors.muted,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.small,
    lineHeight: typography.lineHeights.small,
  },
  orderNumber: {
    color: colors.ink,
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.lead,
    lineHeight: typography.lineHeights.lead,
  },
  total: {
    color: colors.ink,
    fontFamily: typography.fonts.headingBold,
    fontSize: typography.sizes.title,
    lineHeight: typography.lineHeights.title,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
  },
});

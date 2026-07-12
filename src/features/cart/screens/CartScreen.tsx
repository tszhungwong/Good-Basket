import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { ScreenState } from '@/components/ui/ScreenState';
import { useCatalog } from '@/features/catalog/CatalogProvider';
import { formatCurrency } from '@/lib/format';
import { colors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

import { useCart } from '../CartProvider';
import { CartItemRow } from '../components/CartItemRow';

export function CartScreen() {
  const router = useRouter();
  const [clearConfirmationOpen, setClearConfirmationOpen] = useState(false);
  const { data, error, loading, retry } = useCatalog();
  const {
    clearCart,
    hydrated,
    itemCount,
    items,
    setQuantity,
    storageError,
    subtotal,
  } = useCart();

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenState
          icon="cloud-offline-outline"
          message={error}
          onRetry={retry}
          title="Could not load your cart totals"
        />
      </SafeAreaView>
    );
  }

  if (!hydrated || loading || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenState
          icon="bag-handle-outline"
          message="Your saved products are being restored."
          title="Loading your cart"
        />
      </SafeAreaView>
    );
  }

  const deliveryFee = items.length > 0 ? data.settings.deliveryFee : 0;
  const total = subtotal + deliveryFee;

  const confirmClear = () => {
    clearCart();
    setClearConfirmationOpen(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <IconButton accessibilityLabel="Go back" icon="arrow-back" onPress={() => router.back()} />
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>Shopping cart</Text>
          <Text style={styles.title}>Your basket</Text>
        </View>
        {items.length > 0 ? (
          <IconButton
            accessibilityLabel="Clear cart"
            icon="trash-outline"
            onPress={() => setClearConfirmationOpen(true)}
            tone="danger"
          />
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {clearConfirmationOpen && items.length > 0 ? (
        <View accessibilityRole="alert" style={styles.clearConfirmation}>
          <Text style={styles.clearPrompt}>Remove every item from your cart?</Text>
          <View style={styles.clearActions}>
            <IconButton
              accessibilityLabel="Cancel clear cart"
              icon="close"
              onPress={() => setClearConfirmationOpen(false)}
            />
            <IconButton
              accessibilityLabel="Confirm clear cart"
              icon="trash-outline"
              onPress={confirmClear}
              tone="danger"
            />
          </View>
        </View>
      ) : null}

      {items.length === 0 ? (
        <ScreenState
          actionLabel="Start shopping"
          icon="bag-outline"
          message="Add a few goods from the storefront and they will appear here."
          onRetry={() => router.replace('/')}
          title="Your cart is empty"
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {storageError ? (
              <View style={styles.warning}>
                <Text style={styles.warningText}>{storageError}</Text>
              </View>
            ) : null}
            <View style={styles.list}>
              {items.map((item) => (
                <CartItemRow
                  key={item.productId}
                  currency={data.settings.currency}
                  item={item}
                  onDecrease={() => setQuantity(item.productId, item.quantity - 1)}
                  onIncrease={() => setQuantity(item.productId, item.quantity + 1)}
                />
              ))}
            </View>
          </ScrollView>

          <View style={styles.checkoutBar}>
            <View style={styles.summary}>
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>Subtotal ({itemCount})</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(subtotal, data.settings.currency)}
                </Text>
              </View>
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>Delivery</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(deliveryFee, data.settings.currency)}
                </Text>
              </View>
              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(total, data.settings.currency)}
                </Text>
              </View>
            </View>
            <Button
              icon="arrow-forward"
              label="Continue to checkout"
              onPress={() => router.push('/checkout')}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    padding: spacing.md,
  },
  headingCopy: {
    minWidth: 0,
    flex: 1,
  },
  eyebrow: {
    color: colors.brand,
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontFamily: typography.fonts.headingBold,
    fontSize: typography.sizes.title,
    lineHeight: typography.lineHeights.title,
  },
  headerSpacer: {
    width: layout.touchTarget,
  },
  clearConfirmation: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.accentSoft,
  },
  clearPrompt: {
    minWidth: 0,
    flex: 1,
    color: colors.ink,
    fontFamily: typography.fonts.bodySemibold,
    fontSize: typography.sizes.small,
    lineHeight: typography.lineHeights.small,
  },
  clearActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  content: {
    width: '100%',
    maxWidth: layout.maxReadingWidth,
    alignSelf: 'center',
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: 240,
  },
  warning: {
    borderWidth: 1,
    borderColor: '#ECD9AE',
    borderRadius: layout.radius,
    padding: spacing.sm,
    backgroundColor: colors.brassSoft,
  },
  warningText: {
    color: colors.ink,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.small,
    lineHeight: typography.lineHeights.small,
  },
  list: {
    gap: spacing.sm,
  },
  checkoutBar: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  summary: {
    width: '100%',
    maxWidth: layout.maxReadingWidth,
    alignSelf: 'center',
    gap: spacing.xs,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: colors.muted,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.small,
  },
  summaryValue: {
    color: colors.ink,
    fontFamily: typography.fonts.bodySemibold,
    fontSize: typography.sizes.small,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: spacing.xs,
  },
  totalLabel: {
    color: colors.ink,
    fontFamily: typography.fonts.headingSemibold,
    fontSize: typography.sizes.lead,
  },
  totalValue: {
    color: colors.ink,
    fontFamily: typography.fonts.headingBold,
    fontSize: typography.sizes.lead,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BottomNavigationBar,
  bottomNavigationHeight,
} from '@/components/navigation/BottomNavigationBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { ScreenState } from '@/components/ui/ScreenState';
import { useCart } from '@/features/cart/CartProvider';
import { useCatalog } from '@/features/catalog/CatalogProvider';
import type { Product } from '@/features/catalog/catalogTypes';
import { formatCurrency } from '@/lib/format';
import { colors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

import {
  createAccountRepository,
  type AccountData,
  type AccountOrder,
  type AccountRepository,
} from '../accountRepository';

type AccountScreenProps = {
  repository?: AccountRepository;
};

const statusLabels: Record<AccountOrder['status'], string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'On the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function AccountScreen({ repository }: AccountScreenProps) {
  const router = useRouter();
  const repositoryRef = useRef(repository ?? createAccountRepository());
  const { addProduct, itemCount } = useCart();
  const { data: catalog } = useCatalog();
  const [account, setAccount] = useState<AccountData | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestId, setRequestId] = useState(0);
  const [signingOut, setSigningOut] = useState(false);

  const productById = useMemo(() => {
    const products = new Map<string, Product>();
    for (const product of catalog?.products ?? []) {
      products.set(product.id, product);
    }
    return products;
  }, [catalog?.products]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setRequestId((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;

    repositoryRef.current
      .getAccount()
      .then((nextAccount) => {
        if (active) {
          setAccount(nextAccount);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Could not load your account. Please try again.',
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [requestId]);

  const reorder = (order: AccountOrder) => {
    for (const item of order.items) {
      if (!item.productId) {
        continue;
      }
      const product = productById.get(item.productId);
      if (!product) {
        continue;
      }
      for (let count = 0; count < item.quantity; count += 1) {
        addProduct(product);
      }
    }
  };

  const signOut = async () => {
    setActionError(null);
    setSigningOut(true);
    try {
      await repositoryRef.current.signOut();
      router.replace('/sign-in');
    } catch (signOutError: unknown) {
      setActionError(
        signOutError instanceof Error
          ? signOutError.message
          : 'Could not sign out. Please try again.',
      );
      setSigningOut(false);
    }
  };

  const deleteAccount = async () => {
    setActionError(null);
    setDeletingAccount(true);
    try {
      await repositoryRef.current.requestAccountDeletion();
      await repositoryRef.current.signOut();
      router.replace('/sign-in');
    } catch (deleteError: unknown) {
      setActionError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Could not delete your account. Please try again.',
      );
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenState
          icon="person-circle-outline"
          message="Your saved checkout details and order history are being prepared."
          title="Loading account"
        />
        <BottomNavigationBar activeItem="account" onShopPress={() => router.push('/')} />
      </SafeAreaView>
    );
  }

  if (error || !account) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenState
          actionLabel="Try again"
          icon="person-circle-outline"
          message={error ?? 'Account details are unavailable.'}
          onRetry={retry}
          onSecondaryAction={() => router.push('/sign-in')}
          secondaryActionLabel="Sign in"
          title="Could not load account"
        />
        <BottomNavigationBar activeItem="account" onShopPress={() => router.push('/')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <IconButton accessibilityLabel="Go back" icon="arrow-back" onPress={() => router.back()} />
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Personal information</Text>

        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Ionicons color={colors.onBrand} name="person-outline" size={34} />
            </View>
            <View style={styles.profileCopy}>
              <Text style={styles.profileName}>{account.profile.displayName}</Text>
              <Text style={styles.profileEmail}>Signed in as {account.profile.email}</Text>
              <Text style={styles.profileMeta}>Member since {account.profile.memberSince}</Text>
            </View>
            <Ionicons color={colors.ink} name="chevron-forward" size={22} />
          </View>
          <InfoRow icon="person-outline" label="Username" value={account.profile.username} />
          <InfoRow actionLabel="Change" icon="lock-closed-outline" label="Password" value="••••••••" />
        </View>

        <View style={[styles.card, styles.deliveryCard]}>
          <Pressable
            accessibilityLabel={
              deliveryOpen ? 'Collapse delivery preferences' : 'Expand delivery preferences'
            }
            accessibilityRole="button"
            onPress={() => setDeliveryOpen((open) => !open)}
            style={({ pressed }) => [styles.sectionHeader, pressed && styles.pressed]}
          >
            <View style={styles.sectionTitleRow}>
              <View style={styles.deliveryIcon}>
                <Ionicons color={colors.brass} name="bicycle-outline" size={20} />
              </View>
              <Text style={styles.cardTitle}>Delivery preferences</Text>
            </View>
            <Ionicons
              color={colors.ink}
              name={deliveryOpen ? 'chevron-up' : 'chevron-down'}
              size={20}
            />
          </Pressable>
          {deliveryOpen ? (
            account.deliveryPreference ? (
              <View style={styles.sectionBody}>
                <InfoRow
                  icon="location-outline"
                  label="Default address"
                  value={account.deliveryPreference.defaultAddress}
                />
                <InfoRow
                  icon="time-outline"
                  label="Preferred window"
                  value={account.deliveryPreference.preferredWindow}
                />
                <InfoRow
                  icon="home-outline"
                  label="Delivery instructions"
                  value={account.deliveryPreference.deliveryInstructions}
                />
                <InfoRow
                  icon="swap-horizontal-outline"
                  label="Substitution preference"
                  value={account.deliveryPreference.substitutionPreference}
                />
              </View>
            ) : (
              <Text style={styles.emptyText}>No delivery preferences saved.</Text>
            )
          ) : null}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderStatic}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.brandIcon}>
                <Ionicons color={colors.onBrand} name="card-outline" size={20} />
              </View>
              <Text style={styles.cardTitle}>Payment methods</Text>
            </View>
          </View>
          <View style={styles.paymentList}>
            {account.paymentMethods.map((method) => (
              <View key={method.id} style={styles.paymentRow}>
                <View style={styles.cardBrand}>
                  <Text style={styles.cardBrandText}>{method.brand.toUpperCase()}</Text>
                </View>
                <View style={styles.paymentCopy}>
                  <Text style={styles.paymentTitle}>
                    {method.brand} ending {method.lastFour}
                  </Text>
                  <Text style={styles.paymentMeta}>
                    Exp {String(method.expiryMonth).padStart(2, '0')}/{method.expiryYear}
                  </Text>
                </View>
                {method.isDefault ? <Badge label="Default" tone="success" /> : null}
                <Button label="Remove" variant="ghost" />
              </View>
            ))}
          </View>
          <Button icon="add" label="Add payment method" variant="outline" />
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderStatic}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.brandIcon}>
                <Ionicons color={colors.onBrand} name="bag-handle-outline" size={20} />
              </View>
              <Text style={styles.cardTitle}>Order history</Text>
            </View>
          </View>
          <View style={styles.orderList}>
            {account.orders.map((order) => (
              <View key={order.id} style={styles.orderRow}>
                <View style={styles.orderTopLine}>
                  <View style={styles.orderCopy}>
                    <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                    <Text style={styles.orderMeta}>{formatOrderDate(order.placedAt)}</Text>
                  </View>
                  <Badge
                    label={statusLabels[order.status]}
                    tone={order.status === 'delivered' ? 'success' : 'accent'}
                  />
                </View>
                <Text style={styles.itemSummary}>{summarizeItems(order)}</Text>
                <View style={styles.orderBottomLine}>
                  <Text style={styles.orderTotal}>
                    Total {formatCurrency(order.total, order.currency)}
                  </Text>
                  <Button
                    accessibilityLabel={`Reorder ${order.orderNumber}`}
                    icon="refresh"
                    label="Reorder"
                    onPress={() => reorder(order)}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderStatic}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.brandIcon}>
                <Ionicons color={colors.onBrand} name="settings-outline" size={20} />
              </View>
              <Text style={styles.cardTitle}>Account access</Text>
            </View>
          </View>
          {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}
          {deleteConfirmOpen ? (
            <View style={styles.deleteConfirm}>
              <Text style={styles.deleteTitle}>Delete your account?</Text>
              <Text style={styles.deleteCopy}>
                This removes your login and saved account details. Previous orders stay in the
                store records without your account attached.
              </Text>
              <View style={styles.actionRow}>
                <Button
                  disabled={deletingAccount}
                  label="Cancel"
                  onPress={() => setDeleteConfirmOpen(false)}
                  variant="outline"
                />
                <Button
                  accessibilityLabel="Confirm delete account"
                  icon="trash-outline"
                  label="Delete account"
                  loading={deletingAccount}
                  onPress={deleteAccount}
                />
              </View>
            </View>
          ) : (
            <View style={styles.actionRow}>
              <Button
                icon="log-out-outline"
                label="Sign out"
                loading={signingOut}
                onPress={signOut}
                variant="outline"
              />
              <Button
                disabled={signingOut}
                icon="trash-outline"
                label="Delete account"
                onPress={() => {
                  setActionError(null);
                  setDeleteConfirmOpen(true);
                }}
                variant="ghost"
              />
            </View>
          )}
        </View>
      </ScrollView>

      <BottomNavigationBar activeItem="account" onShopPress={() => router.push('/')} />
    </SafeAreaView>
  );
}

function InfoRow({
  actionLabel,
  icon,
  label,
  value,
}: {
  actionLabel?: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.rowIcon}>
        <Ionicons color={colors.brand} name={icon} size={20} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
      {actionLabel ? <Button label={actionLabel} variant="ghost" /> : null}
    </View>
  );
}

function summarizeItems(order: AccountOrder): string {
  const visible = order.items.slice(0, 2).map((item) => `${item.quantity} ${item.productName}`);
  const remaining = order.items.length - visible.length;
  return remaining > 0 ? `${visible.join(', ')} +${remaining} more` : visible.join(', ');
}

function formatOrderDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    padding: spacing.md,
  },
  identity: {
    minWidth: 0,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: typography.sizes.lead,
    lineHeight: typography.lineHeights.lead,
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
  content: {
    width: '100%',
    maxWidth: layout.maxReadingWidth,
    alignSelf: 'center',
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: bottomNavigationHeight + spacing.xl,
  },
  pageTitle: {
    color: colors.ink,
    fontFamily: typography.fonts.headingBold,
    fontSize: typography.sizes.display,
    lineHeight: typography.lineHeights.display,
  },
  card: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: layout.radius,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  deliveryCard: {
    borderColor: '#ECD9AE',
    backgroundColor: colors.brassSoft,
  },
  profileRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingBottom: spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 36,
    backgroundColor: colors.brand,
  },
  profileCopy: {
    minWidth: 0,
    flex: 1,
  },
  profileName: {
    color: colors.ink,
    fontFamily: typography.fonts.headingBold,
    fontSize: typography.sizes.title,
    lineHeight: typography.lineHeights.title,
  },
  profileMeta: {
    color: colors.muted,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  profileEmail: {
    color: colors.brandPressed,
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.small,
    lineHeight: typography.lineHeights.small,
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: layout.radius,
    backgroundColor: colors.brandSoft,
  },
  infoCopy: {
    minWidth: 0,
    flex: 1,
  },
  infoLabel: {
    color: colors.muted,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.small,
    lineHeight: typography.lineHeights.small,
  },
  infoValue: {
    color: colors.ink,
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  sectionHeader: {
    minHeight: layout.touchTarget,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionHeaderStatic: {
    minHeight: layout.touchTarget,
    justifyContent: 'center',
  },
  sectionTitleRow: {
    minWidth: 0,
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cardTitle: {
    color: colors.ink,
    fontFamily: typography.fonts.headingBold,
    fontSize: typography.sizes.lead,
    lineHeight: typography.lineHeights.lead,
  },
  deliveryIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: layout.radius,
    backgroundColor: colors.surface,
  },
  brandIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: layout.radius,
    backgroundColor: colors.brand,
  },
  pressed: {
    opacity: 0.72,
  },
  sectionBody: {
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#ECD9AE',
    paddingTop: spacing.md,
  },
  emptyText: {
    color: colors.muted,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.small,
  },
  actionError: {
    color: colors.danger,
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.small,
    lineHeight: typography.lineHeights.small,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  deleteConfirm: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: layout.radius,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  deleteTitle: {
    color: colors.ink,
    fontFamily: typography.fonts.headingBold,
    fontSize: typography.sizes.lead,
    lineHeight: typography.lineHeights.lead,
  },
  deleteCopy: {
    color: colors.muted,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.small,
    lineHeight: typography.lineHeights.small,
  },
  paymentList: {
    gap: spacing.sm,
  },
  paymentRow: {
    minHeight: 74,
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: layout.radius,
    padding: spacing.sm,
  },
  cardBrand: {
    width: 62,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: layout.radius - 2,
    backgroundColor: colors.surface,
  },
  cardBrandText: {
    color: colors.brandPressed,
    fontFamily: typography.fonts.headingBold,
    fontSize: typography.sizes.small,
  },
  paymentCopy: {
    minWidth: 0,
    flex: 1,
  },
  paymentTitle: {
    color: colors.ink,
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.small,
  },
  paymentMeta: {
    color: colors.muted,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
  },
  orderList: {
    gap: spacing.sm,
  },
  orderRow: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: layout.radius,
    padding: spacing.sm,
  },
  orderTopLine: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  orderCopy: {
    minWidth: 0,
    flex: 1,
  },
  orderNumber: {
    color: colors.ink,
    fontFamily: typography.fonts.headingBold,
    fontSize: typography.sizes.lead,
  },
  orderMeta: {
    color: colors.muted,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
  },
  itemSummary: {
    color: colors.muted,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.small,
    lineHeight: typography.lineHeights.small,
  },
  orderBottomLine: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  orderTotal: {
    color: colors.ink,
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.small,
  },
});

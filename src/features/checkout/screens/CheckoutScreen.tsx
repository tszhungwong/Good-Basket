import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { IconButton } from '@/components/ui/IconButton';
import { ScreenState } from '@/components/ui/ScreenState';
import { useCart } from '@/features/cart/CartProvider';
import { useCatalog } from '@/features/catalog/CatalogProvider';
import { formatCurrency } from '@/lib/format';
import { colors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

import {
  buildOrderRequest,
  validateCheckout,
} from '../checkoutValidation';
import type { CheckoutDetails, CheckoutErrors } from '../checkoutTypes';
import { createOrderRepository, type OrderRepository } from '../orderRepository';

const initialDetails: CheckoutDetails = {
  fullName: '',
  phone: '',
  email: '',
  address: '',
  note: '',
};

type CheckoutScreenProps = {
  repository?: OrderRepository;
};

export function CheckoutScreen({ repository }: CheckoutScreenProps) {
  const router = useRouter();
  const { data, error, loading, retry } = useCatalog();
  const { clearCart, hydrated, itemCount, items, subtotal } = useCart();
  const repositoryRef = useRef(repository ?? createOrderRepository());
  const nameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);
  const [details, setDetails] = useState(initialDetails);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenState
          icon="cloud-offline-outline"
          message={error}
          onRetry={retry}
          title="Could not load checkout"
        />
      </SafeAreaView>
    );
  }

  if (!hydrated || loading || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenState
          icon="receipt-outline"
          message="Preparing your delivery details and order summary."
          title="Loading checkout"
        />
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenState
          actionLabel="Return to shop"
          icon="bag-outline"
          message="Add at least one product before placing an order."
          onRetry={() => router.replace('/')}
          title="Your cart is empty"
        />
      </SafeAreaView>
    );
  }

  const deliveryFee = data.settings.deliveryFee;
  const total = subtotal + deliveryFee;

  const changeField = (field: keyof CheckoutDetails, value: string) => {
    setDetails((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const submit = async () => {
    const nextErrors = validateCheckout(details);
    setErrors(nextErrors);
    setSubmitError(null);

    const firstError = Object.keys(nextErrors)[0] as keyof CheckoutDetails | undefined;
    if (firstError) {
      if (firstError === 'fullName') nameRef.current?.focus();
      if (firstError === 'phone') phoneRef.current?.focus();
      if (firstError === 'address') addressRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const request = buildOrderRequest(details, items);
      const result = await repositoryRef.current.createOrder(request, data);
      clearCart();
      router.replace({
        pathname: '/order-confirmation',
        params: {
          currency: result.currency,
          orderNumber: result.orderNumber,
          total: String(result.total),
        },
      });
    } catch (orderError: unknown) {
      setSubmitError(
        orderError instanceof Error
          ? orderError.message
          : 'Could not place your order. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <IconButton accessibilityLabel="Go back" icon="arrow-back" onPress={() => router.back()} />
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>Delivery details</Text>
          <Text style={styles.title}>Checkout</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formSection}>
            <View>
              <Text style={styles.sectionTitle}>Contact and delivery</Text>
              <Text style={styles.sectionDescription}>
                We use these details only to complete this order.
              </Text>
            </View>
            <FormField
              ref={nameRef}
              autoComplete="name"
              error={errors.fullName}
              label="Full name"
              onChangeText={(value) => changeField('fullName', value)}
              required
              returnKeyType="next"
              value={details.fullName}
            />
            <FormField
              ref={phoneRef}
              autoComplete="tel"
              error={errors.phone}
              keyboardType="phone-pad"
              label="Phone"
              onChangeText={(value) => changeField('phone', value)}
              required
              value={details.phone}
            />
            <FormField
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
              keyboardType="email-address"
              label="Email"
              onChangeText={(value) => changeField('email', value)}
              value={details.email}
            />
            <FormField
              ref={addressRef}
              autoComplete="street-address"
              error={errors.address}
              label="Delivery address"
              multiline
              onChangeText={(value) => changeField('address', value)}
              required
              value={details.address}
            />
            <FormField
              helperText="Optional delivery instructions"
              label="Order note"
              multiline
              onChangeText={(value) => changeField('note', value)}
              value={details.note}
            />
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>Order summary</Text>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>{itemCount} items</Text>
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

          {submitError ? (
            <Text accessibilityLiveRegion="polite" style={styles.submitError}>
              {submitError}
            </Text>
          ) : null}

          <Button
            icon="checkmark-circle-outline"
            label="Place order"
            loading={submitting}
            onPress={submit}
          />
          <Text style={styles.disclaimer}>
            No payment is collected in this version. The shop will confirm delivery separately.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: layout.maxReadingWidth,
    alignSelf: 'center',
    gap: spacing.lg,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  formSection: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: typography.fonts.headingSemibold,
    fontSize: typography.sizes.lead,
    lineHeight: typography.lineHeights.lead,
  },
  sectionDescription: {
    color: colors.muted,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.small,
    lineHeight: typography.lineHeights.small,
  },
  summaryCard: {
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: layout.radius,
    padding: spacing.md,
    backgroundColor: colors.surface,
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
    marginTop: spacing.xxs,
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
  submitError: {
    color: colors.danger,
    fontFamily: typography.fonts.bodySemibold,
    fontSize: typography.sizes.small,
    lineHeight: typography.lineHeights.small,
  },
  disclaimer: {
    color: colors.muted,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
    textAlign: 'center',
  },
});

import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui/IconButton';
import { colors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type AuthPageProps = {
  children: ReactNode;
  error?: string | null;
  onBack: () => void;
  subtitle: string;
  title: string;
};

export function AuthPage({ children, error, onBack, subtitle, title }: AuthPageProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= layout.tabletBreakpoint;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.shell, isWide && styles.shellWide]}>
            <MarketPoster isWide={isWide} />
            <View style={[styles.formPanel, isWide && styles.formPanelWide]}>
              <View style={styles.formHeader}>
                <IconButton accessibilityLabel="Go back" icon="arrow-back" onPress={onBack} />
                <View style={styles.brandLockup}>
                  <View style={styles.brandMark}>
                    <Ionicons color={colors.onBrand} name="storefront-outline" size={20} />
                  </View>
                  <Text style={styles.brandName}>Good Goods</Text>
                </View>
              </View>

              <View style={styles.titleBlock}>
                <Text style={styles.eyebrow}>Your neighborhood market</Text>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </View>

              {error ? (
                <View accessibilityLiveRegion="polite" style={styles.errorBanner}>
                  <Ionicons color={colors.danger} name="alert-circle-outline" size={20} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.form}>{children}</View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MarketPoster({ isWide }: { isWide: boolean }) {
  return (
    <View style={[styles.poster, isWide && styles.posterWide]}>
      <View style={styles.posterTopLine}>
        <Text style={styles.posterKicker}>MARKET NOTE / 07</Text>
        <Ionicons color={colors.onBrand} name="leaf-outline" size={22} />
      </View>
      <Text style={styles.posterTitle}>FRESH{`\n`}STARTS{`\n`}HERE.</Text>
      <Text style={styles.posterCopy}>
        Sign in for faster reorders, saved delivery details, and the market picks you love.
      </Text>
      <View accessibilityLabel="Illustration of a grocery market crate" style={styles.marketCrate}>
        <View style={[styles.produceTile, styles.produceLeaf]}>
          <Ionicons color={colors.onBrand} name="leaf" size={28} />
        </View>
        <View style={[styles.produceTile, styles.produceTomato]}>
          <Ionicons color={colors.onBrand} name="nutrition" size={26} />
        </View>
        <View style={[styles.produceTile, styles.produceBread]}>
          <Ionicons color={colors.ink} name="restaurant" size={25} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  shell: {
    width: '100%',
    maxWidth: 1040,
    alignSelf: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: layout.radius * 2,
    backgroundColor: colors.surface,
  },
  shellWide: {
    minHeight: 680,
    flexDirection: 'row',
  },
  poster: {
    minHeight: 310,
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.brand,
  },
  posterWide: {
    minHeight: 680,
    flex: 1.05,
    justifyContent: 'space-between',
    padding: spacing.xl,
  },
  posterTopLine: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  posterKicker: {
    color: '#C9F1DE',
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.caption,
    letterSpacing: 1.4,
  },
  posterTitle: {
    color: colors.onBrand,
    fontFamily: typography.fonts.headingBold,
    fontSize: 52,
    lineHeight: 52,
    letterSpacing: -2,
  },
  posterCopy: {
    maxWidth: 380,
    color: '#DDF6E9',
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  marketCrate: {
    height: 94,
    flexDirection: 'row',
    gap: spacing.xs,
    borderWidth: 2,
    borderColor: '#C9F1DE',
    borderRadius: layout.radius,
    padding: spacing.xs,
    backgroundColor: colors.brandPressed,
  },
  produceTile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: layout.radius - 2,
  },
  produceLeaf: {
    backgroundColor: '#23976F',
  },
  produceTomato: {
    backgroundColor: colors.accent,
  },
  produceBread: {
    backgroundColor: '#EDC98A',
  },
  formPanel: {
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  formPanelWide: {
    flex: 0.95,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  formHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  brandLockup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  brandMark: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: layout.radius,
    backgroundColor: colors.brand,
  },
  brandName: {
    color: colors.ink,
    fontFamily: typography.fonts.headingBold,
    fontSize: typography.sizes.lead,
  },
  titleBlock: {
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.brand,
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.caption,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontFamily: typography.fonts.headingBold,
    fontSize: typography.sizes.display,
    lineHeight: typography.lineHeights.display,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  errorBanner: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: '#F2B8B2',
    borderRadius: layout.radius,
    padding: spacing.sm,
    backgroundColor: colors.accentSoft,
  },
  errorText: {
    minWidth: 0,
    flex: 1,
    color: colors.danger,
    fontFamily: typography.fonts.bodySemibold,
    fontSize: typography.sizes.small,
    lineHeight: typography.lineHeights.small,
  },
  form: {
    gap: spacing.md,
  },
});

import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export type BadgeTone = 'brand' | 'accent' | 'neutral' | 'success';

export type BadgeProps = {
  label: string;
  tone?: BadgeTone;
};

export function Badge({ label, tone = 'brand' }: BadgeProps) {
  const selectedTone = toneStyles[tone];

  return (
    <View style={[styles.base, selectedTone.container]}>
      <Text style={[styles.label, selectedTone.text]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: layout.radius - 2,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  label: {
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
  },
  brand: {
    backgroundColor: colors.brandSoft,
  },
  brandText: {
    color: colors.brandPressed,
  },
  accent: {
    backgroundColor: colors.accentSoft,
  },
  accentText: {
    color: colors.accent,
  },
  neutral: {
    backgroundColor: colors.canvas,
  },
  neutralText: {
    color: colors.muted,
  },
  success: {
    backgroundColor: colors.brandSoft,
  },
  successText: {
    color: colors.success,
  },
});

const toneStyles = {
  brand: { container: styles.brand, text: styles.brandText },
  accent: { container: styles.accent, text: styles.accentText },
  neutral: { container: styles.neutral, text: styles.neutralText },
  success: { container: styles.success, text: styles.successText },
} as const;

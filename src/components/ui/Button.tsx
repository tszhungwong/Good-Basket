import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from 'react-native';

import { colors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

export type ButtonProps = Omit<PressableProps, 'children'> & {
  icon?: ComponentProps<typeof Ionicons>['name'];
  label: string;
  loading?: boolean;
  variant?: ButtonVariant;
};

export function Button({
  accessibilityLabel,
  accessibilityState,
  disabled,
  icon,
  label,
  loading = false,
  style,
  variant = 'primary',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const selectedVariant = variantStyles[variant];

  return (
    <Pressable
      {...props}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{
        ...accessibilityState,
        busy: loading,
        disabled: isDisabled,
      }}
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        selectedVariant.container,
        state.pressed && selectedVariant.pressed,
        isDisabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.onBrand : colors.brand}
          size="small"
        />
      ) : icon ? (
        <Ionicons
          color={variant === 'primary' ? colors.onBrand : colors.brand}
          name={icon}
          size={18}
        />
      ) : null}
      <Text style={[styles.label, selectedVariant.text]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.touchTarget,
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    borderRadius: layout.radius,
    paddingHorizontal: spacing.md,
  },
  label: {
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  disabled: {
    opacity: 0.46,
  },
  primary: {
    backgroundColor: colors.brand,
  },
  primaryPressed: {
    backgroundColor: colors.brandPressed,
  },
  primaryText: {
    color: colors.onBrand,
  },
  secondary: {
    backgroundColor: colors.brandSoft,
  },
  secondaryPressed: {
    backgroundColor: colors.line,
  },
  secondaryText: {
    color: colors.brandPressed,
  },
  outline: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  outlinePressed: {
    backgroundColor: colors.brandSoft,
  },
  outlineText: {
    color: colors.ink,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  ghostPressed: {
    backgroundColor: colors.brandSoft,
  },
  ghostText: {
    color: colors.brand,
  },
});

const variantStyles = {
  primary: {
    container: styles.primary,
    pressed: styles.primaryPressed,
    text: styles.primaryText,
  },
  secondary: {
    container: styles.secondary,
    pressed: styles.secondaryPressed,
    text: styles.secondaryText,
  },
  outline: {
    container: styles.outline,
    pressed: styles.outlinePressed,
    text: styles.outlineText,
  },
  ghost: {
    container: styles.ghost,
    pressed: styles.ghostPressed,
    text: styles.ghostText,
  },
} as const;

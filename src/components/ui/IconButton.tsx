import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { colors } from '@/theme/colors';
import { layout } from '@/theme/layout';

export type IconButtonProps = Omit<PressableProps, 'children'> & {
  accessibilityLabel: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  tone?: 'default' | 'brand' | 'danger';
};

export function IconButton({
  accessibilityLabel,
  disabled,
  icon,
  style,
  tone = 'default',
  ...props
}: IconButtonProps) {
  const isDisabled = Boolean(disabled);
  const iconColor =
    tone === 'brand' ? colors.onBrand : tone === 'danger' ? colors.danger : colors.ink;

  return (
    <Pressable
      {...props}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      hitSlop={4}
      style={(state) => [
        styles.base,
        tone === 'brand' && styles.brand,
        state.pressed && styles.pressed,
        isDisabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <Ionicons color={iconColor} name={icon} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: layout.touchTarget,
    height: layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: layout.radius,
    backgroundColor: colors.surface,
  },
  brand: {
    borderColor: colors.brand,
    backgroundColor: colors.brand,
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.46,
  },
});

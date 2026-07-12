import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type QuantityStepperProps = {
  label: string;
  max: number;
  onDecrease: () => void;
  onIncrease: () => void;
  quantity: number;
};

export function QuantityStepper({
  label,
  max,
  onDecrease,
  onIncrease,
  quantity,
}: QuantityStepperProps) {
  const atLimit = quantity >= max;
  const remove = quantity <= 1;

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel={remove ? `Remove ${label}` : `Decrease ${label}`}
        accessibilityRole="button"
        onPress={onDecrease}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Ionicons
          color={remove ? colors.danger : colors.ink}
          name={remove ? 'trash-outline' : 'remove'}
          size={17}
        />
      </Pressable>
      <Text accessibilityLabel={`${quantity} ${label} in cart`} style={styles.quantity}>
        {quantity}
      </Text>
      <Pressable
        accessibilityLabel={`Increase ${label}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: atLimit }}
        disabled={atLimit}
        onPress={onIncrease}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed,
          atLimit && styles.disabled,
        ]}
      >
        <Ionicons color={colors.ink} name="add" size={17} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  button: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  pressed: {
    backgroundColor: colors.brandSoft,
  },
  disabled: {
    opacity: 0.4,
  },
  quantity: {
    minWidth: 24,
    color: colors.ink,
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.small,
    lineHeight: typography.lineHeights.small,
    textAlign: 'center',
  },
});

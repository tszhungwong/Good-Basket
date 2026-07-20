import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

import { Button } from './Button';

export type ScreenStateProps = {
  actionLabel?: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  message: string;
  onRetry?: () => void;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
  title: string;
};

export function ScreenState({
  actionLabel = 'Try again',
  icon,
  message,
  onRetry,
  onSecondaryAction,
  secondaryActionLabel,
  title,
}: ScreenStateProps) {
  return (
    <View accessibilityRole="summary" style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons color={colors.brand} name={icon} size={28} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry || (onSecondaryAction && secondaryActionLabel) ? (
        <View style={styles.actions}>
          {onRetry ? <Button label={actionLabel} onPress={onRetry} variant="outline" /> : null}
          {onSecondaryAction && secondaryActionLabel ? (
            <Button label={secondaryActionLabel} onPress={onSecondaryAction} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: colors.brandSoft,
  },
  title: {
    color: colors.ink,
    fontFamily: typography.fonts.headingSemibold,
    fontSize: typography.sizes.title,
    lineHeight: typography.lineHeights.title,
    textAlign: 'center',
  },
  message: {
    maxWidth: 380,
    color: colors.muted,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
    textAlign: 'center',
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
});

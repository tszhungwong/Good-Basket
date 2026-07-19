import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type BottomNavigationItemId = 'shop' | 'explore' | 'saved' | 'account';

type BottomNavigationBarProps = {
  activeItem: BottomNavigationItemId;
  onAccountPress?: () => void;
  onShopPress?: () => void;
};

type NavigationItem = {
  icon: ComponentProps<typeof Ionicons>['name'];
  id: BottomNavigationItemId;
  label: string;
};

export const bottomNavigationHeight = 82;

const items: NavigationItem[] = [
  { id: 'shop', icon: 'bag-outline', label: 'Shop' },
  { id: 'explore', icon: 'compass-outline', label: 'Explore' },
  { id: 'saved', icon: 'heart-outline', label: 'Saved' },
  { id: 'account', icon: 'person-outline', label: 'You' },
];

export function BottomNavigationBar({
  activeItem,
  onAccountPress,
  onShopPress,
}: BottomNavigationBarProps) {
  const handlers: Partial<Record<BottomNavigationItemId, () => void>> = {
    account: onAccountPress,
    shop: onShopPress,
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        {items.map((item) => {
          const isActive = item.id === activeItem;
          const onPress = isActive ? undefined : handlers[item.id];
          const isDisabled = !onPress;
          const accessibilityLabel = isActive
            ? `Current tab, ${item.id}`
            : isDisabled
              ? `${item.label} unavailable`
              : `Go to ${item.id}`;

          return (
            <Pressable
              key={item.id}
              accessibilityLabel={accessibilityLabel}
              accessibilityRole="button"
              accessibilityState={{ disabled: isDisabled, selected: isActive }}
              disabled={isDisabled}
              onPress={onPress}
              style={({ pressed }) => [
                styles.item,
                isActive && styles.itemActive,
                pressed && styles.itemPressed,
                isDisabled && !isActive && styles.itemDisabled,
              ]}
            >
              <Ionicons
                color={isActive ? colors.brandPressed : colors.ink}
                name={item.icon}
                size={22}
              />
              <Text style={[styles.label, isActive && styles.labelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    minHeight: bottomNavigationHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  bar: {
    width: '100%',
    maxWidth: layout.maxReadingWidth,
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  item: {
    minWidth: 68,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    borderRadius: layout.radius,
  },
  itemActive: {
    backgroundColor: colors.brandSoft,
  },
  itemPressed: {
    opacity: 0.72,
  },
  itemDisabled: {
    opacity: 0.62,
  },
  label: {
    color: colors.ink,
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
  },
  labelActive: {
    color: colors.brandPressed,
  },
});

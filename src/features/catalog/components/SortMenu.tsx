import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { colors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

import type { CatalogSort } from '../catalogTypes';

const sortOptions: { label: string; value: CatalogSort }[] = [
  { label: 'Recommended', value: 'recommended' },
  { label: 'Price: low to high', value: 'price-low' },
  { label: 'Fastest delivery', value: 'fastest' },
  { label: 'Highest rated', value: 'popular' },
];

type SortMenuProps = {
  onChange: (sort: CatalogSort) => void;
  value: CatalogSort;
};

export function SortMenu({ onChange, value }: SortMenuProps) {
  const [open, setOpen] = useState(false);

  const choose = (sort: CatalogSort) => {
    onChange(sort);
    setOpen(false);
  };

  return (
    <>
      <Button
        accessibilityLabel="Sort products"
        icon="options-outline"
        label="Sort"
        onPress={() => setOpen(true)}
        variant="outline"
      />
      <Modal
        animationType="slide"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
        transparent
        visible={open}
      >
        <View style={styles.overlay}>
          <Pressable
            accessibilityLabel="Close sort menu"
            accessibilityRole="button"
            onPress={() => setOpen(false)}
            style={StyleSheet.absoluteFill}
          />
          <View accessibilityViewIsModal style={styles.sheet}>
            <View style={styles.header}>
              <View style={styles.headingText}>
                <Text style={styles.title}>Sort products</Text>
                <Text style={styles.description}>Choose how the shop shelf is ordered.</Text>
              </View>
              <IconButton
                accessibilityLabel="Close sort menu"
                icon="close"
                onPress={() => setOpen(false)}
              />
            </View>

            <View style={styles.options}>
              {sortOptions.map((option) => {
                const selected = option.value === value;

                return (
                  <Pressable
                    key={option.value}
                    accessibilityLabel={option.label}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => choose(option.value)}
                    style={({ pressed }) => [
                      styles.option,
                      selected && styles.optionSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                      {option.label}
                    </Text>
                    {selected ? <Ionicons color={colors.brand} name="checkmark" size={20} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.scrim,
  },
  sheet: {
    gap: spacing.lg,
    borderTopLeftRadius: layout.radius,
    borderTopRightRadius: layout.radius,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.surface,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  headingText: {
    minWidth: 0,
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    color: colors.ink,
    fontFamily: typography.fonts.headingSemibold,
    fontSize: typography.sizes.title,
    lineHeight: typography.lineHeights.title,
  },
  description: {
    color: colors.muted,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.small,
    lineHeight: typography.lineHeights.small,
  },
  options: {
    gap: spacing.xs,
  },
  option: {
    minHeight: layout.touchTarget,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: layout.radius,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  optionLabel: {
    color: colors.ink,
    fontFamily: typography.fonts.bodySemibold,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  optionLabelSelected: {
    color: colors.brandPressed,
  },
  pressed: {
    opacity: 0.72,
  },
});

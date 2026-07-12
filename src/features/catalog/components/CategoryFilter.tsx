import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

import type { Category } from '../catalogTypes';

type CategoryFilterProps = {
  categories: Category[];
  onChange: (categoryId: string) => void;
  selectedId: string;
};

export function CategoryFilter({ categories, onChange, selectedId }: CategoryFilterProps) {
  const options = [{ id: 'all', name: 'All', sortOrder: 0 }, ...categories];

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {options.map((category) => {
        const selected = category.id === selectedId;
        const accessibilityLabel = category.id === 'all' ? 'All products' : category.name;

        return (
          <Pressable
            key={category.id}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(category.id)}
            style={({ pressed }) => [
              styles.option,
              selected && styles.optionSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{category.name}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  option: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: layout.radius,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.brand,
    backgroundColor: colors.brand,
  },
  pressed: {
    opacity: 0.72,
  },
  label: {
    color: colors.ink,
    fontFamily: typography.fonts.bodySemibold,
    fontSize: typography.sizes.small,
    lineHeight: typography.lineHeights.small,
  },
  labelSelected: {
    color: colors.onBrand,
  },
});

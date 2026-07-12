import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { colors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type SearchFieldProps = {
  onChange: (value: string) => void;
  value: string;
};

export function SearchField({ onChange, value }: SearchFieldProps) {
  return (
    <View style={styles.container}>
      <Ionicons color={colors.muted} name="search-outline" size={20} />
      <TextInput
        accessibilityLabel="Search products"
        onChangeText={onChange}
        placeholder="Search tomatoes, bread, towels..."
        placeholderTextColor={colors.disabled}
        returnKeyType="search"
        style={styles.input}
        value={value}
      />
      {value ? (
        <Pressable
          accessibilityLabel="Clear search"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onChange('')}
          style={({ pressed }) => [styles.clear, pressed && styles.pressed]}
        >
          <Ionicons color={colors.muted} name="close-circle" size={20} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: layout.touchTarget,
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: layout.radius,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
  },
  input: {
    minWidth: 0,
    flex: 1,
    color: colors.ink,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  clear: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.64,
  },
});

import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export type FormFieldProps = TextInputProps & {
  error?: string;
  helperText?: string;
  label: string;
  required?: boolean;
};

export const FormField = forwardRef<TextInput, FormFieldProps>(function FormField(
  {
    accessibilityHint,
    error,
    helperText,
    label,
    multiline,
    required = false,
    style,
    ...props
  },
  ref,
) {
  const supportingText = error ?? helperText;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{required ? `${label} *` : label}</Text>
      <TextInput
        {...props}
        ref={ref}
        accessibilityHint={accessibilityHint ?? supportingText}
        accessibilityLabel={label}
        aria-invalid={Boolean(error)}
        multiline={multiline}
        placeholderTextColor={colors.disabled}
        style={[
          styles.input,
          multiline && styles.multiline,
          error && styles.inputError,
          style,
        ]}
      />
      {supportingText ? (
        <Text accessibilityLiveRegion={error ? 'polite' : 'none'} style={error ? styles.error : styles.helper}>
          {supportingText}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  field: {
    gap: spacing.xxs,
  },
  label: {
    color: colors.ink,
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.small,
    lineHeight: typography.lineHeights.small,
  },
  input: {
    minHeight: layout.touchTarget,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: layout.radius,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  multiline: {
    minHeight: 104,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: colors.danger,
  },
  helper: {
    color: colors.muted,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
  },
  error: {
    color: colors.danger,
    fontFamily: typography.fonts.bodySemibold,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
  },
});

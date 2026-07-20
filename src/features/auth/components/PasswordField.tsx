import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FormField, type FormFieldProps } from '@/components/ui/FormField';
import { IconButton } from '@/components/ui/IconButton';

type PasswordFieldProps = Omit<FormFieldProps, 'secureTextEntry'>;

export function PasswordField({ label, style, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const visibilityLabel = `${visible ? 'Hide' : 'Show'} ${label.toLocaleLowerCase()}`;

  return (
    <View style={styles.container}>
      <FormField
        {...props}
        autoCapitalize="none"
        label={label}
        secureTextEntry={!visible}
        style={[styles.input, style]}
      />
      <IconButton
        accessibilityLabel={visibilityLabel}
        icon={visible ? 'eye-off-outline' : 'eye-outline'}
        onPress={() => setVisible((current) => !current)}
        style={styles.toggle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  input: {
    paddingRight: 58,
  },
  toggle: {
    position: 'absolute',
    top: 24,
    right: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
});

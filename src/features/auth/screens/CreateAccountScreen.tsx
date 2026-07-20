import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { colors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

import { createAuthRepository, type AuthRepository } from '../authRepository';
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
} from '../authValidation';
import { AuthPage } from '../components/AuthPage';
import { PasswordField } from '../components/PasswordField';

type CreateAccountScreenProps = {
  repository?: AuthRepository;
};

type FieldErrors = {
  confirmation?: string;
  email?: string;
  password?: string;
};

export function CreateAccountScreen({ repository }: CreateAccountScreenProps) {
  const router = useRouter();
  const repositoryRef = useRef(repository ?? createAuthRepository());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const createAccount = async () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmationError = validatePasswordConfirmation(password, confirmation);
    setFieldErrors({
      confirmation: confirmationError ?? undefined,
      email: emailError ?? undefined,
      password: passwordError ?? undefined,
    });
    setError(null);
    if (emailError || passwordError || confirmationError) {
      return;
    }

    setLoading(true);
    try {
      const result = await repositoryRef.current.createAccount(email, password);
      if (result.requiresEmailConfirmation) {
        setConfirmationSent(true);
      } else {
        router.replace('/account');
      }
    } catch (registrationError: unknown) {
      setError(
        registrationError instanceof Error
          ? registrationError.message
          : 'Could not create your account. Try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (confirmationSent) {
    return (
      <AuthPage
        onBack={() => router.replace('/sign-in')}
        subtitle="Your market list is almost ready."
        title="Check your email"
      >
        <View style={styles.confirmationCard}>
          <View style={styles.confirmationIcon}>
            <Ionicons color={colors.brand} name="mail-unread-outline" size={30} />
          </View>
          <Text style={styles.confirmationTitle}>Confirm your email address</Text>
          <Text style={styles.confirmationCopy}>
            We sent a confirmation link to {email.trim().toLowerCase()}. Open it to finish creating
            your account.
          </Text>
        </View>
        <Button
          label="Back to sign in"
          onPress={() => router.replace('/sign-in')}
          variant="outline"
        />
      </AuthPage>
    );
  }

  return (
    <AuthPage
      error={error}
      onBack={() => router.back()}
      subtitle="Create one account for saved delivery preferences, payments, and quick reorders."
      title="Create your account"
    >
      <FormField
        autoCapitalize="none"
        autoComplete="email"
        error={fieldErrors.email}
        keyboardType="email-address"
        label="Email"
        onChangeText={setEmail}
        placeholder="you@example.com"
        returnKeyType="next"
        textContentType="emailAddress"
        value={email}
      />
      <PasswordField
        autoComplete="new-password"
        error={fieldErrors.password}
        helperText="Use at least 8 characters."
        label="Password"
        onChangeText={setPassword}
        returnKeyType="next"
        textContentType="newPassword"
        value={password}
      />
      <PasswordField
        autoComplete="new-password"
        error={fieldErrors.confirmation}
        label="Confirm password"
        onChangeText={setConfirmation}
        onSubmitEditing={() => void createAccount()}
        returnKeyType="done"
        textContentType="newPassword"
        value={confirmation}
      />
      <Button label="Create account" loading={loading} onPress={() => void createAccount()} />
      <View style={styles.accountPrompt}>
        <Text style={styles.promptText}>Already have an account?</Text>
        <Pressable
          accessibilityLabel="Sign in"
          accessibilityRole="button"
          onPress={() => router.replace('/sign-in')}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={styles.promptLink}>Sign in</Text>
        </Pressable>
      </View>
    </AuthPage>
  );
}

const styles = StyleSheet.create({
  accountPrompt: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
    paddingTop: spacing.xs,
  },
  promptText: {
    color: colors.muted,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.body,
  },
  promptLink: {
    color: colors.brand,
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.body,
  },
  pressed: {
    opacity: 0.65,
  },
  confirmationCard: {
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: layout.radius,
    padding: spacing.lg,
    backgroundColor: colors.brandSoft,
  },
  confirmationIcon: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    backgroundColor: colors.surface,
  },
  confirmationTitle: {
    color: colors.ink,
    fontFamily: typography.fonts.headingBold,
    fontSize: typography.sizes.lead,
  },
  confirmationCopy: {
    color: colors.muted,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.small,
    lineHeight: typography.lineHeights.small,
    textAlign: 'center',
  },
});

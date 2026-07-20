import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

import { createAuthRepository, type AuthRepository } from '../authRepository';
import { validateEmail, validatePassword } from '../authValidation';
import { AuthPage } from '../components/AuthPage';
import { PasswordField } from '../components/PasswordField';

type SignInScreenProps = {
  repository?: AuthRepository;
};

type FieldErrors = {
  email?: string;
  password?: string;
};

export function SignInScreen({ repository }: SignInScreenProps) {
  const router = useRouter();
  const repositoryRef = useRef(repository ?? createAuthRepository());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<'email' | 'google' | null>(null);

  const signInWithEmail = async () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    setFieldErrors({
      email: emailError ?? undefined,
      password: passwordError ?? undefined,
    });
    setError(null);
    if (emailError || passwordError) {
      return;
    }

    setLoadingAction('email');
    try {
      await repositoryRef.current.signInWithEmail(email, password);
      router.replace('/account');
    } catch (signInError: unknown) {
      setError(toMessage(signInError, 'Could not sign in. Try again.'));
    } finally {
      setLoadingAction(null);
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    setLoadingAction('google');
    try {
      await repositoryRef.current.signInWithGoogle();
    } catch (signInError: unknown) {
      setError(toMessage(signInError, 'Could not start Google sign-in.'));
      setLoadingAction(null);
    }
  };

  return (
    <AuthPage
      error={error}
      onBack={() => router.back()}
      subtitle="Use your email or Google account to see saved delivery details and past orders."
      title="Welcome back"
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
        autoComplete="current-password"
        error={fieldErrors.password}
        label="Password"
        onChangeText={setPassword}
        onSubmitEditing={() => void signInWithEmail()}
        returnKeyType="done"
        textContentType="password"
        value={password}
      />
      <Button
        label="Sign in"
        loading={loadingAction === 'email'}
        onPress={() => void signInWithEmail()}
      />
      <View accessibilityElementsHidden style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>
      <Button
        icon="logo-google"
        label="Continue with Google"
        loading={loadingAction === 'google'}
        onPress={() => void signInWithGoogle()}
        variant="outline"
      />
      <View style={styles.accountPrompt}>
        <Text style={styles.promptText}>New here?</Text>
        <Pressable
          accessibilityLabel="Create an account"
          accessibilityRole="button"
          onPress={() => router.push('/create-account')}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={styles.promptLink}>Create an account</Text>
        </Pressable>
      </View>
    </AuthPage>
  );
}

function toMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

const styles = StyleSheet.create({
  divider: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dividerLine: {
    height: 1,
    flex: 1,
    backgroundColor: colors.line,
  },
  dividerText: {
    color: colors.muted,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.small,
  },
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
});

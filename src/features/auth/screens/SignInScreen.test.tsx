import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { AuthRepository } from '../authRepository';
import { SignInScreen } from './SignInScreen';

const mockRouter = {
  back: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 24, left: 0, right: 0, bottom: 20 },
};

function createRepository(): jest.Mocked<AuthRepository> {
  return {
    createAccount: jest.fn(),
    signInWithEmail: jest.fn().mockResolvedValue(undefined),
    signInWithGoogle: jest.fn().mockResolvedValue(undefined),
  };
}

function renderScreen(repository: AuthRepository) {
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <SignInScreen repository={repository} />
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('signs in with email and opens the account page', async () => {
  const repository = createRepository();
  const screen = await renderScreen(repository);

  await fireEvent.changeText(screen.getByLabelText('Email'), 'jamie@example.com');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'market88');
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

  await waitFor(() => {
    expect(repository.signInWithEmail).toHaveBeenCalledWith('jamie@example.com', 'market88');
    expect(mockRouter.replace).toHaveBeenCalledWith('/account');
  });
});

test('shows field errors without calling Supabase', async () => {
  const repository = createRepository();
  const screen = await renderScreen(repository);

  await fireEvent.changeText(screen.getByLabelText('Email'), 'not-an-email');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'short');
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

  expect(await screen.findByText('Enter a valid email address.')).toBeTruthy();
  expect(screen.getByText('Use at least 8 characters.')).toBeTruthy();
  expect(repository.signInWithEmail).not.toHaveBeenCalled();
});

test('toggles password visibility', async () => {
  const repository = createRepository();
  const screen = await renderScreen(repository);
  const password = screen.getByLabelText('Password');

  expect(password.props.secureTextEntry).toBe(true);
  await fireEvent.press(screen.getByRole('button', { name: 'Show password' }));
  expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(false);
  await fireEvent.press(screen.getByRole('button', { name: 'Hide password' }));
  expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);
});

test('starts Google sign in', async () => {
  const repository = createRepository();
  const screen = await renderScreen(repository);

  await fireEvent.press(screen.getByRole('button', { name: 'Continue with Google' }));

  await waitFor(() => {
    expect(repository.signInWithGoogle).toHaveBeenCalledTimes(1);
  });
});

test('opens account creation', async () => {
  const repository = createRepository();
  const screen = await renderScreen(repository);

  await fireEvent.press(screen.getByRole('button', { name: 'Create an account' }));

  expect(mockRouter.push).toHaveBeenCalledWith('/create-account');
});

test('shows authentication errors without clearing the form', async () => {
  const repository = createRepository();
  repository.signInWithEmail.mockRejectedValue(new Error('Email or password is incorrect.'));
  const screen = await renderScreen(repository);

  await fireEvent.changeText(screen.getByLabelText('Email'), 'jamie@example.com');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'market88');
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

  expect(await screen.findByText('Email or password is incorrect.')).toBeTruthy();
  expect(screen.getByDisplayValue('jamie@example.com')).toBeTruthy();
});

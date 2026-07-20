import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { AuthRepository } from '../authRepository';
import { CreateAccountScreen } from './CreateAccountScreen';

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
    createAccount: jest.fn().mockResolvedValue({ requiresEmailConfirmation: false }),
    signInWithEmail: jest.fn(),
    signInWithGoogle: jest.fn(),
  };
}

function renderScreen(repository: AuthRepository) {
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <CreateAccountScreen repository={repository} />
    </SafeAreaProvider>,
  );
}

async function fillValidForm(screen: Awaited<ReturnType<typeof renderScreen>>) {
  await fireEvent.changeText(screen.getByLabelText('Email'), 'jamie@example.com');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'market88');
  await fireEvent.changeText(screen.getByLabelText('Confirm password'), 'market88');
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('requires the two password entries to match', async () => {
  const repository = createRepository();
  const screen = await renderScreen(repository);

  await fireEvent.changeText(screen.getByLabelText('Email'), 'jamie@example.com');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'market88');
  await fireEvent.changeText(screen.getByLabelText('Confirm password'), 'market99');
  await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));

  expect(await screen.findByText('Passwords do not match.')).toBeTruthy();
  expect(repository.createAccount).not.toHaveBeenCalled();
});

test('gives each password visibility control a unique accessible name', async () => {
  const repository = createRepository();
  const screen = await renderScreen(repository);

  expect(screen.getByRole('button', { name: 'Show password' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Show confirm password' })).toBeTruthy();
});

test('opens the account when registration creates a session', async () => {
  const repository = createRepository();
  const screen = await renderScreen(repository);
  await fillValidForm(screen);

  await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));

  await waitFor(() => {
    expect(repository.createAccount).toHaveBeenCalledWith('jamie@example.com', 'market88');
    expect(mockRouter.replace).toHaveBeenCalledWith('/account');
  });
});

test('shows a check-email state when confirmation is required', async () => {
  const repository = createRepository();
  repository.createAccount.mockResolvedValue({ requiresEmailConfirmation: true });
  const screen = await renderScreen(repository);
  await fillValidForm(screen);

  await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));

  expect(await screen.findByText('Check your email')).toBeTruthy();
  expect(screen.getByText(/jamie@example.com/)).toBeTruthy();
  expect(mockRouter.replace).not.toHaveBeenCalledWith('/account');

  await fireEvent.press(screen.getByRole('button', { name: 'Back to sign in' }));
  expect(mockRouter.replace).toHaveBeenCalledWith('/sign-in');
});

test('returns to the existing sign-in page', async () => {
  const repository = createRepository();
  const screen = await renderScreen(repository);

  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

  expect(mockRouter.replace).toHaveBeenCalledWith('/sign-in');
});

test('shows Supabase registration errors', async () => {
  const repository = createRepository();
  repository.createAccount.mockRejectedValue(new Error('User already registered'));
  const screen = await renderScreen(repository);
  await fillValidForm(screen);

  await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));

  expect(await screen.findByText('User already registered')).toBeTruthy();
});

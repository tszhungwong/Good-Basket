const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (!email) {
    return 'Enter your email address.';
  }
  if (!emailPattern.test(email)) {
    return 'Enter a valid email address.';
  }
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) {
    return 'Enter your password.';
  }
  if (value.length < 8) {
    return 'Use at least 8 characters.';
  }
  return null;
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): string | null {
  if (!confirmation) {
    return 'Enter your password again.';
  }
  if (password !== confirmation) {
    return 'Passwords do not match.';
  }
  return null;
}

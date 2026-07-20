import {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
} from './authValidation';

describe('validateEmail', () => {
  test('requires an email address', () => {
    expect(validateEmail('   ')).toBe('Enter your email address.');
  });

  test('rejects a malformed email address', () => {
    expect(validateEmail('jamie@market')).toBe('Enter a valid email address.');
  });

  test('accepts a normalized email address', () => {
    expect(validateEmail(' Jamie@Example.com ')).toBeNull();
  });
});

describe('validatePassword', () => {
  test('requires a password', () => {
    expect(validatePassword('')).toBe('Enter your password.');
  });

  test('requires at least eight characters', () => {
    expect(validatePassword('short')).toBe('Use at least 8 characters.');
  });

  test('accepts a password with eight characters', () => {
    expect(validatePassword('market88')).toBeNull();
  });
});

describe('validatePasswordConfirmation', () => {
  test('requires password confirmation', () => {
    expect(validatePasswordConfirmation('market88', '')).toBe('Enter your password again.');
  });

  test('requires matching passwords', () => {
    expect(validatePasswordConfirmation('market88', 'market99')).toBe(
      'Passwords do not match.',
    );
  });

  test('accepts matching passwords', () => {
    expect(validatePasswordConfirmation('market88', 'market88')).toBeNull();
  });
});

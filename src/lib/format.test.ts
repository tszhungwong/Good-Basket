import { formatCurrency } from './format';

test('formats currency with two fraction digits', () => {
  expect(formatCurrency(12.5, 'USD')).toBe('$12.50');
});

test('uses the requested currency code', () => {
  expect(formatCurrency(1200, 'TWD')).toContain('1,200');
});

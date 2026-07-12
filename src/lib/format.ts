export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    currency,
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(value);
}

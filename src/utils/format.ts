/**
 * Utility functions for currency and price formatting across the application.
 * Formats Philippine Peso prices with ₱ symbol and comma thousands separator, with no decimal points.
 * E.g., 120 -> ₱120, 1200 -> ₱1,200, 12000 -> ₱12,000, 120000 -> ₱120,000
 */
export const formatPrice = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined || amount === '') {
    return '₱0';
  }
  const num = Number(amount);
  if (isNaN(num)) {
    return '₱0';
  }
  const rounded = Math.round(num);
  return `₱${rounded.toLocaleString('en-US')}`;
};

export const formatNumber = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined || amount === '') {
    return '0';
  }
  const num = Number(amount);
  if (isNaN(num)) {
    return '0';
  }
  const rounded = Math.round(num);
  return rounded.toLocaleString('en-US');
};

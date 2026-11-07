// Currencies the user can pick as their default
export const CURRENCIES = [
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: 'CN¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
];

// Find the symbol for a currency code, e.g. 'MYR' gives 'RM'
export function currencySymbol(code) {
  const currency = CURRENCIES.find((c) => c.code === code);
  return currency ? currency.symbol : code;
}

// Converts an amount through MYR
// Each rate is how much of that currency 1 MYR buys
// Ex: to convert USD to EUR, first convert USD to MYR, then MYR to EUR
export function convertCurrency(amount, fromRate, toRate) {
  const amountInMyr = amount / fromRate;
  return amountInMyr * toRate;
}

// Formats an amount with its symbol, e.g. formatMoney("-5", "RM") gives "-RM5.00"
export function formatMoney(amount, symbol) {
  // Ensure the amount is actually a number
  const value = Number(amount);
  // Add a negative sign if the amount is below 0
  const sign = value < 0 ? '-' : '';
  // Return a formatted amount with currency and 2 decimal places
  return `${sign}${symbol}${Math.abs(value).toFixed(2)}`;
}

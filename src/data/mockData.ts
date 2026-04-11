export type Currency = 'DOP' | 'USD' | 'EUR';

export const currencyRates: Record<Currency, number> = {
  DOP: 1,
  USD: 1 / 59.5,
  EUR: 1 / 63.2,
};

export const currencySymbols: Record<Currency, string> = {
  DOP: 'RD$',
  USD: 'US$',
  EUR: 'EUR ',
};

// ========================================== //
//           DATA: MOCK DATA (CONFIG)           //
// ========================================== //

// ========================================== //
// CONFIGURACIÓN DE MONEDAS Y TASAS DE CAMBIO  //
// ========================================== //

export type Currency = 'DOP' | 'USD' | 'EUR';

export const currencyRates: Record<Currency, number> = {
  DOP: 1,
  USD: 1 / 59.5,
  EUR: 1 / 63.2,
};

// ========================================== //
// SÍMBOLOS DE MONEDA                         //
// ========================================== //

export const currencySymbols: Record<Currency, string> = {
  DOP: 'RD$',
  USD: 'US$',
  EUR: 'EUR ',
};

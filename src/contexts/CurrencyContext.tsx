import React, { createContext, useContext, useState, useCallback } from 'react';
import { Currency, currencyRates, currencySymbols } from '@/data/mockData';

interface CurrencyState {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  convert: (dopAmount: number) => number;
  format: (dopAmount: number) => string;
}

const CurrencyContext = createContext<CurrencyState | null>(null);

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be inside CurrencyProvider');
  return ctx;
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('DOP');

  const convert = useCallback((dopAmount: number) => {
    return dopAmount * currencyRates[currency];
  }, [currency]);

  const format = useCallback((dopAmount: number) => {
    const converted = convert(dopAmount);
    return `${currencySymbols[currency]}${converted.toFixed(2)}`;
  }, [currency, convert]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, format }}>
      {children}
    </CurrencyContext.Provider>
  );
};

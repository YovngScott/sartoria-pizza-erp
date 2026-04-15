// ========================================== //
//      GESTOR DE MONEDAS Y CONVERSIÓN         //
// ========================================== //

/**
 * ARCHIVO: CurrencyContext.tsx
 * DESCRIPCIÓN: Este archivo maneja todo lo relacionado con el dinero. 
 * Permite cambiar entre diferentes monedas (DOP, USD, EUR) y 
 * formatea los números para que se vean como precios reales.
 */

// --- IMPORTACIONES DE REACT --- //
import React, { createContext, useContext, useState, useCallback } from 'react';

// --- IMPORTACIONES DE DATOS --- //
// Traemos las tasas de cambio y los símbolos ($, €, etc.) desde nuestros datos.
import { Currency, currencyRates, currencySymbols } from '@/data/mockData';

// ========================================== //
//         DEFINICIÓN DE LA INTERFAZ          //
// ========================================== //

interface CurrencyState {
  currency: Currency;                 // Moneda actual seleccionada (ej: 'DOP').
  setCurrency: (c: Currency) => void;  // Función para cambiar la moneda.
  convert: (dopAmount: number) => number; // Función para convertir de pesos a la moneda elegida.
  format: (dopAmount: number) => string;  // Función para convertir Y dar formato de texto (ej: "$10.00").
}

// ========================================== //
//        CREACIÓN DEL CONTEXTO Y HOOK        //
// ========================================== //

// Creamos el almacén del contexto.
const CurrencyContext = createContext<CurrencyState | null>(null);

/**
 * useCurrency: Hook para usar el sistema de monedas en cualquier parte.
 */
export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency debe estar dentro de CurrencyProvider');
  return ctx;
};

// ========================================== //
//            PROVEEDOR DE MONEDA             //
// ========================================== //

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- ESTADO GLOBAL --- //
  // Por defecto, la aplicación empieza usando Pesos Dominicanos (DOP).
  const [currency, setCurrency] = useState<Currency>('DOP');

  // --- LÓGICA DE CONVERSIÓN --- //
  /**
   * convert: Toma un monto en pesos y lo multiplica por la tasa de cambio actual.
   */
  const convert = useCallback((dopAmount: number) => {
    return dopAmount * currencyRates[currency];
  }, [currency]);

  // --- LÓGICA DE FORMATO --- //
  /**
   * format: Toma un monto, lo convierte y le añade el símbolo correspondiente.
   * Además, asegura que siempre tenga 2 decimales (ej: 10.50).
   */
  const format = useCallback((dopAmount: number) => {
    const converted = convert(dopAmount);
    // ficed(2) asegura que el precio siempre tenga dos decimales.
    return `${currencySymbols[currency]}${converted.toFixed(2)}`;
  }, [currency, convert]);

  // --- RENDERIZADO --- //
  return (
    /* Proveemos la moneda actual y las funciones de ayuda a toda la app */
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, format }}>
      {children}
    </CurrencyContext.Provider>
  );
};

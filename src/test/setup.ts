// ========================================== //
//           TEST: SETUP (CONFIGURACIÓN)        //
// ========================================== //

import "@testing-library/jest-dom";

// ========================================== //
// MOCK DE WINDOW.MATCHMEDIA                  //
// ========================================== //
// Polyfill necesario para pruebas en JSDOM, ya que matchMedia no está implementado por defecto.
// Es crucial para componentes que dependen de hooks como useIsMobile.

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

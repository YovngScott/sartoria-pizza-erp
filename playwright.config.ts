// ========================================== //
//           CONFIGURACIÓN: PLAYWRIGHT          //
// ========================================== //

import { createLovableConfig } from "lovable-agent-playwright-config/config";

// ========================================== //
// DEFINICIÓN DE PRUEBAS E2E                  //
// ========================================== //
// Configura el entorno de pruebas de extremo a extremo (End-to-End).

export default createLovableConfig({
  // Aquí se pueden añadir overrides personalizados para la configuración de Playwright
  // Ejemplo:
  // timeout: 60000,
  // use: {
  //   baseURL: 'http://localhost:3000',
  // },
});

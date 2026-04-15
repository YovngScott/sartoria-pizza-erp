// ========================================== //
//           CONFIGURACIÓN: ESLINT              //
// ========================================== //

import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

// ========================================== //
// DEFINICIÓN DE REGLAS DE LINTING            //
// ========================================== //

export default tseslint.config(
  { ignores: ["dist"] }, // Ignorar carpeta de build
  {
    // Extiende configuraciones recomendadas para JS y TS
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // Reglas para hooks de React
      ...reactHooks.configs.recommended.rules,
      // Advertencia si los componentes no son exportados correctamente para HMR
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // Desactivado para permitir variables no usadas (común en este proyecto por desarrollo rápido)
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);

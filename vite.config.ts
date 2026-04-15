// ========================================== //
//           CONFIGURACIÓN: VITE                //
// ========================================== //

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// ========================================== //
// DEFINICIÓN DE CONFIGURACIÓN DE VITE        //
// ========================================== //
// Configura el servidor de desarrollo, plugins y resolución de rutas.

export default defineConfig(({ mode }) => ({
  // --- CONFIGURACIÓN DEL SERVIDOR ---
  server: {
    host: "::", // Escuchar en todas las interfaces (IPv6)
    port: 8080, // Puerto de desarrollo
    hmr: {
      overlay: false, // Desactiva el overlay de errores de HMR
    },
  },
  
  // --- PLUGINS ---
  // React SWC para compilación rápida y componentTagger para desarrollo.
  plugins: [
    react(), 
    mode === "development" && componentTagger()
  ].filter(Boolean),

  // --- RESOLUCIÓN DE RUTAS (ALIAS) ---
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Alias '@' apunta a la carpeta 'src'
    },
    // Deduplicación de dependencias críticas para evitar múltiples instancias.
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));

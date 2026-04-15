// ========================================== //
//           INTEGRACIÓN: SUPABASE CLIENT       //
// ========================================== //

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// ========================================== //
// VARIABLES DE ENTORNO DE SUPABASE           //
// ========================================== //

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// ========================================== //
// INSTANCIA DEL CLIENTE SUPABASE (CON SESIÓN) //
// ========================================== //
// Este cliente maneja la autenticación y mantiene la sesión del usuario en localStorage.

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// ========================================== //
// CLIENTE PÚBLICO (SIN SESIÓN)               //
// ========================================== //
// Cliente configurado para peticiones anónimas, útil para procesos de checkout
// donde no se requiere que el usuario esté autenticado.

export const supabasePublic = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

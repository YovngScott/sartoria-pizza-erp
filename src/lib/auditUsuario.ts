// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos el cliente de Supabase para operaciones de inserción en el log de auditoría
import { supabase } from '@/integrations/supabase/client';
// Importamos tipos para JSON y estructuras de inserción compatibles con Supabase
import type { Json, TablesInsert } from '@/integrations/supabase/types';

// ========================================== //
// SECCION: AUDITORIA DE ACCESO Y ACTIVIDAD
// ========================================== //

/**
 * Interfaz RegistrarEventoInput: Define los parámetros necesarios para documentar una acción en el sistema.
 */
interface RegistrarEventoInput {
  accion: 'LOGIN' | 'LOGOUT' | 'ACCESS' | 'INSERT' | 'UPDATE' | 'DELETE'; // Tipo de operación
  datos_antes?: Json | null;    // Estado del registro antes de la acción (opcional)
  datos_despues?: Json | null;  // Estado del registro después de la acción (opcional)
  entidad_id?: number | null;   // ID del registro afectado (opcional)
  tabla_afectada: string;       // Nombre de la tabla de la BD involucrada
}

/**
 * registrarEventoAuditoria: Función núcleo para persistir logs en la tabla 'auditoria_logs'.
 * Identifica automáticamente al usuario autenticado.
 */
export async function registrarEventoAuditoria({
  accion,
  datos_antes = null,
  datos_despues = null,
  entidad_id = null,
  tabla_afectada,
}: RegistrarEventoInput) {
  // 1. Recuperamos el usuario actual de la sesión de Supabase
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Preparamos el objeto de log para la base de datos
  const payload: TablesInsert<'auditoria_logs'> = {
    accion,
    datos_antes,
    datos_despues,
    entidad_id,
    tabla_afectada,
    usuario_id: user?.id ?? 'sistema', // 'sistema' si es una acción no vinculada a sesión (ej: triggers)
  };

  // 3. Realizamos la inserción silenciosa (errores a consola para no bloquear la UI)
  const { error } = await supabase.from('auditoria_logs').insert(payload);

  if (error) {
    console.error('No se pudo registrar el evento de auditoria:', error);
  }
}

// ========================================== //
// FUNCIONES DE UTILIDAD (EVENTOS ESPECÍFICOS)
// ========================================== //

/**
 * registrarLogin: Documenta el inicio de sesión de un administrador.
 * @param metadata Información adicional como IP, agente de usuario, etc.
 */
export function registrarLogin(metadata: Json | null) {
  return registrarEventoAuditoria({
    accion: 'LOGIN',
    datos_despues: metadata,
    tabla_afectada: 'auth',
  });
}

/**
 * registrarLogout: Documenta el cierre de sesión capturando los datos del usuario antes de que expire el token.
 * @param metadata Metadatos opcionales.
 */
export async function registrarLogout(metadata: Json | null) {
  // Obtenemos los datos del usuario antes de cerrar la sesión para el log
  const { data: { user } } = await supabase.auth.getUser();
  
  return registrarEventoAuditoria({
    accion: 'LOGOUT',
    datos_despues: { 
      ...(metadata as any || {}), 
      email: user?.email,
      nombre: user?.user_metadata?.nombre 
    },
    tabla_afectada: 'auth',
  });
}

/**
 * registrarAccesoModulo: Documenta cada vez que un administrador entra en una sección específica del panel.
 * @param modulo Nombre del módulo accedido (ej: 'Pedidos', 'Inventario').
 */
export function registrarAccesoModulo(modulo: string) {
  return registrarEventoAuditoria({
    accion: 'ACCESS',
    datos_despues: { modulo },
    tabla_afectada: 'modulos',
  });
}

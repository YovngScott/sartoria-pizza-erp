import { supabase } from '@/integrations/supabase/client';
import type { Json, TablesInsert } from '@/integrations/supabase/types';

// =====================================
// SECCION: AUDITORIA DE ACCESO
// =====================================

interface RegistrarEventoInput {
  accion: 'LOGIN' | 'LOGOUT' | 'ACCESS';
  datos_antes?: Json | null;
  datos_despues?: Json | null;
  entidad_id?: number | null;
  tabla_afectada: string;
}

export async function registrarEventoAuditoria({
  accion,
  datos_antes = null,
  datos_despues = null,
  entidad_id = null,
  tabla_afectada,
}: RegistrarEventoInput) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const payload: TablesInsert<'auditoria_logs'> = {
    accion,
    datos_antes,
    datos_despues,
    entidad_id,
    tabla_afectada,
    usuario_id: user?.id ?? 'sistema',
  };

  const { error } = await supabase.from('auditoria_logs').insert(payload);

  if (error) {
    console.error('No se pudo registrar el evento de auditoria:', error);
  }
}

export function registrarLogin(metadata: Json | null) {
  return registrarEventoAuditoria({
    accion: 'LOGIN',
    datos_despues: metadata,
    tabla_afectada: 'auth',
  });
}

export async function registrarLogout(metadata: Json | null) {
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

export function registrarAccesoModulo(modulo: string) {
  return registrarEventoAuditoria({
    accion: 'ACCESS',
    datos_despues: { modulo },
    tabla_afectada: 'modulos',
  });
}

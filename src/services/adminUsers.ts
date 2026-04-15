// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos el cliente de Supabase para interactuar con la base de datos y autenticación
import { supabase } from '@/integrations/supabase/client';

// ========================================== //
// TIPOS Y INTERFACES
// ========================================== //
/**
 * Interfaz AdminUser: Define la estructura de datos para un usuario administrador en el frontend.
 * Combina datos de perfil y roles.
 */
export interface AdminUser {
  activo: boolean;      // Indica si la cuenta está habilitada
  created_at: string;   // Fecha de creación del registro
  email: string;        // Correo electrónico único del usuario
  id: number;           // Identificador numérico interno (PK)
  nombre: string;       // Nombre completo o alias del administrador
  rol_codigo: string;   // Código del rol asignado (ej: 'admin', 'gestor')
  usuario_id: string;   // UUID de la tabla auth.users de Supabase
}

// ========================================== //
// FUNCIONES DE SERVICIO (CRUD USUARIOS)
// ========================================== //

/**
 * listAdminUsers: Recupera y cruza la información de perfiles y roles para obtener la lista de admins.
 * Se realiza en pasos manuales para asegurar compatibilidad total con la estructura de la base de datos.
 */
export async function listAdminUsers(): Promise<AdminUser[]> {
  // 1. Obtener todos los registros de la tabla 'perfiles' ordenados por fecha de creación descendente
  const { data: perfiles, error: perfilesError } = await supabase
    .from('perfiles')
    .select('*')
    .order('created_at', { ascending: false });

  // Si falla la obtención de perfiles, propagamos el error
  if (perfilesError) throw perfilesError;

  // 2. Obtener las asignaciones de roles actuales cruzando con la tabla maestra de roles
  const { data: rolesAsignados, error: rolesError } = await supabase
    .from('usuario_roles')
    .select(`
      usuario_id,
      roles (codigo)
    `);

  // Si falla la obtención de roles, propagamos el error
  if (rolesError) throw rolesError;

  // 3. Cruzar los datos manualmente: recorremos los perfiles y buscamos su rol correspondiente
  return (perfiles || []).map((perfil) => {
    // Buscamos la asignación de rol para este usuario específico
    const asignacion = rolesAsignados?.find(r => r.usuario_id === perfil.usuario_id);
    // Extraemos el código del rol o asignamos 'usuario' por defecto si no tiene rol definido
    const rolCodigo = (asignacion?.roles as any)?.codigo || 'usuario';
    
    // Retornamos el objeto AdminUser mapeado y limpio
    return {
      activo: perfil.activo,
      created_at: perfil.created_at,
      email: perfil.email || '',
      id: perfil.id,
      nombre: perfil.nombre || '',
      rol_codigo: rolCodigo,
      usuario_id: perfil.usuario_id,
    };
  });
}

/**
 * createAdminUser: Registra un correo en la lista de 'admin_autorizados' para permitir el registro posterior.
 */
export async function createAdminUser(input: { email: string; nombre: string }) {
  // Insertamos el correo en la tabla de autorizaciones previas
  const { error } = await supabase
    .from('admin_autorizados')
    .insert({ email: input.email.trim().toLowerCase() });

  // Manejo de errores específicos (ej: duplicado)
  if (error) {
    if (error.code === '23505') throw new Error('Este correo ya está en la lista de autorizados.');
    throw error;
  }
  
  // Retornamos un objeto provisional ya que el usuario real se creará cuando complete el registro auth
  return { 
    nombre: input.nombre, 
    email: input.email, 
    activo: true, 
    rol_codigo: 'admin', 
    usuario_id: 'pendiente' 
  } as any;
}

/**
 * updateAdminUser: Actualiza los metadatos del perfil del administrador.
 */
export async function updateAdminUser(input: { usuario_id: string; nombre: string; activo: boolean }) {
  // Realizamos el update en la tabla 'perfiles' filtrando por el ID de usuario
  const { data, error } = await supabase
    .from('perfiles')
    .update({ 
      nombre: input.nombre, 
      activo: input.activo 
    })
    .eq('usuario_id', input.usuario_id)
    .select().single();

  // Si hay error en la actualización, lo lanzamos
  if (error) throw error;
  // Retornamos los datos actualizados incluyendo el rol (fijo como admin para esta vista)
  return { ...data, rol_codigo: 'admin' };
}

/**
 * deleteAdminUser: Elimina por completo el acceso y rastro de un administrador en el sistema.
 */
export async function deleteAdminUser(usuario_id: string) {
  // 1. Obtenemos el correo del perfil para también eliminarlo de la lista de autorizados
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('email')
    .eq('usuario_id', usuario_id)
    .single();

  // Si encontramos el perfil, procedemos a borrar la autorización previa
  if (perfil) {
    await supabase.from('admin_autorizados').delete().eq('email', perfil.email);
  }
  
  // 2. Eliminamos las asignaciones de roles para mantener la integridad referencial
  await supabase.from('usuario_roles').delete().eq('usuario_id', usuario_id);
  
  // 3. Eliminamos el perfil del usuario (Nota: el usuario en auth.users requiere limpieza manual o vía trigger)
  const { error } = await supabase.from('perfiles').delete().eq('usuario_id', usuario_id);
  
  // Si ocurre un error crítico, lo lanzamos
  if (error) throw error;
  
  // Operación exitosa
  return { success: true };
}

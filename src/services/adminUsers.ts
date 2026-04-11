import { supabase } from '@/integrations/supabase/client';

export interface AdminUser {
  activo: boolean;
  created_at: string;
  email: string;
  id: number;
  nombre: string;
  rol_codigo: string;
  usuario_id: string;
}

// NUEVA FUNCIÓN: Consulta simplificada y ultra-compatible
export async function listAdminUsers(): Promise<AdminUser[]> {
  // 1. Obtener todos los perfiles
  const { data: perfiles, error: perfilesError } = await supabase
    .from('perfiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (perfilesError) throw perfilesError;

  // 2. Obtener los roles asignados
  const { data: rolesAsignados, error: rolesError } = await supabase
    .from('usuario_roles')
    .select(`
      usuario_id,
      roles (codigo)
    `);

  if (rolesError) throw rolesError;

  // 3. Cruzar los datos manualmente para asegurar que nada se pierda
  return (perfiles || []).map((perfil) => {
    const asignacion = rolesAsignados?.find(r => r.usuario_id === perfil.usuario_id);
    const rolCodigo = (asignacion?.roles as any)?.codigo || 'usuario';
    
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

export async function createAdminUser(input: { email: string; nombre: string }) {
  const { error } = await supabase
    .from('admin_autorizados')
    .insert({ email: input.email.trim().toLowerCase() });

  if (error) {
    if (error.code === '23505') throw new Error('Este correo ya está en la lista de autorizados.');
    throw error;
  }
  
  return { nombre: input.nombre, email: input.email, activo: true, rol_codigo: 'admin', usuario_id: 'pendiente' } as any;
}

export async function updateAdminUser(input: { usuario_id: string; nombre: string; activo: boolean }) {
  const { data, error } = await supabase
    .from('perfiles')
    .update({ nombre: input.nombre, activo: input.activo })
    .eq('usuario_id', input.usuario_id)
    .select().single();

  if (error) throw error;
  return { ...data, rol_codigo: 'admin' };
}

export async function deleteAdminUser(usuario_id: string) {
  // Borrar de autorizados si existe
  const { data: perfil } = await supabase.from('perfiles').select('email').eq('usuario_id', usuario_id).single();
  if (perfil) {
    await supabase.from('admin_autorizados').delete().eq('email', perfil.email);
  }
  
  // Borrar de roles y perfiles
  await supabase.from('usuario_roles').delete().eq('usuario_id', usuario_id);
  const { error } = await supabase.from('perfiles').delete().eq('usuario_id', usuario_id);
  
  if (error) throw error;
  return { success: true };
}

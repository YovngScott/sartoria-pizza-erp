import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const jsonHeaders = {
  ...corsHeaders,
  'Content-Type': 'application/json',
};

interface RequestBody {
  action?: 'list' | 'create' | 'update' | 'delete';
  activo?: boolean;
  email?: string;
  nombre?: string;
  password?: string;
  usuario_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Metodo no soportado' }), {
      headers: jsonHeaders,
      status: 405,
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      headers: jsonHeaders,
      status: 401,
    });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  const {
    data: { user: caller },
    error: callerError,
  } = await userClient.auth.getUser();

  if (callerError || !caller) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      headers: jsonHeaders,
      status: 401,
    });
  }

  const adminDb = createClient(supabaseUrl, serviceRoleKey);
  const { data: adminRole } = await adminDb
    .from('usuario_roles')
    .select('id, rol_id, roles!inner(codigo)')
    .eq('usuario_id', caller.id)
    .eq('roles.codigo', 'admin')
    .maybeSingle();

  if (!adminRole) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      headers: jsonHeaders,
      status: 403,
    });
  }

  const body = (await req.json()) as RequestBody;
  const action = body.action;

  if (!action) {
    return new Response(JSON.stringify({ error: 'action es obligatorio' }), {
      headers: jsonHeaders,
      status: 400,
    });
  }

  const { data: adminRoleRow, error: adminRoleError } = await adminDb
    .from('roles')
    .select('id, codigo')
    .eq('codigo', 'admin')
    .single();

  if (adminRoleError || !adminRoleRow) {
    return new Response(JSON.stringify({ error: 'No existe el rol admin' }), {
      headers: jsonHeaders,
      status: 500,
    });
  }

  try {
    if (action === 'list') {
      const { data: roles, error } = await adminDb
        .from('usuario_roles')
        .select('usuario_id')
        .eq('rol_id', adminRoleRow.id);

      if (error) throw error;

      if (!roles || roles.length === 0) {
        return new Response(JSON.stringify([]), { headers: jsonHeaders });
      }

      const usuarioIds = roles.map((row) => row.usuario_id);
      const { data: perfiles, error: perfilesError } = await adminDb
        .from('perfiles')
        .select('*')
        .in('usuario_id', usuarioIds)
        .order('created_at', { ascending: false });

      if (perfilesError) throw perfilesError;

      return new Response(
        JSON.stringify(
          (perfiles ?? []).map((perfil) => ({
            activo: perfil.activo,
            created_at: perfil.created_at,
            email: perfil.email ?? '',
            id: perfil.id,
            nombre: perfil.nombre ?? '',
            rol_codigo: adminRoleRow.codigo,
            usuario_id: perfil.usuario_id,
          }))
        ),
        { headers: jsonHeaders }
      );
    }

    if (action === 'create') {
      if (!body.email || !body.password) {
        return new Response(
          JSON.stringify({ error: 'Email y password son obligatorios' }),
          { headers: jsonHeaders, status: 400 }
        );
      }

      const { data: createdUser, error } = await adminDb.auth.admin.createUser({
        email: body.email.trim(),
        email_confirm: true,
        password: body.password,
        user_metadata: {
          nombre: body.nombre?.trim() ?? '',
        },
      });

      if (error || !createdUser.user) throw error;

      await adminDb.from('perfiles').upsert({
        activo: true,
        email: createdUser.user.email,
        nombre: body.nombre?.trim() ?? '',
        usuario_id: createdUser.user.id,
      });

      await adminDb.from('usuario_roles').upsert({
        rol_id: adminRoleRow.id,
        usuario_id: createdUser.user.id,
      });

      const { data: perfil, error: perfilError } = await adminDb
        .from('perfiles')
        .select('*')
        .eq('usuario_id', createdUser.user.id)
        .single();

      if (perfilError || !perfil) throw perfilError;

      return new Response(
        JSON.stringify({
          activo: perfil.activo,
          created_at: perfil.created_at,
          email: perfil.email ?? createdUser.user.email ?? '',
          id: perfil.id,
          nombre: perfil.nombre ?? '',
          rol_codigo: adminRoleRow.codigo,
          usuario_id: perfil.usuario_id,
        }),
        { headers: jsonHeaders }
      );
    }

    if (action === 'update') {
      if (!body.usuario_id) {
        return new Response(JSON.stringify({ error: 'usuario_id es obligatorio' }), {
          headers: jsonHeaders,
          status: 400,
        });
      }

      const updateData: Record<string, unknown> = {
        user_metadata: {
          nombre: body.nombre?.trim() ?? '',
        },
      };

      if (body.email?.trim()) updateData.email = body.email.trim();
      if (body.password?.trim()) updateData.password = body.password.trim();

      const { error } = await adminDb.auth.admin.updateUserById(body.usuario_id, updateData);
      if (error) throw error;

      await adminDb.from('perfiles').upsert({
        activo: body.activo ?? true,
        email: body.email?.trim() ?? null,
        nombre: body.nombre?.trim() ?? '',
        usuario_id: body.usuario_id,
      });

      const { data: perfil, error: perfilError } = await adminDb
        .from('perfiles')
        .select('*')
        .eq('usuario_id', body.usuario_id)
        .single();

      if (perfilError || !perfil) throw perfilError;

      return new Response(
        JSON.stringify({
          activo: perfil.activo,
          created_at: perfil.created_at,
          email: perfil.email ?? '',
          id: perfil.id,
          nombre: perfil.nombre ?? '',
          rol_codigo: adminRoleRow.codigo,
          usuario_id: perfil.usuario_id,
        }),
        { headers: jsonHeaders }
      );
    }

    if (action === 'delete') {
      if (!body.usuario_id) {
        return new Response(JSON.stringify({ error: 'usuario_id es obligatorio' }), {
          headers: jsonHeaders,
          status: 400,
        });
      }

      if (body.usuario_id === caller.id) {
        return new Response(
          JSON.stringify({ error: 'No puedes eliminar tu propio usuario' }),
          { headers: jsonHeaders, status: 400 }
        );
      }

      await adminDb.from('usuario_roles').delete().eq('usuario_id', body.usuario_id);
      await adminDb.from('perfiles').delete().eq('usuario_id', body.usuario_id);

      const { error } = await adminDb.auth.admin.deleteUser(body.usuario_id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
    }

    return new Response(JSON.stringify({ error: 'Accion no soportada' }), {
      headers: jsonHeaders,
      status: 400,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: jsonHeaders,
        status: 500,
      }
    );
  }
});

import { supabase, supabasePublic } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import {
  buildPedidoItemsInsert,
  calculateOrderTotals,
  mapPedidosWithItems,
  type AuditoriaLog,
  type Cliente,
  type Ingrediente,
  type OrderDraftItem,
  type Pedido,
  type PedidoItemRow,
  type PedidoRow,
  type Pizza,
  type Receta,
  type UnidadMedida,
} from '@/lib/erp';

// =====================================
// SECCION: CARGA DE DATOS
// =====================================

export interface DashboardData {
  auditLogs: AuditoriaLog[];
  clientes: Cliente[];
  ingredientes: Ingrediente[];
  pedidos: Pedido[];
  pizzas: Pizza[];
  recetas: Receta[];
  unidadesMedida: UnidadMedida[];
}

export async function loadDashboardData(isAdmin: boolean): Promise<DashboardData> {
  const { data: pizzas, error: pizzasError } = await supabasePublic
    .from('pizzas')
    .select('*')
    .order('nombre');

  if (pizzasError) {
    throw pizzasError;
  }

  if (!isAdmin) {
    return {
      auditLogs: [],
      clientes: [],
      ingredientes: [],
      pedidos: [],
      pizzas: pizzas ?? [],
      recetas: [],
      unidadesMedida: [],
    };
  }

  const [
    ingredientesRes,
    unidadesRes,
    recetasRes,
    clientesRes,
    pedidosRes,
    auditRes,
  ] = await Promise.all([
    supabase.from('ingredientes').select('*').order('nombre'),
    supabase.from('unidades_medida').select('*').order('codigo'),
    supabase.from('recetas').select('*').order('pizza_id').order('ingrediente_id'),
    supabase.from('clientes').select('*').order('created_at', { ascending: false }),
    supabase.from('pedidos').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('auditoria_logs').select('*').order('fecha', { ascending: false }).limit(300),
  ]);

  if (ingredientesRes.error) throw ingredientesRes.error;
  if (unidadesRes.error) throw unidadesRes.error;
  if (recetasRes.error) throw recetasRes.error;
  if (clientesRes.error) throw clientesRes.error;
  if (pedidosRes.error) throw pedidosRes.error;
  if (auditRes.error) throw auditRes.error;

  const pedidosData = pedidosRes.data ?? [];
  let pedidoItems: PedidoItemRow[] = [];

  if (pedidosData.length > 0) {
    const { data, error } = await supabase
      .from('pedido_items')
      .select('*')
      .in('pedido_id', pedidosData.map((pedido) => pedido.id));

    if (error) throw error;
    pedidoItems = data ?? [];
  }

  return {
    auditLogs: auditRes.data ?? [],
    clientes: clientesRes.data ?? [],
    ingredientes: ingredientesRes.data ?? [],
    pedidos: mapPedidosWithItems(pedidosData, pedidoItems),
    pizzas: pizzas ?? [],
    recetas: recetasRes.data ?? [],
    unidadesMedida: unidadesRes.data ?? [],
  };
}

// =====================================
// SECCION: CLIENTES
// =====================================

interface EnsureClientInput {
  direccion?: string;
  email?: string;
  nombre: string;
  telefono?: string;
}

export async function ensureClient(
  input: EnsureClientInput,
  usePublicClient = false
): Promise<Cliente> {
  const db = usePublicClient ? supabasePublic : supabase;
  const nombre = input.nombre.trim();
  const email = input.email?.trim().toLowerCase() || null;
  const telefono = input.telefono?.trim() || null;
  const direccion = input.direccion?.trim() || null;

  if (!nombre) {
    throw new Error('El nombre del cliente es obligatorio');
  }

  let existing: Cliente | null = null;

  if (email) {
    const { data, error } = await db.from('clientes').select('*').eq('email', email).maybeSingle();
    if (error) throw error;
    existing = data;
  }

  if (!existing && telefono) {
    const { data, error } = await db.from('clientes').select('*').eq('telefono', telefono).maybeSingle();
    if (error) throw error;
    existing = data;
  }

  if (existing) {
    const payload: TablesUpdate<'clientes'> = {
      direccion: direccion || existing.direccion,
      email,
      nombre,
      telefono,
    };

    const { data, error } = await db
      .from('clientes')
      .update(payload)
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error || !data) {
      throw error || new Error('No se pudo actualizar el cliente');
    }

    return data;
  }

  const payload: TablesInsert<'clientes'> = {
    direccion,
    email,
    nombre,
    telefono,
  };

  const { data, error } = await db.from('clientes').insert(payload).select('*').single();

  if (error || !data) {
    throw error || new Error('No se pudo crear el cliente');
  }

  return data;
}

// =====================================
// SECCION: PEDIDOS
// =====================================

interface SavePedidoInput {
  cliente: Cliente;
  direccionEntrega?: string | null;
  ingredientes: Ingrediente[];
  items: OrderDraftItem[];
  observaciones?: string | null;
  pedidoId?: number;
  recetas: Receta[];
  tipo: 'delivery' | 'recogida';
  unidadesMedida: UnidadMedida[];
  usuarioId?: string | null;
  estado?: string;
  usePublicClient?: boolean;
}

export async function savePedido(input: SavePedidoInput): Promise<Pedido> {
  const {
    cliente,
    direccionEntrega = null,
    estado = 'pendiente',
    ingredientes,
    items,
    observaciones = null,
    pedidoId,
    recetas,
    tipo,
    unidadesMedida,
    usuarioId = null,
    usePublicClient = false,
  } = input;

  const db = usePublicClient ? supabasePublic : supabase;
  const totals = calculateOrderTotals(items);

  const pedidoPayload: any = {
    cliente_id: cliente.id,
    cliente_nombre_snapshot: cliente.nombre,
    cliente_telefono_snapshot: cliente.telefono || null,
    cliente_email_snapshot: cliente.email || null,
    direccion_entrega: tipo === 'delivery' ? direccionEntrega || cliente.direccion : null,
    estado,
    impuesto_total: totals.impuestoTotal,
    observaciones,
    subtotal: totals.subtotal,
    tipo,
    total: totals.total,
    usuario_id: usuarioId,
  };

  let pedidoRow: PedidoRow;

  if (pedidoId != null) {
    const { data, error } = await db
      .from('pedidos')
      .update(pedidoPayload)
      .eq('id', pedidoId)
      .select('*')
      .single();

    if (error || !data) {
      throw error || new Error('No se pudo actualizar el pedido');
    }

    const { error: deleteError } = await db.from('pedido_items').delete().eq('pedido_id', pedidoId);
    if (deleteError) throw deleteError;

    pedidoRow = data;
  } else {
    const { data, error } = await db
      .from('pedidos')
      .insert(pedidoPayload)
      .select('*')
      .single();

    if (error || !data) {
      throw error || new Error('No se pudo crear el pedido');
    }

    pedidoRow = data;
  }

  const itemsPayload = buildPedidoItemsInsert({
    ingredientes,
    items,
    pedidoId: pedidoRow.id,
    recetas,
    unidadesMedida,
  });

  const { data: insertedItems, error: itemsError } = await db
    .from('pedido_items')
    .insert(itemsPayload)
    .select('*');

  if (itemsError) {
    if (pedidoId == null) {
      await db.from('pedidos').delete().eq('id', pedidoRow.id);
    }
    throw itemsError;
  }

  return {
    ...pedidoRow,
    items: insertedItems ?? [],
  };
}

export async function deletePedido(pedidoId: number) {
  const { error } = await supabase.from('pedidos').delete().eq('id', pedidoId);
  if (error) throw error;
}

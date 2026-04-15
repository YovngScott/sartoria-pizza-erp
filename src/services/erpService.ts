// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos clientes de Supabase (autenticado y público) para diferentes niveles de acceso
import { supabase, supabasePublic } from '@/integrations/supabase/client';
// Importamos tipos generados para tipado fuerte en las operaciones de base de datos
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
// Importamos utilidades de lógica de negocio y tipos compartidos
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

// ========================================== //
// SECCION: CARGA DE DATOS (DASHBOARD)
// ========================================== //

/**
 * Interfaz DashboardData: Agrupación de todas las entidades necesarias para el panel administrativo.
 */
export interface DashboardData {
  auditLogs: AuditoriaLog[];
  clientes: Cliente[];
  ingredientes: Ingrediente[];
  pedidos: Pedido[];
  pizzas: Pizza[];
  recetas: Receta[];
  unidadesMedida: UnidadMedida[];
}

/**
 * loadDashboardData: Realiza una carga masiva y paralela de todas las tablas maestras y operativas.
 * @param isAdmin Define si se cargan datos sensibles adicionales.
 */
export async function loadDashboardData(isAdmin: boolean): Promise<DashboardData> {
  // 1. Cargamos las pizzas (disponibles para todos, clientes y admin)
  const { data: pizzas, error: pizzasError } = await supabasePublic
    .from('pizzas')
    .select('*')
    .order('nombre');

  if (pizzasError) throw pizzasError;

  // 2. Si no es admin, retornamos solo la información pública
  if (!isAdmin) {
    return {
      auditLogs: [], clientes: [], ingredientes: [], pedidos: [],
      pizzas: pizzas ?? [], recetas: [], unidadesMedida: [],
    };
  }

  // 3. Ejecución paralela de consultas administrativas para optimizar el tiempo de carga
  const [
    ingredientesRes, unidadesRes, recetasRes,
    clientesRes, pedidosRes, auditRes,
  ] = await Promise.all([
    supabase.from('ingredientes').select('*').order('nombre'),
    supabase.from('unidades_medida').select('*').order('codigo'),
    supabase.from('recetas').select('*').order('pizza_id').order('ingrediente_id'),
    supabase.from('clientes').select('*').order('created_at', { ascending: false }),
    supabase.from('pedidos').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('auditoria_logs').select('*').order('fecha', { ascending: false }).limit(300),
  ]);

  // Validamos errores de todas las peticiones concurrentes
  if (ingredientesRes.error) throw ingredientesRes.error;
  if (unidadesRes.error) throw unidadesRes.error;
  if (recetasRes.error) throw recetasRes.error;
  if (clientesRes.error) throw clientesRes.error;
  if (pedidosRes.error) throw pedidosRes.error;
  if (auditRes.error) throw auditRes.error;

  const pedidosData = pedidosRes.data ?? [];
  let pedidoItems: PedidoItemRow[] = [];

  // 4. Si existen pedidos, cargamos sus líneas de detalle (items) de forma optimizada
  if (pedidosData.length > 0) {
    const { data, error } = await supabase
      .from('pedido_items')
      .select('*')
      .in('pedido_id', pedidosData.map((p) => p.id));

    if (error) throw error;
    pedidoItems = data ?? [];
  }

  // 5. Mapeamos y retornamos el conjunto completo de datos procesado
  return {
    auditLogs: auditRes.data ?? [],
    clientes: clientesRes.data ?? [],
    ingredientes: ingredientesRes.data ?? [],
    pedidos: mapPedidosWithItems(pedidosData, pedidoItems), // Cruce de pedidos con sus items
    pizzas: pizzas ?? [],
    recetas: recetasRes.data ?? [],
    unidadesMedida: unidadesRes.data ?? [],
  };
}

// ========================================== //
// SECCION: GESTIÓN DE CLIENTES
// ========================================== //

interface EnsureClientInput {
  direccion?: string;
  email?: string;
  nombre: string;
  telefono?: string;
}

/**
 * ensureClient: Busca un cliente por email o teléfono; si existe lo actualiza, si no lo crea.
 * Útil para procesos de checkout rápidos donde no se sabe si el cliente es recurrente.
 */
export async function ensureClient(input: EnsureClientInput, usePublicClient = false): Promise<Cliente> {
  const db = usePublicClient ? supabasePublic : supabase;
  const nombre = input.nombre.trim();
  const email = input.email?.trim().toLowerCase() || null;
  const telefono = input.telefono?.trim() || null;
  const direccion = input.direccion?.trim() || null;

  if (!nombre) throw new Error('El nombre del cliente es obligatorio');

  let existing: Cliente | null = null;

  // Búsqueda por email
  if (email) {
    const { data, error } = await db.from('clientes').select('*').eq('email', email).maybeSingle();
    if (error) throw error;
    existing = data;
  }

  // Búsqueda por teléfono si no se encontró por email
  if (!existing && telefono) {
    const { data, error } = await db.from('clientes').select('*').eq('telefono', telefono).maybeSingle();
    if (error) throw error;
    existing = data;
  }

  // Si el cliente ya existe, actualizamos sus datos con la información más reciente
  if (existing) {
    const payload: TablesUpdate<'clientes'> = {
      direccion: direccion || existing.direccion,
      email, nombre, telefono,
    };

    const { data, error } = await db.from('clientes').update(payload).eq('id', existing.id).select('*').single();
    if (error || !data) throw error || new Error('No se pudo actualizar el cliente');
    return data;
  }

  // Si no existe, creamos un nuevo registro
  const payload: TablesInsert<'clientes'> = { direccion, email, nombre, telefono };
  const { data, error } = await db.from('clientes').insert(payload).select('*').single();
  if (error || !data) throw error || new Error('No se pudo crear el cliente');
  return data;
}

// ========================================== //
// SECCION: GESTIÓN DE PEDIDOS
// ========================================== //

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

/**
 * savePedido: Procesa el guardado completo de un pedido, incluyendo cabecera y líneas de detalle.
 * Maneja tanto la creación como la actualización mediante transacciones lógicas.
 */
export async function savePedido(input: SavePedidoInput): Promise<Pedido> {
  const {
    cliente, direccionEntrega = null, estado = 'pendiente', ingredientes,
    items, observaciones = null, pedidoId, recetas, tipo, unidadesMedida,
    usuarioId = null, usePublicClient = false,
  } = input;

  const db = usePublicClient ? supabasePublic : supabase;
  // Calculamos los totales financieros del pedido
  const totals = calculateOrderTotals(items);

  // Preparamos el snapshot de la cabecera (datos históricos inmutables)
  const pedidoPayload: any = {
    cliente_id: cliente.id,
    cliente_nombre_snapshot: cliente.nombre,
    cliente_telefono_snapshot: cliente.telefono || null,
    cliente_email_snapshot: cliente.email || null,
    direccion_entrega: tipo === 'delivery' ? (direccionEntrega || cliente.direccion) : null,
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
    // Modo Edición: Actualizamos cabecera y reemplazamos items
    const { data, error } = await db.from('pedidos').update(pedidoPayload).eq('id', pedidoId).select('*').single();
    if (error || !data) throw error || new Error('No se pudo actualizar el pedido');
    
    // Eliminamos items anteriores para insertar el nuevo set (evita lógica de merge compleja)
    const { error: deleteError } = await db.from('pedido_items').delete().eq('pedido_id', pedidoId);
    if (deleteError) throw deleteError;

    pedidoRow = data;
  } else {
    // Modo Creación: Insertamos nueva cabecera
    const { data, error } = await db.from('pedidos').insert(pedidoPayload).select('*').single();
    if (error || !data) throw error || new Error('No se pudo crear el pedido');
    pedidoRow = data;
  }

  // 5. Construimos el payload de items con snapshots de costeo técnico
  const itemsPayload = buildPedidoItemsInsert({
    ingredientes, items, pedidoId: pedidoRow.id, recetas, unidadesMedida,
  });

  // 6. Insertamos las líneas de detalle
  const { data: insertedItems, error: itemsError } = await db.from('pedido_items').insert(itemsPayload).select('*');

  // Si fallan los items en creación, revertimos la cabecera (Rollback manual simulado)
  if (itemsError) {
    if (pedidoId == null) await db.from('pedidos').delete().eq('id', pedidoRow.id);
    throw itemsError;
  }

  return { ...pedidoRow, items: insertedItems ?? [] };
}

/**
 * deletePedido: Elimina físicamente un pedido de la base de datos.
 */
export async function deletePedido(pedidoId: number) {
  const { error } = await supabase.from('pedidos').delete().eq('id', pedidoId);
  if (error) throw error;
}

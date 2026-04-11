import type { Json, Tables, TablesInsert } from '@/integrations/supabase/types';

// =====================================
// SECCION: TIPOS BASE
// =====================================

export type Pizza = Tables<'pizzas'>;
export type Ingrediente = Tables<'ingredientes'>;
export type UnidadMedida = Tables<'unidades_medida'>;
export type Receta = Tables<'recetas'>;
export type Cliente = Tables<'clientes'>;
export type PedidoRow = Tables<'pedidos'>;
export type PedidoItemRow = Tables<'pedido_items'>;
export type AuditoriaLog = Tables<'auditoria_logs'>;

export interface Pedido extends PedidoRow {
  items: PedidoItemRow[];
}

export interface OrderDraftItem {
  cantidad: number;
  pizza: Pizza;
}

export interface CosteoIngredienteSnapshot {
  cantidad_receta: number;
  cantidad_total: number;
  costo_total: number;
  costo_unitario_actual: number;
  ingrediente_id: number;
  ingrediente_nombre: string;
  merma_porcentaje: number;
  unidad_medida_codigo: string | null;
  unidad_medida_id: number | null;
}

export interface CosteoSnapshot {
  cantidad: number;
  costo_total_linea: number;
  costo_unitario_pizza: number;
  ingredientes: CosteoIngredienteSnapshot[];
  pizza_id: number;
  pizza_nombre: string;
}

export const ITBIS_RATE = 0.18;

// =====================================
// SECCION: HELPERS COMPARTIDOS
// =====================================

export function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

export function formatPedidoCode(id: number) {
  return `#${String(id).padStart(4, '0')}`;
}

export function normalizePizzaImageKey(pizza: Pick<Pizza, 'codigo' | 'nombre'>) {
  if (pizza.codigo?.trim()) {
    return pizza.codigo.trim().toLowerCase();
  }

  return pizza.nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function mapPedidosWithItems(
  pedidos: PedidoRow[],
  pedidoItems: PedidoItemRow[]
): Pedido[] {
  return pedidos.map((pedido) => ({
    ...pedido,
    items: pedidoItems.filter((item) => item.pedido_id === pedido.id),
  }));
}

export function calculateOrderTotals(orderItems: OrderDraftItem[]) {
  const total = roundCurrency(
    orderItems.reduce(
      (sum, item) => sum + Number(item.pizza.precio_venta_publico) * item.cantidad,
      0
    )
  );
  const subtotal = roundCurrency(total / (1 + ITBIS_RATE));
  const impuestoTotal = roundCurrency(total - subtotal);
  const costoTotal = roundCurrency(
    orderItems.reduce(
      (sum, item) => sum + Number(item.pizza.costo_teorico_actual) * item.cantidad,
      0
    )
  );

  return {
    costoTotal,
    impuestoTotal,
    margenTotal: roundCurrency(subtotal - costoTotal),
    subtotal,
    total,
  };
}

export function buildCosteoSnapshot(params: {
  cantidad: number;
  ingredientes: Ingrediente[];
  pizza: Pizza;
  recetas: Receta[];
  unidadesMedida: UnidadMedida[];
}): CosteoSnapshot {
  const { cantidad, ingredientes, pizza, recetas, unidadesMedida } = params;
  const ingredientesById = new Map(ingredientes.map((ingrediente) => [ingrediente.id, ingrediente]));
  const unidadesById = new Map(unidadesMedida.map((unidad) => [unidad.id, unidad]));

  const ingredientesSnapshot = recetas
    .filter((receta) => receta.pizza_id === pizza.id)
    .map((receta) => {
      const ingrediente = ingredientesById.get(receta.ingrediente_id);
      const unidad = ingrediente ? unidadesById.get(ingrediente.unidad_medida_id) : null;
      const cantidadTotal =
        Number(receta.cantidad_requerida) *
        cantidad *
        (1 + Number(receta.merma_porcentaje || 0) / 100);
      const costoUnitario = Number(ingrediente?.costo_unitario_actual || 0);

      return {
        cantidad_receta: Number(receta.cantidad_requerida),
        cantidad_total: roundCurrency(cantidadTotal),
        costo_total: roundCurrency(cantidadTotal * costoUnitario),
        costo_unitario_actual: costoUnitario,
        ingrediente_id: receta.ingrediente_id,
        ingrediente_nombre: ingrediente?.nombre || 'Ingrediente',
        merma_porcentaje: Number(receta.merma_porcentaje || 0),
        unidad_medida_codigo: unidad?.codigo || null,
        unidad_medida_id: unidad?.id || null,
      };
    });

  const costoUnitarioPizza =
    ingredientesSnapshot.length > 0
      ? roundCurrency(
          ingredientesSnapshot.reduce((sum, item) => sum + item.costo_total, 0) /
            cantidad
        )
      : roundCurrency(Number(pizza.costo_teorico_actual));

  return {
    cantidad,
    costo_total_linea: roundCurrency(costoUnitarioPizza * cantidad),
    costo_unitario_pizza: costoUnitarioPizza,
    ingredientes: ingredientesSnapshot,
    pizza_id: pizza.id,
    pizza_nombre: pizza.nombre,
  };
}

export function buildPedidoItemsInsert(params: {
  ingredientes: Ingrediente[];
  items: OrderDraftItem[];
  pedidoId: number;
  recetas: Receta[];
  unidadesMedida: UnidadMedida[];
}): TablesInsert<'pedido_items'>[] {
  const { ingredientes, items, pedidoId, recetas, unidadesMedida } = params;

  return items.map(({ cantidad, pizza }) => {
    const costeo = buildCosteoSnapshot({
      cantidad,
      ingredientes,
      pizza,
      recetas,
      unidadesMedida,
    });

    return {
      cantidad,
      costeo_snapshot: costeo as unknown as Json,
      pedido_id: pedidoId,
      pizza_id: pizza.id,
      pizza_nombre_snapshot: pizza.nombre,
      precio_unitario: Number(pizza.precio_venta_publico),
      subtotal: roundCurrency(Number(pizza.precio_venta_publico) * cantidad),
    };
  });
}

export function parseAuditUser(log: AuditoriaLog) {
  return log.usuario_id?.trim() || 'sistema';
}

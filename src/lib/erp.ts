// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos tipos base generados automáticamente para garantizar integridad con Supabase
import type { Json, Tables, TablesInsert } from '@/integrations/supabase/types';

// ========================================== //
// SECCION: TIPOS BASE Y DOMINIO
// ========================================== //

// Alias de tipos para facilitar la lectura en el resto del proyecto
export type Pizza = Tables<'pizzas'>;
export type Ingrediente = Tables<'ingredientes'>;
export type UnidadMedida = Tables<'unidades_medida'>;
export type Receta = Tables<'recetas'>;
export type Cliente = Tables<'clientes'>;
export type PedidoRow = Tables<'pedidos'>;
export type PedidoItemRow = Tables<'pedido_items'>;
export type AuditoriaLog = Tables<'auditoria_logs'>;

/**
 * Interfaz Pedido: Estructura extendida que incluye las líneas de detalle (items).
 */
export interface Pedido extends PedidoRow {
  items: PedidoItemRow[];
}

/**
 * Interfaz OrderDraftItem: Representa un item en el carrito o borrador de pedido.
 */
export interface OrderDraftItem {
  cantidad: number;
  pizza: Pizza;
}

/**
 * CosteoIngredienteSnapshot: Estructura para el cálculo técnico del costo de un ingrediente en una pizza.
 */
export interface CosteoIngredienteSnapshot {
  cantidad_receta: number;      // Cantidad definida en la receta base
  cantidad_total: number;       // Cantidad real consumida (receta * cantidad pizzas)
  costo_total: number;          // Costo monetario total de este ingrediente en la línea
  costo_unitario_actual: number; // Precio de compra del ingrediente al momento del pedido
  ingrediente_id: number;
  ingrediente_nombre: string;
  merma_porcentaje: number;     // Margen de desperdicio técnico aplicado
  unidad_medida_codigo: string | null;
  unidad_medida_id: number | null;
}

/**
 * CosteoSnapshot: Representación completa del escandallaje capturado al momento de la venta.
 */
export interface CosteoSnapshot {
  cantidad: number;
  costo_total_linea: number;
  costo_unitario_pizza: number;
  ingredientes: CosteoIngredienteSnapshot[];
  pizza_id: number;
  pizza_nombre: string;
}

// Constante para el impuesto sobre ventas (República Dominicana)
export const ITBIS_RATE = 0.18;

// ========================================== //
// SECCION: HELPERS Y UTILIDADES DE NEGOCIO
// ========================================== //

/**
 * roundCurrency: Redondea un valor numérico a dos decimales para precisión monetaria.
 */
export function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

/**
 * formatPedidoCode: Convierte un ID numérico en un código amigable (ej: 5 -> #0005).
 */
export function formatPedidoCode(id: number) {
  return `#${String(id).padStart(4, '0')}`;
}

/**
 * normalizePizzaImageKey: Genera un slug único para identificar imágenes de pizzas.
 */
export function normalizePizzaImageKey(pizza: Pick<Pizza, 'codigo' | 'nombre'>) {
  if (pizza.codigo?.trim()) return pizza.codigo.trim().toLowerCase();
  
  return pizza.nombre
    .normalize('NFD') // Descompone caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Elimina los acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Reemplaza no-alfanuméricos por guiones
    .replace(/(^-|-$)/g, ''); // Limpia guiones en los extremos
}

/**
 * mapPedidosWithItems: Cruza las filas de pedidos con sus respectivos items de detalle.
 */
export function mapPedidosWithItems(pedidos: PedidoRow[], pedidoItems: PedidoItemRow[]): Pedido[] {
  return pedidos.map((p) => ({
    ...p,
    items: pedidoItems.filter((it) => it.pedido_id === p.id),
  }));
}

/**
 * calculateOrderTotals: Calcula toda la matemática financiera de un pedido.
 */
export function calculateOrderTotals(orderItems: OrderDraftItem[]) {
  // Suma total de los precios de venta
  const total = roundCurrency(
    orderItems.reduce((sum, it) => sum + Number(it.pizza.precio_venta_publico) * it.cantidad, 0)
  );
  // Desglose del subtotal quitando el ITBIS (1.18)
  const subtotal = roundCurrency(total / (1 + ITBIS_RATE));
  // Monto exacto del impuesto
  const impuestoTotal = roundCurrency(total - subtotal);
  // Suma total del costo técnico de producción
  const costoTotal = roundCurrency(
    orderItems.reduce((sum, it) => sum + Number(it.pizza.costo_teorico_actual) * it.cantidad, 0)
  );

  return {
    costoTotal,
    impuestoTotal,
    margenTotal: roundCurrency(subtotal - costoTotal), // Margen neto real
    subtotal,
    total,
  };
}

/**
 * buildCosteoSnapshot: Genera un desglose técnico del costo de una línea de pedido.
 * Cruza ingredientes y recetas para determinar el costo exacto al momento de la venta.
 */
export function buildCosteoSnapshot(params: {
  cantidad: number; ingredientes: Ingrediente[]; pizza: Pizza; recetas: Receta[]; unidadesMedida: UnidadMedida[];
}): CosteoSnapshot {
  const { cantidad, ingredientes, pizza, recetas, unidadesMedida } = params;
  const ingredientesById = new Map(ingredientes.map((i) => [i.id, i]));
  const unidadesById = new Map(unidadesMedida.map((u) => [u.id, u]));

  // Procesa cada ingrediente definido en la receta de esta pizza
  const ingredientesSnapshot = recetas
    .filter((r) => r.pizza_id === pizza.id)
    .map((r) => {
      const ingrediente = ingredientesById.get(r.ingrediente_id);
      const unidad = ingrediente ? unidadesById.get(ingrediente.unidad_medida_id) : null;
      // Cálculo de consumo real incluyendo merma técnica
      const cantidadTotal = Number(r.cantidad_requerida) * cantidad * (1 + Number(r.merma_porcentaje || 0) / 100);
      const costoUnitario = Number(ingrediente?.costo_unitario_actual || 0);

      return {
        cantidad_receta: Number(r.cantidad_requerida),
        cantidad_total: roundCurrency(cantidadTotal),
        costo_total: roundCurrency(cantidadTotal * costoUnitario),
        costo_unitario_actual: costoUnitario,
        ingrediente_id: r.ingrediente_id,
        ingrediente_nombre: ingrediente?.nombre || 'Ingrediente',
        merma_porcentaje: Number(r.merma_porcentaje || 0),
        unidad_medida_codigo: unidad?.codigo || null,
        unidad_medida_id: unidad?.id || null,
      };
    });

  // Determina el costo unitario de la pizza para este pedido específico
  const costoUnitarioPizza = ingredientesSnapshot.length > 0
      ? roundCurrency(ingredientesSnapshot.reduce((sum, it) => sum + it.costo_total, 0) / cantidad)
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

/**
 * buildPedidoItemsInsert: Transforma el borrador del pedido en el formato listo para inserción SQL.
 */
export function buildPedidoItemsInsert(params: {
  ingredientes: Ingrediente[]; items: OrderDraftItem[]; pedidoId: number; recetas: Receta[]; unidadesMedida: UnidadMedida[];
}): TablesInsert<'pedido_items'>[] {
  const { ingredientes, items, pedidoId, recetas, unidadesMedida } = params;

  return items.map(({ cantidad, pizza }) => {
    // Capturamos el snapshot técnico del costo en este preciso instante
    const costeo = buildCosteoSnapshot({ cantidad, ingredientes, pizza, recetas, unidadesMedida });

    return {
      cantidad,
      costeo_snapshot: costeo as unknown as Json, // Persistimos el desglose completo como JSON
      pedido_id: pedidoId,
      pizza_id: pizza.id,
      pizza_nombre_snapshot: pizza.nombre,
      precio_unitario: Number(pizza.precio_venta_publico),
      subtotal: roundCurrency(Number(pizza.precio_venta_publico) * cantidad),
    };
  });
}

/**
 * parseAuditUser: Normaliza la visualización del usuario en los logs de auditoría.
 */
export function parseAuditUser(log: AuditoriaLog) {
  return log.usuario_id?.trim() || 'sistema';
}

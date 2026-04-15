// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos hooks de React para memorización y control de estados locales
import { useMemo, useState } from 'react';
// Importamos componentes de framer-motion para transiciones visuales de la interfaz
import { AnimatePresence, motion } from 'framer-motion';
// Importamos una colección exhaustiva de iconos de lucide-react para la interfaz de pedidos
import {
  CheckCircle,
  Loader2,
  MapPin,
  Package,
  Pencil,
  Plus,
  Save,
  ShoppingCart,
  Trash2,
  Truck,
  User,
  X,
} from 'lucide-react';
// Importamos la utilidad de notificaciones para feedback operativo
import { toast } from 'sonner';
// Importamos el contexto global de la aplicación para acceder a todas las entidades del ERP
import { useApp } from '@/contexts/CartContext';
// Importamos el contexto de moneda para el formateo de precios y totales
import { useCurrency } from '@/contexts/CurrencyContext';
// Importamos utilidades de lógica de negocio para cálculos de pedidos y tipado de pizzas
import { calculateOrderTotals, formatPedidoCode, type Pizza } from '@/lib/erp';
// Importamos servicios de persistencia para las operaciones de base de datos de pedidos
import { deletePedido, savePedido } from '@/services/erpService';

// ========================================== //
// TIPOS Y DEFINICIONES
// ========================================== //
/**
 * Tipo TipoEntrega: Define las modalidades de entrega soportadas por el sistema.
 */
type TipoEntrega = 'delivery' | 'recogida';

/**
 * Tipo PedidoStatus: Estados posibles en el flujo de vida de un pedido.
 */
type PedidoStatus = 'pendiente' | 'completado' | 'cancelado';

/**
 * Interfaz PedidoItemFormRow: Estructura temporal para una fila de pizza en el formulario.
 */
interface PedidoItemFormRow {
  cantidad: string;   // Cantidad en formato string para el input
  pizza_id: string;   // ID de la pizza seleccionada
  row_id: string;     // Identificador único temporal para la fila del formulario
}

/**
 * Interfaz PedidoForm: Estructura completa de los datos capturados en el formulario de pedidos.
 */
interface PedidoForm {
  cliente_id: string;        // ID del cliente asociado
  direccion_entrega: string; // Dirección física (solo para delivery)
  estado: PedidoStatus;      // Estado inicial del pedido
  items: PedidoItemFormRow[];// Lista de pizzas y cantidades
  observaciones: string;     // Comentarios adicionales del cliente
  tipo: TipoEntrega;         // Modalidad de entrega
}

/**
 * STATUS_OPTIONS: Lista constante de los estados disponibles para mapeo en UI.
 */
const STATUS_OPTIONS: PedidoStatus[] = ['pendiente', 'completado', 'cancelado'];

// ========================================== //
// FUNCIONES AUXILIARES DE FORMULARIO
// ========================================== //
/**
 * createItemRow: Genera una nueva fila de item vacía o pre-poblada para el formulario.
 */
function createItemRow(pizzaId = ''): PedidoItemFormRow {
  return {
    cantidad: '1',
    pizza_id: pizzaId,
    row_id: Math.random().toString(36).slice(2, 10), // Generación de ID temporal único
  };
}

/**
 * createEmptyForm: Inicializa el estado del formulario de pedidos con valores por defecto.
 */
function createEmptyForm(): PedidoForm {
  return {
    cliente_id: '',
    direccion_entrega: '',
    estado: 'pendiente',
    items: [createItemRow()],
    observaciones: '',
    tipo: 'delivery',
  };
}

/**
 * normalizeStatusLabel: Traduce los estados internos a etiquetas legibles en español.
 */
function normalizeStatusLabel(status: PedidoStatus) {
  switch (status) {
    case 'completado': return 'Completado';
    case 'cancelado': return 'Cancelado';
    default: return 'Pendiente';
  }
}

// ========================================== //
// COMPONENTE PRINCIPAL (ADMINPEDIDOS)
// ========================================== //
/**
 * AdminPedidos: Panel de gestión de ventas que permite el control total sobre el ciclo de vida de los pedidos.
 */
const AdminPedidos = () => {
  // ========================================== //
  // ESTADO Y HOOKS
  // ========================================== //
  // Consumimos el estado global del ERP y la utilidad de moneda
  const { clientes, ingredientes, pedidos, pizzas, recetas, refreshData, unidadesMedida } = useApp();
  const { format } = useCurrency();

  // Estados de control de flujo y carga
  const [saving, setSaving] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<(typeof pedidos)[number] | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState<PedidoForm>(createEmptyForm);

  // ========================================== //
  // MAPAS Y CÁLCULOS MEMORIZADOS
  // ========================================== //
  // Mapas para búsqueda rápida de entidades por ID
  const pizzasById = useMemo(() => new Map(pizzas.map((p) => [p.id, p])), [pizzas]);
  const clientesById = useMemo(() => new Map(clientes.map((c) => [c.id, c])), [clientes]);

  // Cliente actualmente seleccionado en el formulario
  const selectedClient = useMemo(
    () => (form.cliente_id ? clientesById.get(Number(form.cliente_id)) ?? null : null),
    [clientesById, form.cliente_id]
  );

  // Transformación de los items del formulario a objetos de dominio con tipos reales
  const draftItems = useMemo(() => {
    return form.items
      .map((item) => {
        const pizza = pizzasById.get(Number(item.pizza_id)) ?? null;
        const cantidad = Number(item.cantidad);
        return {
          cantidad: Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 0,
          pizza,
          row_id: item.row_id,
        };
      })
      .filter((item): item is { cantidad: number; pizza: Pizza; row_id: string } => Boolean(item.pizza && item.cantidad > 0));
  }, [form.items, pizzasById]);

  // Cálculo automático de subtotales, impuestos y totales para el borrador actual
  const draftTotals = useMemo(
    () => calculateOrderTotals(draftItems.map((item) => ({ cantidad: item.cantidad, pizza: item.pizza }))),
    [draftItems]
  );

  // Organización de pedidos en columnas para vista tipo Kanban
  const kanbanColumns = useMemo(
    () => STATUS_OPTIONS.map((status) => ({
      label: normalizeStatusLabel(status),
      orders: pedidos.filter((p) => p.estado === status),
      status,
    })),
    [pedidos]
  );

  // ========================================== //
  // MANEJO DE INTERFAZ Y FORMULARIO
  // ========================================== //
  /**
   * resetForm: Limpia el estado del formulario y lo cierra.
   */
  const resetForm = () => {
    setEditingId(null);
    setForm(createEmptyForm());
    setShowForm(false);
  };

  /**
   * openCreate: Inicializa el formulario para un nuevo pedido con datos pre-cargados.
   */
  const openCreate = () => {
    if (clientes.length === 0) {
      toast.error('Crea al menos un cliente antes de registrar un pedido');
      return;
    }
    if (pizzas.length === 0) {
      toast.error('Necesitas pizzas activas para crear pedidos');
      return;
    }
    setEditingId(null);
    setForm({
      ...createEmptyForm(),
      cliente_id: String(clientes[0].id),
      direccion_entrega: clientes[0].direccion || '',
      items: [createItemRow(String(pizzas[0].id))],
    });
    setShowForm(true);
  };

  /**
   * openEdit: Carga un pedido existente en el formulario para su modificación.
   */
  const openEdit = (pedido: (typeof pedidos)[number]) => {
    setEditingId(pedido.id);
    setForm({
      cliente_id: pedido.cliente_id != null ? String(pedido.cliente_id) : '',
      direccion_entrega: pedido.direccion_entrega || '',
      estado: pedido.estado as PedidoStatus,
      items: pedido.items.length > 0
          ? pedido.items.map((item) => ({
              cantidad: String(item.cantidad),
              pizza_id: String(item.pizza_id),
              row_id: String(item.id),
            }))
          : [createItemRow(String(pizzas[0]?.id || ''))],
      observaciones: pedido.observaciones || '',
      tipo: pedido.tipo === 'recogida' ? 'recogida' : 'delivery',
    });
    setShowForm(true);
  };

  // ========================================== //
  // MANEJO DE ITEMS (FILAS DINÁMICAS)
  // ========================================== //
  /**
   * updateItemRow: Actualiza una propiedad específica de una fila de pizza.
   */
  const updateItemRow = (rowId: string, key: keyof Omit<PedidoItemFormRow, 'row_id'>, value: string) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item) => item.row_id === rowId ? { ...item, [key]: value } : item),
    }));
  };

  /**
   * addItemRow: Añade una nueva fila de pizza al pedido.
   */
  const addItemRow = () => {
    setForm((current) => ({
      ...current,
      items: [...current.items, createItemRow(String(pizzas[0]?.id || ''))],
    }));
  };

  /**
   * removeItemRow: Elimina una fila de pizza del pedido (mantiene al menos una).
   */
  const removeItemRow = (rowId: string) => {
    setForm((current) => ({
      ...current,
      items: current.items.length === 1 ? [createItemRow()] : current.items.filter((item) => item.row_id !== rowId),
    }));
  };

  // ========================================== //
  // PERSISTENCIA Y OPERACIONES CRUD
  // ========================================== //
  /**
   * handleSave: Ejecuta el servicio de guardado (creación o edición) del pedido.
   */
  const handleSave = async () => {
    // Validaciones de negocio antes de persistir
    if (!form.cliente_id) { toast.error('Selecciona un cliente para el pedido'); return; }
    const cliente = clientesById.get(Number(form.cliente_id));
    if (!cliente) { toast.error('El cliente seleccionado no es valido'); return; }
    if (draftItems.length === 0) { toast.error('Agrega al menos una pizza al pedido'); return; }
    if (form.tipo === 'delivery' && !form.direccion_entrega.trim()) { toast.error('La direccion es obligatoria para delivery'); return; }

    setSaving(true);
    try {
      await savePedido({
        cliente,
        direccionEntrega: form.direccion_entrega,
        estado: form.estado,
        ingredientes,
        items: draftItems.map((item) => ({ cantidad: item.cantidad, pizza: item.pizza })),
        observaciones: form.observaciones.trim() || null,
        pedidoId: editingId ?? undefined,
        recetas,
        tipo: form.tipo,
        unidadesMedida,
        usuarioId: null, // Asumimos que el usuario actual es el gestor
      });

      await refreshData();
      resetForm();
      toast.success(editingId != null ? 'Pedido actualizado' : 'Pedido creado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el pedido');
    } finally {
      setSaving(false);
    }
  };

  /**
   * handleQuickStatusChange: Actualiza el estado de un pedido directamente desde la tarjeta.
   */
  const handleQuickStatusChange = async (pedido: (typeof pedidos)[number], nextStatus: PedidoStatus) => {
    if (pedido.estado === nextStatus) return;
    const cliente = pedido.cliente_id != null ? clientesById.get(pedido.cliente_id) : null;
    if (!cliente) { toast.error('El cliente asociado al pedido no existe'); return; }

    setStatusUpdatingId(pedido.id);
    try {
      await savePedido({
        cliente,
        direccionEntrega: pedido.direccion_entrega,
        estado: nextStatus,
        ingredientes,
        items: pedido.items.map((item) => ({
          cantidad: item.cantidad,
          pizza: pizzasById.get(item.pizza_id) as Pizza,
        })),
        observaciones: pedido.observaciones,
        pedidoId: pedido.id,
        recetas,
        tipo: pedido.tipo as TipoEntrega,
        unidadesMedida,
        usuarioId: pedido.usuario_id,
      });

      await refreshData();
      toast.success(`${formatPedidoCode(pedido.id)} ahora esta en ${normalizeStatusLabel(nextStatus)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el estado');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  /**
   * handleDelete: Elimina un pedido y sus registros asociados.
   */
  const handleDelete = async (pedido: (typeof pedidos)[number]) => {
    setDeletingId(pedido.id);
    try {
      await deletePedido(pedido.id);
      await refreshData();
      setConfirmDelete(null);
      toast.success(`${formatPedidoCode(pedido.id)} eliminado`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el pedido');
    } finally {
      setDeletingId(null);
    }
  };

  // ========================================== //
  // RENDERIZADO
  // ========================================== //
  return (
    <div className="space-y-4">
      {/* HEADER DE SECCIÓN */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
            <ShoppingCart className="h-5 w-5 text-primary" /> Gestion de pedidos
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea pedidos, edita sus items y mueve su estado entre Pendiente, Completado y Cancelado.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Nuevo pedido
        </button>
      </div>

      {/* MÉTRICAS DE ESTADO (CONTEOS) */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Clientes disponibles</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{clientes.length}</p>
        </div>
        {STATUS_OPTIONS.map((status) => (
          <div key={status} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{normalizeStatusLabel(status)}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {pedidos.filter((p) => p.estado === status).length}
            </p>
          </div>
        ))}
      </div>

      {/* FORMULARIO DE PEDIDO (ANIMADO) */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-xl border border-primary/30 bg-card p-5"
          >
            {/* Header del formulario */}
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold text-foreground">
                  {editingId != null ? 'Editar pedido' : 'Nuevo pedido'}
                </h3>
                <p className="text-sm text-muted-foreground">Selecciona cliente, items y tipo de entrega.</p>
              </div>
              <button onClick={resetForm} className="rounded-md bg-secondary p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
              {/* LADO IZQUIERDO: CONFIGURACIÓN E ITEMS */}
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Selector de Cliente */}
                  <select
                    value={form.cliente_id}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      const cliente = clientesById.get(Number(nextId));
                      setForm((c) => ({
                        ...c,
                        cliente_id: nextId,
                        direccion_entrega: c.tipo === 'delivery' ? (c.direccion_entrega || cliente?.direccion || '') : c.direccion_entrega,
                      }));
                    }}
                    className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Selecciona un cliente</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}{c.email ? ` - ${c.email}` : ''}{!c.activo ? ' (Inactivo)' : ''}</option>
                    ))}
                  </select>

                  {/* Selector de Estado */}
                  <select
                    value={form.estado}
                    onChange={(e) => setForm((c) => ({ ...c, estado: e.target.value as PedidoStatus }))}
                    className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{normalizeStatusLabel(s)}</option>)}
                  </select>
                </div>

                {/* Switch de Tipo de Entrega */}
                <div className="flex gap-2">
                  {(['delivery', 'recogida'] as TipoEntrega[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((c) => ({
                        ...c,
                        direccion_entrega: t === 'delivery' ? (c.direccion_entrega || selectedClient?.direccion || '') : '',
                        tipo: t,
                      }))}
                      className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-all ${
                        form.tipo === t ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-secondary text-foreground hover:border-primary/40'
                      }`}
                    >
                      {t === 'delivery' ? 'Delivery' : 'Recogida'}
                    </button>
                  ))}
                </div>

                {/* Campo de Dirección (Solo Delivery) */}
                {form.tipo === 'delivery' && (
                  <input
                    type="text"
                    placeholder="Direccion de entrega"
                    value={form.direccion_entrega}
                    onChange={(e) => setForm((c) => ({ ...c, direccion_entrega: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                )}

                {/* Campo de Observaciones */}
                <textarea
                  rows={3}
                  placeholder="Observaciones del pedido"
                  value={form.observaciones}
                  onChange={(e) => setForm((c) => ({ ...c, observaciones: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />

                {/* LISTA DE ITEMS DINÁMICA */}
                <div className="rounded-xl border border-border bg-secondary/30 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className="font-display text-base font-semibold text-foreground">Items del pedido</h4>
                    <button type="button" onClick={addItemRow} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                      <Plus className="h-4 w-4" /> Agregar
                    </button>
                  </div>

                  <div className="space-y-3">
                    {form.items.map((item) => {
                      const pizza = pizzasById.get(Number(item.pizza_id));
                      const lineTotal = pizza ? format(Number(pizza.precio_venta_publico) * Number(item.cantidad || 0)) : format(0);

                      return (
                        <div key={item.row_id} className="grid gap-3 rounded-lg border border-border bg-card p-3 md:grid-cols-[2fr,120px,140px,44px]">
                          <select
                            value={item.pizza_id}
                            onChange={(e) => updateItemRow(item.row_id, 'pizza_id', e.target.value)}
                            className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          >
                            <option value="">Selecciona una pizza</option>
                            {pizzas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                          </select>
                          <input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={(e) => updateItemRow(item.row_id, 'cantidad', e.target.value)}
                            className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                          <div className="flex items-center rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground">{lineTotal}</div>
                          <button type="button" onClick={() => removeItemRow(item.row_id)} className="flex items-center justify-center rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* LADO DERECHO: RESUMEN Y TOTALES */}
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <h4 className="font-display text-base font-semibold text-foreground">Resumen</h4>
                <div className="mt-4 space-y-3 text-sm">
                  {/* Info Cliente */}
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4 text-primary" />{selectedClient?.nombre || 'Sin cliente'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{selectedClient?.telefono || 'Sin telefono registrado'}</p>
                  </div>
                  {/* Info Entrega */}
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="flex items-center gap-2 text-muted-foreground"><Truck className="h-4 w-4 text-primary" />{form.tipo === 'delivery' ? 'Delivery' : 'Recogida'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{form.tipo === 'delivery' ? (form.direccion_entrega || 'Direccion pendiente') : 'Retiro en local'}</p>
                  </div>
                  {/* Info Financiera */}
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="flex items-center gap-2 text-muted-foreground"><Package className="h-4 w-4 text-primary" />{draftItems.reduce((sum, item) => sum + item.cantidad, 0)} item(s)</p>
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">{format(draftTotals.subtotal)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">ITBIS</span><span className="text-foreground">{format(draftTotals.impuestoTotal)}</span></div>
                      <div className="flex justify-between border-t border-border pt-2 text-base font-semibold"><span className="text-foreground">Total</span><span className="text-primary">{format(draftTotals.total)}</span></div>
                    </div>
                  </div>
                </div>

                {/* Acciones Finales del Formulario */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingId != null ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />)}
                    {editingId != null ? 'Guardar pedido' : 'Crear pedido'}
                  </button>
                  <button onClick={resetForm} className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"><X className="h-4 w-4" /> Cancelar</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VISTA KANBAN DE PEDIDOS POR ESTADO */}
      <div className="grid gap-4 xl:grid-cols-3">
        {kanbanColumns.map((column) => (
          <div key={column.status} className="rounded-xl border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {column.status === 'completado' ? <CheckCircle className="h-4 w-4 text-success" /> : <ShoppingCart className="h-4 w-4 text-primary" />}
                <h3 className="font-display text-base font-semibold text-foreground">{column.label}</h3>
              </div>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">{column.orders.length}</span>
            </div>

            <div className="space-y-3">
              {column.orders.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm italic text-muted-foreground">No hay pedidos en esta columna.</p>
              ) : (
                column.orders.map((p) => (
                  <div key={p.id} className="rounded-xl border border-border/70 bg-secondary/30 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{formatPedidoCode(p.id)} · ID {p.id}</p>
                        <h4 className="mt-1 font-display text-base font-semibold text-foreground">{p.cliente_nombre_snapshot}</h4>
                        <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString('es-DO')}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(p)} className="rounded-md bg-primary/20 p-1.5 text-primary hover:bg-primary/30"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setConfirmDelete(p)} disabled={deletingId === p.id} className="rounded-md bg-destructive/20 p-1.5 text-destructive hover:bg-destructive/30 disabled:opacity-50">
                          {deletingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2 text-sm">
                      <p className="flex items-center gap-2 text-muted-foreground"><Truck className="h-4 w-4 text-primary" />{p.tipo === 'recogida' ? 'Recogida' : 'Delivery'}</p>
                      {p.direccion_entrega && <p className="flex items-start gap-2 text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{p.direccion_entrega}</p>}
                      <p className="text-muted-foreground">{p.items.length === 0 ? 'Sin items' : p.items.slice(0, 3).map((it) => `${it.cantidad}x ${it.pizza_nombre_snapshot}`).join(', ')}</p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                      <div><p className="text-xs text-muted-foreground">Total</p><p className="text-base font-semibold text-foreground">{format(Number(p.total))}</p></div>
                      <div className="text-right"><p className="text-xs text-muted-foreground">Items</p><p className="text-base font-semibold text-foreground">{p.items.reduce((sum, it) => sum + Number(it.cantidad), 0)}</p></div>
                    </div>

                    {/* BOTONES DE CAMBIO RÁPIDO DE ESTADO */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map((s) => {
                        const active = p.estado === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleQuickStatusChange(p, s)}
                            disabled={statusUpdatingId === p.id}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                              active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {normalizeStatusLabel(s)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-2xl">
              <h3 className="text-lg font-semibold text-foreground">Eliminar pedido</h3>
              <p className="mt-2 text-sm text-muted-foreground">Se eliminara {formatPedidoCode(confirmDelete.id)} y todos sus items.</p>
              <div className="mt-6 flex gap-3">
                <button onClick={() => handleDelete(confirmDelete)} disabled={deletingId === confirmDelete.id} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-50">
                  {deletingId === confirmDelete.id && <Loader2 className="h-4 w-4 animate-spin" />}Eliminar
                </button>
                <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Cancelar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ========================================== //
// EXPORTACIÓN
// ========================================== //
export default AdminPedidos;

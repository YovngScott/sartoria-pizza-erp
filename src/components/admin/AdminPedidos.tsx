import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
import { toast } from 'sonner';
import { useApp } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { calculateOrderTotals, formatPedidoCode, type Pizza } from '@/lib/erp';
import { deletePedido, savePedido } from '@/services/erpService';

type TipoEntrega = 'delivery' | 'recogida';
type PedidoStatus = 'pendiente' | 'completado' | 'cancelado';

interface PedidoItemFormRow {
  cantidad: string;
  pizza_id: string;
  row_id: string;
}

interface PedidoForm {
  cliente_id: string;
  direccion_entrega: string;
  estado: PedidoStatus;
  items: PedidoItemFormRow[];
  observaciones: string;
  tipo: TipoEntrega;
}

const STATUS_OPTIONS: PedidoStatus[] = ['pendiente', 'completado', 'cancelado'];

function createItemRow(pizzaId = ''): PedidoItemFormRow {
  return {
    cantidad: '1',
    pizza_id: pizzaId,
    row_id: Math.random().toString(36).slice(2, 10),
  };
}

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

function normalizeStatusLabel(status: PedidoStatus) {
  switch (status) {
    case 'completado':
      return 'Completado';
    case 'cancelado':
      return 'Cancelado';
    default:
      return 'Pendiente';
  }
}

const AdminPedidos = () => {
  const { clientes, ingredientes, pedidos, pizzas, recetas, refreshData, unidadesMedida } = useApp();
  const { format } = useCurrency();

  const [saving, setSaving] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<(typeof pedidos)[number] | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState<PedidoForm>(createEmptyForm);

  const pizzasById = useMemo(() => new Map(pizzas.map((pizza) => [pizza.id, pizza])), [pizzas]);
  const clientesById = useMemo(() => new Map(clientes.map((cliente) => [cliente.id, cliente])), [clientes]);

  const selectedClient = useMemo(
    () => (form.cliente_id ? clientesById.get(Number(form.cliente_id)) ?? null : null),
    [clientesById, form.cliente_id]
  );

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

  const draftTotals = useMemo(
    () =>
      calculateOrderTotals(
        draftItems.map((item) => ({
          cantidad: item.cantidad,
          pizza: item.pizza,
        }))
      ),
    [draftItems]
  );

  const kanbanColumns = useMemo(
    () =>
      STATUS_OPTIONS.map((status) => ({
        label: normalizeStatusLabel(status),
        orders: pedidos.filter((pedido) => pedido.estado === status),
        status,
      })),
    [pedidos]
  );

  const resetForm = () => {
    setEditingId(null);
    setForm(createEmptyForm());
    setShowForm(false);
  };

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

  const openEdit = (pedido: (typeof pedidos)[number]) => {
    setEditingId(pedido.id);
    setForm({
      cliente_id: pedido.cliente_id != null ? String(pedido.cliente_id) : '',
      direccion_entrega: pedido.direccion_entrega || '',
      estado: pedido.estado as PedidoStatus,
      items:
        pedido.items.length > 0
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

  const updateItemRow = (
    rowId: string,
    key: keyof Omit<PedidoItemFormRow, 'row_id'>,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.row_id === rowId ? { ...item, [key]: value } : item
      ),
    }));
  };

  const addItemRow = () => {
    setForm((current) => ({
      ...current,
      items: [...current.items, createItemRow(String(pizzas[0]?.id || ''))],
    }));
  };

  const removeItemRow = (rowId: string) => {
    setForm((current) => ({
      ...current,
      items: current.items.length === 1 ? [createItemRow()] : current.items.filter((item) => item.row_id !== rowId),
    }));
  };

  const handleSave = async () => {
    if (!form.cliente_id) {
      toast.error('Selecciona un cliente para el pedido');
      return;
    }

    const cliente = clientesById.get(Number(form.cliente_id));
    if (!cliente) {
      toast.error('El cliente seleccionado no es valido');
      return;
    }

    if (draftItems.length === 0) {
      toast.error('Agrega al menos una pizza al pedido');
      return;
    }

    if (form.tipo === 'delivery' && !form.direccion_entrega.trim()) {
      toast.error('La direccion es obligatoria para delivery');
      return;
    }

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
        usuarioId: null,
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

  const handleQuickStatusChange = async (
    pedido: (typeof pedidos)[number],
    nextStatus: PedidoStatus
  ) => {
    if (pedido.estado === nextStatus) return;
    const cliente = pedido.cliente_id != null ? clientesById.get(pedido.cliente_id) : null;
    if (!cliente) {
      toast.error('El cliente asociado al pedido no existe');
      return;
    }

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

  return (
    <div className="space-y-4">
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

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Clientes disponibles</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{clientes.length}</p>
        </div>
        {STATUS_OPTIONS.map((status) => (
          <div key={status} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {normalizeStatusLabel(status)}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {pedidos.filter((pedido) => pedido.estado === status).length}
            </p>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-xl border border-primary/30 bg-card p-5"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold text-foreground">
                  {editingId != null ? 'Editar pedido' : 'Nuevo pedido'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Selecciona cliente, items y tipo de entrega.
                </p>
              </div>
              <button
                onClick={resetForm}
                className="rounded-md bg-secondary p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <select
                    value={form.cliente_id}
                    onChange={(event) => {
                      const nextId = event.target.value;
                      const cliente = clientesById.get(Number(nextId));

                      setForm((current) => ({
                        ...current,
                        cliente_id: nextId,
                        direccion_entrega:
                          current.tipo === 'delivery'
                            ? current.direccion_entrega || cliente?.direccion || ''
                            : current.direccion_entrega,
                      }));
                    }}
                    className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Selecciona un cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                        {cliente.email ? ` - ${cliente.email}` : ''}
                        {!cliente.activo ? ' (Inactivo)' : ''}
                      </option>
                    ))}
                  </select>

                  <select
                    value={form.estado}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        estado: event.target.value as PedidoStatus,
                      }))
                    }
                    className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {normalizeStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  {(['delivery', 'recogida'] as TipoEntrega[]).map((tipoEntrega) => (
                    <button
                      key={tipoEntrega}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          direccion_entrega:
                            tipoEntrega === 'delivery'
                              ? current.direccion_entrega || selectedClient?.direccion || ''
                              : '',
                          tipo: tipoEntrega,
                        }))
                      }
                      className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-all ${
                        form.tipo === tipoEntrega
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-secondary text-foreground hover:border-primary/40'
                      }`}
                    >
                      {tipoEntrega === 'delivery' ? 'Delivery' : 'Recogida'}
                    </button>
                  ))}
                </div>

                {form.tipo === 'delivery' && (
                  <input
                    type="text"
                    placeholder="Direccion de entrega"
                    value={form.direccion_entrega}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        direccion_entrega: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                )}

                <textarea
                  rows={3}
                  placeholder="Observaciones del pedido"
                  value={form.observaciones}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      observaciones: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />

                <div className="rounded-xl border border-border bg-secondary/30 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-display text-base font-semibold text-foreground">
                        Items del pedido
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Selecciona las pizzas y sus cantidades.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addItemRow}
                      className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
                    >
                      <Plus className="h-4 w-4" /> Agregar
                    </button>
                  </div>

                  <div className="space-y-3">
                    {form.items.map((item) => {
                      const pizza = pizzasById.get(Number(item.pizza_id));
                      const lineTotal = pizza
                        ? format(Number(pizza.precio_venta_publico) * Number(item.cantidad || 0))
                        : format(0);

                      return (
                        <div
                          key={item.row_id}
                          className="grid gap-3 rounded-lg border border-border bg-card p-3 md:grid-cols-[2fr,120px,140px,44px]"
                        >
                          <select
                            value={item.pizza_id}
                            onChange={(event) => updateItemRow(item.row_id, 'pizza_id', event.target.value)}
                            className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          >
                            <option value="">Selecciona una pizza</option>
                            {pizzas.map((pizzaOption) => (
                              <option key={pizzaOption.id} value={pizzaOption.id}>
                                {pizzaOption.nombre}
                              </option>
                            ))}
                          </select>

                          <input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={(event) => updateItemRow(item.row_id, 'cantidad', event.target.value)}
                            className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />

                          <div className="flex items-center rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground">
                            {lineTotal}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItemRow(item.row_id)}
                            className="flex items-center justify-center rounded-lg bg-destructive/20 text-destructive transition-colors hover:bg-destructive/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <h4 className="font-display text-base font-semibold text-foreground">Resumen</h4>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4 text-primary" />
                      {selectedClient?.nombre || 'Sin cliente'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedClient?.telefono || 'Sin telefono registrado'}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Truck className="h-4 w-4 text-primary" />
                      {form.tipo === 'delivery' ? 'Delivery' : 'Recogida'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {form.tipo === 'delivery'
                        ? form.direccion_entrega || 'Direccion pendiente'
                        : 'Retiro en local'}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Package className="h-4 w-4 text-primary" />
                      {draftItems.reduce((sum, item) => sum + item.cantidad, 0)} item(s)
                    </p>
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="text-foreground">{format(draftTotals.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ITBIS</span>
                        <span className="text-foreground">{format(draftTotals.impuestoTotal)}</span>
                      </div>
                      <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                        <span className="text-foreground">Total</span>
                        <span className="text-primary">{format(draftTotals.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : editingId != null ? (
                      <Save className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {editingId != null ? 'Guardar pedido' : 'Crear pedido'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-muted"
                  >
                    <X className="h-4 w-4" /> Cancelar
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4 xl:grid-cols-3">
        {kanbanColumns.map((column) => (
          <div key={column.status} className="rounded-xl border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {column.status === 'completado' ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <ShoppingCart className="h-4 w-4 text-primary" />
                )}
                <h3 className="font-display text-base font-semibold text-foreground">
                  {column.label}
                </h3>
              </div>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {column.orders.length}
              </span>
            </div>

            <div className="space-y-3">
              {column.orders.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm italic text-muted-foreground">
                  No hay pedidos en esta columna.
                </p>
              ) : (
                column.orders.map((pedido) => (
                  <div key={pedido.id} className="rounded-xl border border-border/70 bg-secondary/30 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          {formatPedidoCode(pedido.id)} · ID {pedido.id}
                        </p>
                        <h4 className="mt-1 font-display text-base font-semibold text-foreground">
                          {pedido.cliente_nombre_snapshot}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(pedido.created_at).toLocaleString('es-DO')}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(pedido)}
                          className="rounded-md bg-primary/20 p-1.5 text-primary transition-colors hover:bg-primary/30"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(pedido)}
                          disabled={deletingId === pedido.id}
                          className="rounded-md bg-destructive/20 p-1.5 text-destructive transition-colors hover:bg-destructive/30 disabled:opacity-50"
                        >
                          {deletingId === pedido.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2 text-sm">
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Truck className="h-4 w-4 text-primary" />
                        {pedido.tipo === 'recogida' ? 'Recogida' : 'Delivery'}
                      </p>
                      {pedido.direccion_entrega && (
                        <p className="flex items-start gap-2 text-muted-foreground">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          {pedido.direccion_entrega}
                        </p>
                      )}
                      <p className="text-muted-foreground">
                        {pedido.items.length === 0
                          ? 'Sin items'
                          : pedido.items
                              .slice(0, 3)
                              .map((item) => `${item.cantidad}x ${item.pizza_nombre_snapshot}`)
                              .join(', ')}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-base font-semibold text-foreground">
                          {format(Number(pedido.total))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Items</p>
                        <p className="text-base font-semibold text-foreground">
                          {pedido.items.reduce((sum, item) => sum + Number(item.cantidad), 0)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map((status) => {
                        const active = pedido.estado === status;

                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => handleQuickStatusChange(pedido, status)}
                            disabled={statusUpdatingId === pedido.id}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                              active
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {normalizeStatusLabel(status)}
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

      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-foreground">Eliminar pedido</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Se eliminara {formatPedidoCode(confirmDelete.id)} y todos sus items.
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  disabled={deletingId === confirmDelete.id}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition-colors hover:opacity-90 disabled:opacity-50"
                >
                  {deletingId === confirmDelete.id && <Loader2 className="h-4 w-4 animate-spin" />}
                  Eliminar
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPedidos;

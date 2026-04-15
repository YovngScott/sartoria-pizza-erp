// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos hooks de React para memorización y gestión de estados locales complejos
import { useMemo, useState } from 'react';
// Importamos iconos de lucide-react para señalización visual de estados y acciones
import {
  AlertTriangle,
  Download,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
// Importamos componentes para animaciones suaves y control de ciclos de vida de UI
import { AnimatePresence, motion } from 'framer-motion';
// Importamos la utilidad de notificaciones 'toast' para retroalimentación operativa
import { toast } from 'sonner';
// Importamos el cliente de Supabase para interactuar con el backend
import { supabase } from '@/integrations/supabase/client';
// Importamos tipos de TypeScript para asegurar la integridad de los datos
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
// Importamos el contexto de la aplicación para acceder al estado global del inventario
import { useApp } from '@/contexts/CartContext';
// Importamos el contexto de moneda para formatear valores económicos
import { useCurrency } from '@/contexts/CurrencyContext';

// ========================================== //
// TIPOS Y DEFINICIONES
// ========================================== //
/**
 * Tipo Ingrediente: Estructura de datos para un elemento del inventario.
 */
type Ingrediente = Tables<'ingredientes'>;

// ========================================== //
// COMPONENTE PRINCIPAL (ADMININVENTARIO)
// ========================================== //
/**
 * AdminInventario: Panel de gestión técnica para el control de stock, costos y alertas de reabastecimiento.
 */
const AdminInventario = () => {
  // ========================================== //
  // ESTADO Y HOOKS
  // ========================================== //
  // Extraemos utilidades de moneda y datos globales
  const { format } = useCurrency();
  const { ingredientes, refreshData, unidadesMedida } = useApp();

  // Estados para el control de edición en línea
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Almacena los valores temporales durante la edición de una fila
  const [editValues, setEditValues] = useState({
    costo_unitario_actual: '',
    stock_actual: '',
    stock_minimo: '',
    unidad_medida_id: '',
  });

  // Almacena los valores para la creación de un nuevo ingrediente
  const [newForm, setNewForm] = useState({
    costo_unitario_actual: '',
    nombre: '',
    stock_actual: '',
    stock_minimo: '',
    unidad_medida_id: '',
  });

  // ========================================== //
  // CÁLCULOS MEMORIZADOS
  // ========================================== //
  /**
   * unidadesPorId: Mapa eficiente para buscar códigos de unidad (KG, L, etc.) por su ID numérico.
   */
  const unidadesPorId = useMemo(
    () => new Map(unidadesMedida.map((unidad) => [unidad.id, unidad.codigo] as const)),
    [unidadesMedida]
  );

  // ========================================== //
  // MANEJO DE EDICIÓN
  // ========================================== //
  /**
   * startEdit: Activa el modo de edición para un ingrediente específico.
   */
  const startEdit = (ingrediente: Ingrediente) => {
    setEditingId(ingrediente.id);
    setEditValues({
      costo_unitario_actual: String(ingrediente.costo_unitario_actual),
      stock_actual: String(ingrediente.stock_actual),
      stock_minimo: String(ingrediente.stock_minimo),
      unidad_medida_id: String(ingrediente.unidad_medida_id),
    });
  };

  /**
   * cancelEdit: Revierte los cambios no guardados y sale del modo edición.
   */
  const cancelEdit = () => {
    setEditingId(null);
  };

  /**
   * saveEdit: Persiste los cambios realizados en una fila de ingrediente.
   */
  const saveEdit = async (ingrediente: Ingrediente) => {
    // Construimos el payload de actualización con conversiones numéricas
    const payload: TablesUpdate<'ingredientes'> = {
      costo_unitario_actual: Number(editValues.costo_unitario_actual),
      stock_actual: Number(editValues.stock_actual),
      stock_minimo: Number(editValues.stock_minimo),
      unidad_medida_id: Number(editValues.unidad_medida_id),
    };

    // Validación rigurosa de tipos y valores positivos
    if (
      !payload.unidad_medida_id ||
      [payload.costo_unitario_actual, payload.stock_actual, payload.stock_minimo].some(
        (value) => value == null || Number.isNaN(Number(value)) || Number(value) < 0
      )
    ) {
      toast.error('Completa valores validos antes de guardar');
      return;
    }

    setSaving(true);

    // Ejecutamos la actualización en Supabase
    const { error } = await supabase.from('ingredientes').update(payload).eq('id', ingrediente.id);

    if (error) {
      toast.error(`Error al actualizar: ${error.message}`);
      setSaving(false);
      return;
    }

    // Refrescamos datos y limpiamos estado
    await refreshData();
    setEditingId(null);
    setSaving(false);
    toast.success(`"${ingrediente.nombre}" actualizado`);
  };

  // ========================================== //
  // CREACIÓN Y ELIMINACIÓN
  // ========================================== //
  /**
   * handleCreate: Inserta un nuevo registro de ingrediente en la base de datos.
   */
  const handleCreate = async () => {
    const payload: TablesInsert<'ingredientes'> = {
      activo: true,
      costo_unitario_actual: Number(newForm.costo_unitario_actual),
      nombre: newForm.nombre.trim(),
      stock_actual: Number(newForm.stock_actual),
      stock_minimo: Number(newForm.stock_minimo),
      unidad_medida_id: Number(newForm.unidad_medida_id),
    };

    // Validación de campos obligatorios
    if (
      !payload.nombre ||
      !payload.unidad_medida_id ||
      [payload.costo_unitario_actual, payload.stock_actual, payload.stock_minimo].some(
        (value) => value == null || Number.isNaN(Number(value)) || Number(value) < 0
      )
    ) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    setCreating(true);

    const { data, error } = await supabase
      .from('ingredientes')
      .insert(payload)
      .select('*')
      .single();

    if (error || !data) {
      toast.error(`Error al crear ingrediente: ${error?.message}`);
      setCreating(false);
      return;
    }

    await refreshData();
    // Limpiamos el formulario tras el éxito
    setNewForm({
      costo_unitario_actual: '',
      nombre: '',
      stock_actual: '',
      stock_minimo: '',
      unidad_medida_id: '',
    });
    setShowForm(false);
    setCreating(false);
    toast.success(`"${data.nombre}" agregado al inventario`);
  };

  /**
   * handleDelete: Remueve un ingrediente del sistema tras confirmación.
   */
  const handleDelete = async (ingrediente: Ingrediente) => {
    if (!confirm(`Eliminar "${ingrediente.nombre}" del inventario?`)) return;

    setDeleting(ingrediente.id);

    const { error } = await supabase.from('ingredientes').delete().eq('id', ingrediente.id);

    if (error) {
      toast.error(`Error al eliminar: ${error.message}`);
      setDeleting(null);
      return;
    }

    // Si estábamos editando este item, cancelamos la edición
    if (editingId === ingrediente.id) {
      setEditingId(null);
    }

    await refreshData();
    setDeleting(null);
    toast.success(`"${ingrediente.nombre}" eliminado`);
  };

  // ========================================== //
  // EXPORTACIÓN CSV
  // ========================================== //
  /**
   * exportCSV: Genera un reporte tabular en texto plano para hojas de cálculo.
   */
  const exportCSV = () => {
    const headers = ['Ingrediente', 'Unidad', 'Stock Actual', 'Stock Minimo', 'Costo Unitario', 'Estado'];
    const rows = ingredientes.map((ingrediente) => {
      const low = Number(ingrediente.stock_actual) < Number(ingrediente.stock_minimo);
      return [
        ingrediente.nombre,
        unidadesPorId.get(ingrediente.unidad_medida_id) || '',
        String(Number(ingrediente.stock_actual)),
        String(Number(ingrediente.stock_minimo)),
        Number(ingrediente.costo_unitario_actual).toFixed(2),
        low ? 'Reabastecer' : 'OK',
      ];
    });

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ingredientes_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Inventario exportado a CSV');
  };

  // ========================================== //
  // RENDERIZADO
  // ========================================== //
  return (
    <div className="space-y-4">
      {/* HEADER DE SECCIÓN */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Inventario de ingredientes
        </h2>
        <div className="flex items-center gap-2">
          {/* Acción: Exportar */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
          >
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
          {/* Acción: Mostrar formulario de creación */}
          <button
            onClick={() => setShowForm((current) => !current)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Nuevo ingrediente
          </button>
        </div>
      </div>

      {/* SECCIÓN: FORMULARIO DE NUEVO INGREDIENTE */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-xl border border-primary/30 bg-card p-5"
          >
            <h3 className="mb-4 font-display text-base font-semibold text-foreground">
              Nuevo ingrediente
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Input: Nombre */}
              <input
                placeholder="Nombre *"
                value={newForm.nombre}
                onChange={(event) =>
                  setNewForm((form) => ({ ...form, nombre: event.target.value }))
                }
                className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {/* Select: Unidad de Medida */}
              <select
                value={newForm.unidad_medida_id}
                onChange={(event) =>
                  setNewForm((form) => ({
                    ...form,
                    unidad_medida_id: event.target.value,
                  }))
                }
                className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Unidad *</option>
                {unidadesMedida.map((unidad) => (
                  <option key={unidad.id} value={unidad.id}>
                    {unidad.codigo}
                  </option>
                ))}
              </select>
              {/* Input: Stock Inicial */}
              <input
                placeholder="Stock actual"
                type="number"
                value={newForm.stock_actual}
                onChange={(event) =>
                  setNewForm((form) => ({
                    ...form,
                    stock_actual: event.target.value,
                  }))
                }
                className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {/* Input: Punto de Reorden */}
              <input
                placeholder="Stock minimo"
                type="number"
                value={newForm.stock_minimo}
                onChange={(event) =>
                  setNewForm((form) => ({
                    ...form,
                    stock_minimo: event.target.value,
                  }))
                }
                className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {/* Input: Costo Unitario */}
              <input
                placeholder="Costo unitario"
                type="number"
                step="0.01"
                value={newForm.costo_unitario_actual}
                onChange={(event) =>
                  setNewForm((form) => ({
                    ...form,
                    costo_unitario_actual: event.target.value,
                  }))
                }
                className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            {/* Acciones del formulario */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Crear ingrediente
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECCIÓN: TABLA DE INVENTARIO */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 font-semibold text-muted-foreground">Ingrediente</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Unidad</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Stock actual</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Stock minimo</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Costo unitario</th>
              <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Estado</th>
              <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ingredientes.map((ingrediente) => {
              // Lógica visual para alerta de stock bajo
              const low = Number(ingrediente.stock_actual) < Number(ingrediente.stock_minimo);
              const isEditing = editingId === ingrediente.id;

              return (
                <tr
                  key={ingrediente.id}
                  className={`border-b border-border/50 transition-colors ${
                    low ? 'bg-destructive/10' : 'hover:bg-secondary/50'
                  }`}
                >
                  {/* Celda: Nombre del Ingrediente */}
                  <td className="px-4 py-3 font-medium text-foreground">{ingrediente.nombre}</td>
                  
                  {/* Celda: Unidad de Medida */}
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <select
                        value={editValues.unidad_medida_id}
                        onChange={(event) =>
                          setEditValues((values) => ({
                            ...values,
                            unidad_medida_id: event.target.value,
                          }))
                        }
                        className="w-28 rounded-md border border-primary bg-secondary px-2 py-1 text-right text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        {unidadesMedida.map((unidad) => (
                          <option key={unidad.id} value={unidad.id}>
                            {unidad.codigo}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-muted-foreground">
                        {unidadesPorId.get(ingrediente.unidad_medida_id) || '-'}
                      </span>
                    )}
                  </td>

                  {/* Celda: Stock Actual (Editable) */}
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editValues.stock_actual}
                        onChange={(event) =>
                          setEditValues((values) => ({
                            ...values,
                            stock_actual: event.target.value,
                          }))
                        }
                        className="w-24 rounded-md border border-primary bg-secondary px-2 py-1 text-right text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    ) : (
                      <span className={`font-semibold ${low ? 'text-destructive' : 'text-foreground'}`}>
                        {Number(ingrediente.stock_actual).toLocaleString()}
                      </span>
                    )}
                  </td>

                  {/* Celda: Stock Mínimo (Editable) */}
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editValues.stock_minimo}
                        onChange={(event) =>
                          setEditValues((values) => ({
                            ...values,
                            stock_minimo: event.target.value,
                          }))
                        }
                        className="w-24 rounded-md border border-primary bg-secondary px-2 py-1 text-right text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    ) : (
                      <span className="text-muted-foreground">
                        {Number(ingrediente.stock_minimo).toLocaleString()}
                      </span>
                    )}
                  </td>

                  {/* Celda: Costo Unitario (Editable) */}
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editValues.costo_unitario_actual}
                        onChange={(event) =>
                          setEditValues((values) => ({
                            ...values,
                            costo_unitario_actual: event.target.value,
                          }))
                        }
                        className="w-24 rounded-md border border-primary bg-secondary px-2 py-1 text-right text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    ) : (
                      <span className="text-muted-foreground">
                        {format(Number(ingrediente.costo_unitario_actual))}
                      </span>
                    )}
                  </td>

                  {/* Celda: Estado Visual */}
                  <td className="px-4 py-3 text-center">
                    {low ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 px-2 py-0.5 text-xs font-medium text-destructive">
                        <AlertTriangle className="h-3 w-3" /> Reabastecer
                      </span>
                    ) : (
                      <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs font-medium text-success">
                        OK
                      </span>
                    )}
                  </td>

                  {/* Celda: Acciones (Editar/Eliminar/Guardar/Cancelar) */}
                  <td className="px-4 py-3 text-center">
                    {isEditing ? (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => saveEdit(ingrediente)}
                          disabled={saving}
                          className="rounded-md bg-success/20 p-1.5 text-success transition-colors hover:bg-success/30 disabled:opacity-50"
                        >
                          <Save className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-md bg-destructive/20 p-1.5 text-destructive transition-colors hover:bg-destructive/30"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(ingrediente)}
                          className="rounded-md bg-primary/20 p-1.5 text-primary transition-colors hover:bg-primary/30"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(ingrediente)}
                          disabled={deleting === ingrediente.id}
                          className="rounded-md bg-destructive/20 p-1.5 text-destructive transition-colors hover:bg-destructive/30 disabled:opacity-50"
                        >
                          {deleting === ingrediente.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ========================================== //
// EXPORTACIÓN
// ========================================== //
export default AdminInventario;

import { useMemo, useState } from 'react';
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
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useApp } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';

type Ingrediente = Tables<'ingredientes'>;

const AdminInventario = () => {
  const { format } = useCurrency();
  const { ingredientes, refreshData, unidadesMedida } = useApp();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [editValues, setEditValues] = useState({
    costo_unitario_actual: '',
    stock_actual: '',
    stock_minimo: '',
    unidad_medida_id: '',
  });
  const [newForm, setNewForm] = useState({
    costo_unitario_actual: '',
    nombre: '',
    stock_actual: '',
    stock_minimo: '',
    unidad_medida_id: '',
  });

  const unidadesPorId = useMemo(
    () => new Map(unidadesMedida.map((unidad) => [unidad.id, unidad.codigo] as const)),
    [unidadesMedida]
  );

  const startEdit = (ingrediente: Ingrediente) => {
    setEditingId(ingrediente.id);
    setEditValues({
      costo_unitario_actual: String(ingrediente.costo_unitario_actual),
      stock_actual: String(ingrediente.stock_actual),
      stock_minimo: String(ingrediente.stock_minimo),
      unidad_medida_id: String(ingrediente.unidad_medida_id),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (ingrediente: Ingrediente) => {
    const payload: TablesUpdate<'ingredientes'> = {
      costo_unitario_actual: Number(editValues.costo_unitario_actual),
      stock_actual: Number(editValues.stock_actual),
      stock_minimo: Number(editValues.stock_minimo),
      unidad_medida_id: Number(editValues.unidad_medida_id),
    };

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

    const { error } = await supabase.from('ingredientes').update(payload).eq('id', ingrediente.id);

    if (error) {
      toast.error(`Error al actualizar: ${error.message}`);
      setSaving(false);
      return;
    }

    await refreshData();
    setEditingId(null);
    setSaving(false);
    toast.success(`"${ingrediente.nombre}" actualizado`);
  };

  const handleCreate = async () => {
    const payload: TablesInsert<'ingredientes'> = {
      activo: true,
      costo_unitario_actual: Number(newForm.costo_unitario_actual),
      nombre: newForm.nombre.trim(),
      stock_actual: Number(newForm.stock_actual),
      stock_minimo: Number(newForm.stock_minimo),
      unidad_medida_id: Number(newForm.unidad_medida_id),
    };

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

  const handleDelete = async (ingrediente: Ingrediente) => {
    if (!confirm(`Eliminar "${ingrediente.nombre}" del inventario?`)) return;

    setDeleting(ingrediente.id);

    const { error } = await supabase.from('ingredientes').delete().eq('id', ingrediente.id);

    if (error) {
      toast.error(`Error al eliminar: ${error.message}`);
      setDeleting(null);
      return;
    }

    if (editingId === ingrediente.id) {
      setEditingId(null);
    }

    await refreshData();
    setDeleting(null);
    toast.success(`"${ingrediente.nombre}" eliminado`);
  };

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Inventario de ingredientes
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
          >
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
          <button
            onClick={() => setShowForm((current) => !current)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Nuevo ingrediente
          </button>
        </div>
      </div>

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
              <input
                placeholder="Nombre *"
                value={newForm.nombre}
                onChange={(event) =>
                  setNewForm((form) => ({ ...form, nombre: event.target.value }))
                }
                className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
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
              const low = Number(ingrediente.stock_actual) < Number(ingrediente.stock_minimo);
              const isEditing = editingId === ingrediente.id;

              return (
                <tr
                  key={ingrediente.id}
                  className={`border-b border-border/50 transition-colors ${
                    low ? 'bg-destructive/10' : 'hover:bg-secondary/50'
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-foreground">{ingrediente.nombre}</td>
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

export default AdminInventario;

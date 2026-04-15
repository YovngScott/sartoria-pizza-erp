// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos hooks de React para memorización, referencias DOM y estados locales
import { useCallback, useMemo, useRef, useState } from 'react';
// Importamos una colección de iconos de lucide-react para señalización visual de acciones técnicas
import {
  Download,
  Image,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
// Importamos componentes de framer-motion para transiciones de UI elegantes
import { AnimatePresence, motion } from 'framer-motion';
// Importamos la utilidad de notificaciones para retroalimentación operativa inmediata
import { toast } from 'sonner';
// Importamos el cliente de Supabase para operaciones CRUD y almacenamiento de archivos
import { supabase } from '@/integrations/supabase/client';
// Importamos tipos de TypeScript para asegurar la consistencia de los datos de la BD
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
// Importamos el contexto global de la aplicación para acceder al estado centralizado
import { useApp } from '@/contexts/CartContext';
// Importamos el contexto de moneda para el formateo de costos y precios
import { useCurrency } from '@/contexts/CurrencyContext';

// ========================================== //
// TIPOS Y DEFINICIONES
// ========================================== //
/**
 * Tipo Pizza: Representa un registro de la tabla 'pizzas'.
 */
type Pizza = Tables<'pizzas'>;

/**
 * Interfaz PizzaForm: Estructura de datos para los campos básicos de una pizza.
 */
interface PizzaForm {
  descripcion: string;
  imagen_url: string;
  nombre: string;
  precio_venta_publico: string; // Almacenado como string para compatibilidad con el input
}

/**
 * Interfaz RecipeFormRow: Estructura para cada ingrediente que compone la receta de una pizza.
 */
interface RecipeFormRow {
  cantidad_requerida: string;
  ingrediente_id: string;
  merma_porcentaje: string;
  row_id: string; // ID temporal para el manejo de filas en el formulario
}

/**
 * emptyForm: Estado inicial vacío para el formulario de pizza.
 */
const emptyForm: PizzaForm = {
  descripcion: '',
  imagen_url: '',
  nombre: '',
  precio_venta_publico: '',
};

// ========================================== //
// FUNCIONES AUXILIARES
// ========================================== //
/**
 * createRecipeRow: Genera un objeto para una nueva fila de ingrediente en la receta.
 */
function createRecipeRow(ingredienteId = ''): RecipeFormRow {
  return {
    cantidad_requerida: '',
    ingrediente_id: ingredienteId,
    merma_porcentaje: '0',
    row_id: Math.random().toString(36).slice(2, 10),
  };
}

// ========================================== //
// COMPONENTE PRINCIPAL (ADMINPIZZAS)
// ========================================== //
/**
 * AdminPizzas: Interfaz de administración técnica para la definición de productos (pizzas) y sus escandallos (recetas).
 */
const AdminPizzas = () => {
  // ========================================== //
  // ESTADO Y HOOKS
  // ========================================== //
  // Consumimos utilidades globales y datos centralizados
  const { format } = useCurrency();
  const { ingredientes, pizzas, recetas, refreshData } = useApp();

  // Estados de control de visibilidad y edición
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Estados de carga y feedback visual
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Estados del formulario y sus componentes asociados (receta e imagen)
  const [form, setForm] = useState<PizzaForm>(emptyForm);
  const [recipeRows, setRecipeRows] = useState<RecipeFormRow[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Referencia para el input de archivos oculto
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ========================================== //
  // CÁLCULOS MEMORIZADOS (ESCANDALLO)
  // ========================================== //
  /**
   * recipeCostPreview: Calcula en tiempo real el costo teórico de la pizza basado en los ingredientes seleccionados.
   */
  const recipeCostPreview = useMemo(() => {
    const ingredientesById = new Map(ingredientes.map((i) => [i.id, i]));
    return recipeRows.reduce((sum, row) => {
      const ingrediente = ingredientesById.get(Number(row.ingrediente_id));
      const cantidad = Number(row.cantidad_requerida);
      const merma = Number(row.merma_porcentaje);

      if (!ingrediente || Number.isNaN(cantidad) || cantidad <= 0) return sum;

      // Cálculo del costo considerando el porcentaje de merma técnica
      return sum + cantidad * (1 + (Number.isNaN(merma) ? 0 : merma) / 100) * Number(ingrediente.costo_unitario_actual);
    }, 0);
  }, [ingredientes, recipeRows]);

  // ========================================== //
  // GESTIÓN DE IMÁGENES (UPLOAD & STORAGE)
  // ========================================== //
  /**
   * uploadFile: Sube la imagen seleccionada al bucket 'pizza-images' de Supabase Storage.
   */
  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imagenes'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('La imagen no debe superar 5MB'); return; }

    setUploading(true);
    try {
      const extension = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

      const { error } = await supabase.storage.from('pizza-images').upload(fileName, file);
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('pizza-images').getPublicUrl(fileName);
      setForm((c) => ({ ...c, imagen_url: publicUrl }));
      setPreviewUrl(publicUrl);
      toast.success('Imagen subida correctamente');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  }, []);

  /**
   * handleDrop: Maneja la acción de soltar archivos (Drag & Drop) sobre el área designada.
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void uploadFile(file);
  }, [uploadFile]);

  // ========================================== //
  // MANEJO DE INTERFAZ Y FORMULARIO
  // ========================================== //
  const openCreate = () => {
    setEditingId(null); setForm(emptyForm); setRecipeRows([]); setPreviewUrl(null); setShowForm(true);
  };

  const openEdit = (pizza: Pizza) => {
    setEditingId(pizza.id);
    setForm({
      descripcion: pizza.descripcion || '',
      imagen_url: pizza.imagen_url || '',
      nombre: pizza.nombre,
      precio_venta_publico: String(pizza.precio_venta_publico),
    });
    setRecipeRows(recetas.filter((r) => r.pizza_id === pizza.id).map((r) => ({
      cantidad_requerida: String(r.cantidad_requerida),
      ingrediente_id: String(r.ingrediente_id),
      merma_porcentaje: String(r.merma_porcentaje),
      row_id: String(r.id),
    })));
    setPreviewUrl(pizza.imagen_url || null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false); setEditingId(null); setForm(emptyForm); setRecipeRows([]); setPreviewUrl(null);
  };

  // ========================================== //
  // MANEJO DE RECETAS (ITEMS DINÁMICOS)
  // ========================================== //
  const addRecipeRow = () => setRecipeRows((c) => [...c, createRecipeRow()]);
  const updateRecipeRow = (rowId: string, key: keyof Omit<RecipeFormRow, 'row_id'>, value: string) => {
    setRecipeRows((c) => c.map((r) => (r.row_id === rowId ? { ...r, [key]: value } : r)));
  };
  const removeRecipeRow = (rowId: string) => setRecipeRows((c) => c.filter((r) => r.row_id !== rowId));

  // ========================================== //
  // PERSISTENCIA (CRUD)
  // ========================================== //
  /**
   * handleSave: Realiza el guardado de la pizza y su receta en una transacción lógica.
   */
  const handleSave = async () => {
    const precioVentaPublico = Number(form.precio_venta_publico);
    if (!form.nombre.trim() || !form.descripcion.trim() || Number.isNaN(precioVentaPublico) || precioVentaPublico <= 0) {
      toast.error('Completa los campos obligatorios con valores validos'); return;
    }

    const recetasPayload = recipeRows
      .map((r) => ({ cantidad_requerida: Number(r.cantidad_requerida), ingrediente_id: Number(r.ingrediente_id), merma_porcentaje: Number(r.merma_porcentaje || 0) }))
      .filter((r) => r.ingrediente_id > 0 && !Number.isNaN(r.cantidad_requerida) && r.cantidad_requerida > 0);

    setSaving(true);
    const payload: TablesInsert<'pizzas'> & TablesUpdate<'pizzas'> = {
      descripcion: form.descripcion.trim(),
      imagen_url: form.imagen_url.trim() || null,
      nombre: form.nombre.trim(),
      precio_venta_publico: precioVentaPublico,
    };

    try {
      let pizzaId = editingId;
      if (editingId) {
        const { error } = await supabase.from('pizzas').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('pizzas').insert(payload).select('*').single();
        if (error || !data) throw error;
        pizzaId = data.id;
      }

      if (!pizzaId) throw new Error('No se pudo resolver el ID de la pizza');
      
      // Actualización de la receta: eliminamos las anteriores e insertamos las nuevas
      await supabase.from('recetas').delete().eq('pizza_id', pizzaId);
      if (recetasPayload.length > 0) {
        const { error } = await supabase.from('recetas').insert(recetasPayload.map((r) => ({ ...r, pizza_id: pizzaId })));
        if (error) throw error;
      }

      await refreshData();
      closeForm();
      toast.success(editingId ? 'Pizza actualizada' : 'Pizza creada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar la pizza');
    } finally {
      setSaving(false);
    }
  };

  /**
   * handleDelete: Elimina la pizza y limpia sus recetas asociadas.
   */
  const handleDelete = async (pizza: Pizza) => {
    if (!confirm(`Eliminar "${pizza.nombre}"? Esta accion no se puede deshacer.`)) return;
    setDeleting(pizza.id);
    try {
      const { error: rError } = await supabase.from('recetas').delete().eq('pizza_id', pizza.id);
      if (rError) throw rError;
      const { error } = await supabase.from('pizzas').delete().eq('id', pizza.id);
      if (error) throw error;
      await refreshData();
      toast.success(`"${pizza.nombre}" eliminada`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar la pizza');
    } finally {
      setDeleting(null);
    }
  };

  // ========================================== //
  // EXPORTACIÓN
  // ========================================== //
  const exportCSV = () => {
    const headers = ['Nombre', 'Descripcion', 'Precio publico', 'Costo'];
    const rows = pizzas.map((p) => [p.nombre, `"${(p.descripcion || '').replace(/"/g, '""')}"`, Number(p.precio_venta_publico).toFixed(2), Number(p.costo_teorico_actual).toFixed(2)]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `pizzas_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click(); URL.revokeObjectURL(url);
    toast.success('Pizzas exportadas a CSV');
  };

  // ========================================== //
  // RENDERIZADO
  // ========================================== //
  return (
    <div className="space-y-4">
      {/* HEADER Y ACCIONES PRINCIPALES */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-foreground">Gestion de pizzas</h2>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"><Download className="h-4 w-4" /> Exportar CSV</button>
          <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"><Plus className="h-4 w-4" /> Nueva pizza</button>
        </div>
      </div>

      {/* FORMULARIO DINÁMICO (ANIMADO) */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden rounded-xl border border-primary/30 bg-card p-5">
            <h3 className="mb-4 font-display text-base font-semibold text-foreground">{editingId ? 'Editar pizza' : 'Nueva pizza'}</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <input placeholder="Nombre *" value={form.nombre} onChange={(e) => setForm((c) => ({ ...c, nombre: e.target.value }))} className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input placeholder="Precio publico *" type="number" step="0.01" value={form.precio_venta_publico} onChange={(e) => setForm((c) => ({ ...c, precio_venta_publico: e.target.value }))} className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <textarea placeholder="Descripcion *" value={form.descripcion} onChange={(e) => setForm((c) => ({ ...c, descripcion: e.target.value }))} rows={2} className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 sm:col-span-2" />
              
              {/* SECCIÓN DE IMAGEN Y UPLOAD */}
              <div className="space-y-3 sm:col-span-2">
                <input placeholder="URL de imagen" value={form.imagen_url} onChange={(e) => { setForm((c) => ({ ...c, imagen_url: e.target.value })); setPreviewUrl(e.target.value || null); }} className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-all ${dragOver ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 hover:bg-secondary/50'}`}>
                  {uploading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <><Upload className="mb-2 h-8 w-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">Arrastra una imagen o haz clic para subir</p><p className="mt-1 text-xs text-muted-foreground/60">PNG, JPG o WebP - max. 5MB</p></>}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadFile(file); }} />
                </div>
                {previewUrl && (
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-3">
                    <img src={previewUrl} alt="Vista previa" className="h-16 w-16 rounded-lg object-cover" onError={() => setPreviewUrl(null)} />
                    <div className="min-w-0 flex-1"><p className="flex items-center gap-1 text-xs text-muted-foreground"><Image className="h-3 w-3" /> Vista previa</p><p className="truncate text-xs text-muted-foreground/60">{form.imagen_url}</p></div>
                    <button onClick={() => { setForm((c) => ({ ...c, imagen_url: '' })); setPreviewUrl(null); }} className="rounded-md bg-destructive/20 p-1 text-destructive hover:bg-destructive/30"><X className="h-3.5 w-3.5" /></button>
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN DE RECETA (ESCANDALLO TÉCNICO) */}
            <div className="mt-6 rounded-xl border border-border bg-secondary/30 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div><h4 className="font-display text-base font-semibold text-foreground">Receta</h4><p className="text-sm text-muted-foreground">Define los ingredientes que consume esta pizza.</p></div>
                <button type="button" onClick={addRecipeRow} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"><Plus className="h-4 w-4" /> Agregar ingrediente</button>
              </div>
              <div className="space-y-3">
                {recipeRows.length === 0 && <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm italic text-muted-foreground">Esta pizza aun no tiene receta cargada.</p>}
                {recipeRows.map((row) => (
                  <div key={row.row_id} className="grid gap-3 rounded-lg border border-border bg-card p-3 md:grid-cols-[2fr,1fr,44px]">
                    <select value={row.ingrediente_id} onChange={(e) => updateRecipeRow(row.row_id, 'ingrediente_id', e.target.value)} className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="">Selecciona un ingrediente</option>
                      {ingredientes.map((i) => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                    </select>
                    <input type="number" step="0.01" placeholder="Cantidad" value={row.cantidad_requerida} onChange={(e) => updateRecipeRow(row.row_id, 'cantidad_requerida', e.target.value)} className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    <button type="button" onClick={() => removeRecipeRow(row.row_id)} className="flex items-center justify-center rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-border bg-card p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Costo estimado por receta</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{format(recipeCostPreview)}</p>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN FINAL */}
            <div className="mt-4 flex gap-2">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingId ? 'Guardar cambios' : 'Crear pizza'}
              </button>
              <button onClick={closeForm} className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"><X className="h-4 w-4" /> Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TABLA DE LISTADO TÉCNICO */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 font-semibold text-muted-foreground">Imagen</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">Nombre</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">Descripcion</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Precio</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Costo</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Margen</th>
              <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pizzas.map((p) => (
              <tr key={p.id} className="border-b border-border/50 transition-colors hover:bg-secondary/50">
                <td className="px-4 py-3">{p.imagen_url ? <img src={p.imagen_url} alt={p.nombre} className="h-10 w-10 rounded-lg object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary"><Image className="h-4 w-4 text-muted-foreground" /></div>}</td>
                <td className="px-4 py-3 font-medium text-foreground">{p.nombre}</td>
                <td className="max-w-xs px-4 py-3 text-muted-foreground">{p.descripcion}</td>
                <td className="px-4 py-3 text-right font-semibold text-foreground">{format(Number(p.precio_venta_publico))}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{format(Number(p.costo_teorico_actual))}</td>
                <td className="px-4 py-3 text-right font-medium text-emerald-500">{format(Number(p.margen_teorico_actual))}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openEdit(p)} className="rounded-md bg-primary/20 p-1.5 text-primary hover:bg-primary/30"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(p)} disabled={deleting === p.id} className="rounded-md bg-destructive/20 p-1.5 text-destructive hover:bg-destructive/30 disabled:opacity-50">
                      {deleting === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ========================================== //
// EXPORTACIÓN
// ========================================== //
export default AdminPizzas;

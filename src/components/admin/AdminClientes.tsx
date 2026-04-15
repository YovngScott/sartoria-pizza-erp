// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos hooks de React para memorización de cálculos y gestión de estados locales
import { useMemo, useState } from 'react';
// Importamos componentes para animaciones fluidas y manejo de presencia de elementos
import { AnimatePresence, motion } from 'framer-motion';
// Importamos una colección de iconos de lucide-react para enriquecer la interfaz visualmente
import {
  Download,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Save,
  Trash2,
  Users,
  X,
} from 'lucide-react';
// Importamos la utilidad de notificaciones 'toast' para feedback inmediato al usuario
import { toast } from 'sonner';
// Importamos el cliente de Supabase para operaciones CRUD en la base de datos
import { supabase } from '@/integrations/supabase/client';
// Importamos tipos de TypeScript generados automáticamente para la base de datos Supabase
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
// Importamos el contexto de la aplicación para acceder a los datos globales de clientes
import { useApp } from '@/contexts/CartContext';

// ========================================== //
// TIPOS Y DEFINICIONES
// ========================================== //
/**
 * Tipo Cliente: Representa la estructura de un registro de la tabla 'clientes'.
 */
type Cliente = Tables<'clientes'>;

/**
 * Interfaz ClienteForm: Estructura de datos utilizada para los formularios de creación y edición.
 */
interface ClienteForm {
  activo: boolean;   // Estado del cliente (activo/inactivo)
  direccion: string; // Dirección física del cliente
  email: string;     // Correo electrónico de contacto
  nombre: string;    // Nombre completo o razón social
  telefono: string;  // Número de teléfono de contacto
}

/**
 * emptyForm: Estado inicial por defecto para un nuevo formulario de cliente.
 */
const emptyForm: ClienteForm = {
  activo: true,
  direccion: '',
  email: '',
  nombre: '',
  telefono: '',
};

// ========================================== //
// COMPONENTE PRINCIPAL (ADMINCLIENTES)
// ========================================== //
/**
 * AdminClientes: Componente de administración para la gestión integral del directorio de clientes.
 */
const AdminClientes = () => {
  // ========================================== //
  // ESTADO Y HOOKS
  // ========================================== //
  // Obtenemos los clientes y la función de refresco del contexto global
  const { clientes, refreshData } = useApp();
  // Estado para controlar el proceso de guardado asíncrono
  const [saving, setSaving] = useState(false);
  // Controla la visibilidad del formulario de cliente
  const [showForm, setShowForm] = useState(false);
  // Almacena el ID del cliente que se está editando (null si es creación)
  const [editingId, setEditingId] = useState<number | null>(null);
  // Almacena el ID del cliente en proceso de eliminación
  const [deletingId, setDeletingId] = useState<number | null>(null);
  // Almacena el objeto cliente que requiere confirmación para ser eliminado
  const [confirmDelete, setConfirmDelete] = useState<Cliente | null>(null);
  // Estado del formulario actual vinculado a los inputs
  const [form, setForm] = useState<ClienteForm>(emptyForm);

  // ========================================== //
  // CÁLCULOS MEMORIZADOS (KPIs)
  // ========================================== //
  // Calculamos el total de clientes con estado activo
  const totalActivos = useMemo(
    () => clientes.filter((cliente) => cliente.activo).length,
    [clientes]
  );
  // Calculamos cuántos clientes tienen un correo electrónico registrado
  const totalConEmail = useMemo(
    () => clientes.filter((cliente) => Boolean(cliente.email)).length,
    [clientes]
  );

  // ========================================== //
  // FUNCIONES DE MANEJO DE INTERFAZ
  // ========================================== //
  /**
   * resetForm: Limpia los estados del formulario y lo oculta.
   */
  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  /**
   * openCreate: Prepara la interfaz para la creación de un nuevo cliente.
   */
  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  /**
   * openEdit: Carga los datos de un cliente existente en el formulario para su edición.
   */
  const openEdit = (cliente: Cliente) => {
    setForm({
      activo: cliente.activo,
      direccion: cliente.direccion || '',
      email: cliente.email || '',
      nombre: cliente.nombre,
      telefono: cliente.telefono || '',
    });
    setEditingId(cliente.id);
    setShowForm(true);
  };

  // ========================================== //
  // EXPORTACIÓN DE DATOS
  // ========================================== //
  /**
   * exportCSV: Genera un archivo CSV con la lista completa de clientes.
   */
  const exportCSV = () => {
    // Definimos las cabeceras de las columnas
    const headers = ['Nombre', 'Email', 'Telefono', 'Direccion', 'Estado'];
    // Transformamos cada cliente en una fila de datos
    const rows = clientes.map((cliente) => [
      cliente.nombre,
      cliente.email || '',
      cliente.telefono || '',
      cliente.direccion || '',
      cliente.activo ? 'Activo' : 'Inactivo',
    ]);

    // Combinamos cabeceras y filas escapando comillas dobles
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

    // Creamos el blob y disparamos la descarga
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Clientes exportados a CSV');
  };

  // ========================================== //
  // OPERACIONES DE PERSISTENCIA (CRUD)
  // ========================================== //
  /**
   * handleSave: Realiza la inserción o actualización del cliente en Supabase.
   */
  const handleSave = async () => {
    // Validación básica: el nombre es obligatorio
    if (!form.nombre.trim()) {
      toast.error('El nombre del cliente es obligatorio');
      return;
    }

    setSaving(true);

    // Preparamos el objeto de datos para la base de datos
    const payload: TablesInsert<'clientes'> & TablesUpdate<'clientes'> = {
      activo: form.activo,
      direccion: form.direccion.trim() || null,
      email: form.email.trim().toLowerCase() || null,
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim() || null,
    };

    try {
      if (editingId != null) {
        // Operación de actualización si tenemos un ID de edición
        const { error } = await supabase.from('clientes').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success(`"${payload.nombre}" actualizado`);
      } else {
        // Operación de inserción si es un cliente nuevo
        const { error } = await supabase.from('clientes').insert(payload);
        if (error) throw error;
        toast.success(`"${payload.nombre}" creado`);
      }

      // Refrescamos los datos globales y reseteamos el formulario
      await refreshData();
      resetForm();
    } catch (error) {
      // Manejo centralizado de errores con feedback al usuario
      const message =
        error instanceof Error ? error.message : 'No se pudo guardar el cliente';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * handleDelete: Elimina definitivamente un cliente de la base de datos.
   */
  const handleDelete = async (cliente: Cliente) => {
    setDeletingId(cliente.id);

    try {
      const { error } = await supabase.from('clientes').delete().eq('id', cliente.id);
      if (error) throw error;
      toast.success(`"${cliente.nombre}" eliminado`);
      setConfirmDelete(null);
      await refreshData();
    } catch (error) {
      // Tratamiento especial para errores de integridad referencial (FK)
      const databaseError =
        error && typeof error === 'object' && 'code' in error
          ? (error as { code?: string })
          : null;

      if (databaseError?.code === '23503') {
        toast.error(
          'No se puede eliminar un cliente con pedidos asociados. Puedes marcarlo como inactivo.'
        );
      } else {
        toast.error(
          error instanceof Error ? error.message : 'No se pudo eliminar el cliente'
        );
      }
    } finally {
      setDeletingId(null);
    }
  };

  // ========================================== //
  // RENDERIZADO
  // ========================================== //
  return (
    <div className="space-y-4">
      {/* SECCIÓN: HEADER Y BOTONES DE ACCIÓN */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
            <Users className="h-5 w-5 text-primary" /> Gestion de clientes
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Administra el directorio de clientes y sus datos de contacto.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón para exportar el listado actual */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-foreground transition-all hover:bg-muted"
          >
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
          {/* Botón para abrir el formulario de nuevo cliente */}
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Nuevo cliente
          </button>
        </div>
      </div>

      {/* SECCIÓN: KPIs RÁPIDOS */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total clientes</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{clientes.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Clientes activos</p>
          <p className="mt-2 text-2xl font-semibold text-success">{totalActivos}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Con email</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{totalConEmail}</p>
        </div>
      </div>

      {/* SECCIÓN: FORMULARIO DINÁMICO (ANIMADO) */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-xl border border-primary/30 bg-card p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold text-foreground">
                  {editingId != null ? 'Editar cliente' : 'Nuevo cliente'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Guarda nombre, email, telefono y direccion principal.
                </p>
              </div>
              <button
                onClick={resetForm}
                className="rounded-md bg-secondary p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Inputs del formulario en grid responsivo */}
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                placeholder="Nombre del cliente"
                value={form.nombre}
                onChange={(event) =>
                  setForm((current) => ({ ...current, nombre: event.target.value }))
                }
                className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="text"
                placeholder="Telefono"
                value={form.telefono}
                onChange={(event) =>
                  setForm((current) => ({ ...current, telefono: event.target.value }))
                }
                className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <label className="flex items-center gap-3 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, activo: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary"
                />
                Cliente activo
              </label>
              <textarea
                placeholder="Direccion"
                value={form.direccion}
                onChange={(event) =>
                  setForm((current) => ({ ...current, direccion: event.target.value }))
                }
                rows={3}
                className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 md:col-span-2"
              />
            </div>

            {/* Botones de acción del formulario */}
            <div className="mt-4 flex items-center gap-2">
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
                {editingId != null ? 'Guardar cambios' : 'Crear cliente'}
              </button>
              <button
                onClick={resetForm}
                className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-muted"
              >
                <X className="h-4 w-4" /> Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECCIÓN: TABLA DE LISTADO */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 font-semibold text-muted-foreground">Cliente</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">Contacto</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">Direccion</th>
              <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Estado</th>
              <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {/* Renderizado condicional para estado vacío */}
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm italic text-muted-foreground">
                  No hay clientes registrados todavia.
                </td>
              </tr>
            ) : (
              clientes.map((cliente) => (
                <tr
                  key={cliente.id}
                  className="border-b border-border/50 transition-colors hover:bg-secondary/50"
                >
                  {/* Celda: Información Principal */}
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-foreground">{cliente.nombre}</p>
                      <p className="text-xs text-muted-foreground">ID #{cliente.id}</p>
                    </div>
                  </td>
                  {/* Celda: Datos de Contacto */}
                  <td className="px-4 py-4">
                    <div className="space-y-1 text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-primary" />
                        {cliente.email || 'Sin email'}
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-primary" />
                        {cliente.telefono || 'Sin telefono'}
                      </p>
                    </div>
                  </td>
                  {/* Celda: Dirección con truncado inteligente */}
                  <td className="max-w-sm px-4 py-4 text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="line-clamp-2">{cliente.direccion || 'Sin direccion'}</span>
                    </div>
                  </td>
                  {/* Celda: Badge de Estado */}
                  <td className="px-4 py-4 text-center">
                    {cliente.activo ? (
                      <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs font-medium text-success">
                        Activo
                      </span>
                    ) : (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        Inactivo
                      </span>
                    )}
                  </td>
                  {/* Celda: Botones CRUD por fila */}
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEdit(cliente)}
                        className="rounded-md bg-primary/20 p-1.5 text-primary transition-colors hover:bg-primary/30"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(cliente)}
                        disabled={deletingId === cliente.id}
                        className="rounded-md bg-destructive/20 p-1.5 text-destructive transition-colors hover:bg-destructive/30 disabled:opacity-50"
                      >
                        {deletingId === cliente.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* SECCIÓN: MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-foreground">Eliminar cliente</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Esta accion eliminara a "{confirmDelete.nombre}" del directorio.
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

// ========================================== //
// EXPORTACIÓN
// ========================================== //
export default AdminClientes;

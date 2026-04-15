// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos hooks de React para memorización de funciones, efectos y gestión de estado
import { useCallback, useEffect, useState } from 'react';
// Importamos componentes de framer-motion para animaciones de entrada/salida y presencia
import { AnimatePresence, motion } from 'framer-motion';
// Importamos iconos de lucide-react para la señalización visual de acciones administrativas
import {
  Download,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Users,
  X,
} from 'lucide-react';
// Importamos la utilidad de notificaciones 'toast' para retroalimentación operativa
import { toast } from 'sonner';
// Importamos los servicios de administración de usuarios que interactúan con Supabase/Edge Functions
import {
  createAdminUser,
  deleteAdminUser,
  listAdminUsers,
  type AdminUser,
  updateAdminUser,
} from '@/services/adminUsers';

// ========================================== //
// TIPOS Y DEFINICIONES
// ========================================== //
/**
 * Interfaz AdminFormState: Estructura de datos para el formulario de creación/invitación de usuarios.
 */
interface AdminFormState {
  email: string;   // Correo electrónico del nuevo administrador
  nombre: string;  // Nombre completo para el perfil
}

/**
 * EMPTY_FORM: Estado inicial vacío por defecto para el formulario.
 */
const EMPTY_FORM: AdminFormState = {
  email: '',
  nombre: '',
};

// ========================================== //
// COMPONENTE PRINCIPAL (ADMINUSUARIOS)
// ========================================== //
/**
 * AdminUsuarios: Interfaz de gestión de personal administrativo con permisos de acceso al ERP.
 */
const AdminUsuarios = () => {
  // ========================================== //
  // ESTADO Y HOOKS
  // ========================================== //
  // Almacena la lista de administradores registrados en el sistema
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  // Controla el estado de carga inicial de la tabla
  const [loading, setLoading] = useState(true);
  // Controla la visibilidad del formulario de creación
  const [showForm, setShowForm] = useState(false);
  // Estado local para el formulario de creación
  const [form, setForm] = useState<AdminFormState>(EMPTY_FORM);
  // Controla el estado de guardado asíncrono en curso
  const [saving, setSaving] = useState(false);
  // Almacena el ID del usuario en proceso de edición
  const [editingId, setEditingId] = useState<number | null>(null);
  // Estado local para el formulario de edición (incluye campo de contraseña opcional)
  const [editForm, setEditForm] = useState<AdminFormState & { password?: string }>( { ...EMPTY_FORM, password: '' });
  // Almacena el usuario que requiere confirmación de eliminación
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);

  // ========================================== //
  // FUNCIONES DE CARGA DE DATOS
  // ========================================== //
  /**
   * fetchAdmins: Obtiene la lista actualizada de administradores desde el servicio.
   */
  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAdminUsers();
      setAdmins(data);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Error al cargar la lista de administradores');
    } finally {
      setLoading(false);
    }
  }, []);

  // ========================================== //
  // EFECTOS
  // ========================================== //
  /**
   * useEffect: Carga los administradores al montar el componente.
   */
  useEffect(() => {
    void fetchAdmins();
  }, [fetchAdmins]);

  // ========================================== //
  // MANEJO DE FORMULARIOS
  // ========================================== //
  const closeForm = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
  };

  /**
   * handleCreate: Invita a un nuevo administrador enviando sus datos básicos.
   */
  const handleCreate = async () => {
    if (!form.nombre.trim() || !form.email.trim()) {
      toast.error('Nombre y email son obligatorios');
      return;
    }

    setSaving(true);
    try {
      await createAdminUser({
        email: form.email.trim(),
        nombre: form.nombre.trim(),
      });

      toast.success('Invitación enviada. El usuario debe registrarse con este correo.');
      closeForm();
      await fetchAdmins();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear administrador';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * startEdit: Prepara la interfaz de edición para un administrador específico.
   */
  const startEdit = (admin: AdminUser) => {
    setEditingId(admin.id);
    setEditForm({ email: admin.email, nombre: admin.nombre, password: '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ ...EMPTY_FORM, password: '' });
  };

  /**
   * handleEdit: Actualiza los datos de un administrador, permitiendo cambio de password opcional.
   */
  const handleEdit = async (admin: AdminUser) => {
    if (!editForm.nombre.trim() || !editForm.email.trim()) {
      toast.error('Nombre y email son obligatorios');
      return;
    }

    setSaving(true);
    try {
      await updateAdminUser({
        activo: admin.activo,
        email: editForm.email.trim(),
        nombre: editForm.nombre.trim(),
        password: editForm.password.trim() || undefined,
        usuario_id: admin.usuario_id,
      });

      toast.success('Administrador actualizado');
      cancelEdit();
      await fetchAdmins();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar administrador';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * handleDelete: Remueve definitivamente a un administrador y su acceso al sistema.
   */
  const handleDelete = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      await deleteAdminUser(confirmDelete.usuario_id);
      toast.success('Administrador eliminado');
      setConfirmDelete(null);
      await fetchAdmins();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar administrador';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // ========================================== //
  // EXPORTACIÓN
  // ========================================== //
  const exportCSV = () => {
    const headers = ['Nombre', 'Email', 'Rol', 'Activo', 'Fecha de Creacion'];
    const rows = admins.map((admin) => [
      admin.nombre || '-',
      admin.email,
      admin.rol_codigo,
      admin.activo ? 'Si' : 'No',
      new Date(admin.created_at).toLocaleDateString('es-DO'),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'usuarios_sartoria.csv';
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Usuarios exportados a CSV');
  };

  // ========================================== //
  // RENDERIZADO
  // ========================================== //
  return (
    <div className="space-y-4">
      {/* HEADER Y ACCIÓN DE CREACIÓN */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
          <Users className="h-5 w-5 text-[#D4AF37]" /> Gestion de Administradores
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-muted"><Download className="h-4 w-4" /> Exportar</button>
          <button onClick={() => setShowForm((current) => !current)} className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black transition-all hover:opacity-90"><Plus className="h-4 w-4" /> Nuevo Admin</button>
        </div>
      </div>

      {/* FORMULARIO DE INVITACIÓN (ANIMADO) */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="rounded-xl border border-[#D4AF37]/30 bg-card p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <input placeholder="Nombre" value={form.nombre} onChange={(e) => setForm((c) => ({ ...c, nombre: e.target.value }))} className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]" />
              <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]" />
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={handleCreate} disabled={saving} className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-black hover:bg-[#B8962E] disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Crear
              </button>
              <button onClick={closeForm} className="px-4 py-2 text-sm text-white hover:underline">Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TABLA DE ADMINISTRADORES */}
      <div className="overflow-hidden overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary/50 text-[10px] font-bold uppercase text-muted-foreground">
            <tr>
              <th className="px-6 py-4">Nombre</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Rol</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={5} className="py-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#D4AF37]" /></td></tr>
            ) : (
              admins.map((admin) => {
                const isEditing = editingId === admin.id;
                return (
                  <tr key={admin.id} className="transition-colors hover:bg-secondary/30">
                    <td className="px-6 py-4 font-medium text-white">{isEditing ? <input value={editForm.nombre} onChange={(e) => setEditForm((c) => ({ ...c, nombre: e.target.value }))} className="w-full rounded border border-[#D4AF37] bg-background px-2 py-1 text-white" /> : (admin.nombre || '-')}</td>
                    <td className="px-6 py-4 text-muted-foreground">{isEditing ? <input value={editForm.email} onChange={(e) => setEditForm((c) => ({ ...c, email: e.target.value }))} className="w-full rounded border border-[#D4AF37] bg-background px-2 py-1 text-white" /> : admin.email}</td>
                    <td className="px-6 py-4 text-muted-foreground">{admin.rol_codigo}</td>
                    <td className="px-6 py-4"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${admin.activo ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>{admin.activo ? 'Activo' : 'Inactivo'}</span></td>
                    <td className="px-6 py-4 text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <input type="password" placeholder="Nueva contrasena" value={editForm.password} onChange={(e) => setEditForm((c) => ({ ...c, password: e.target.value }))} className="w-40 rounded border border-border bg-background px-2 py-1 text-white" />
                          <button onClick={() => handleEdit(admin)} className="text-green-500 transition-transform hover:scale-110"><Save size={18} /></button>
                          <button onClick={cancelEdit} className="text-red-500"><X size={18} /></button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-3">
                          <button onClick={() => startEdit(admin)} className="text-muted-foreground transition-colors hover:text-[#D4AF37]"><Pencil size={16} /></button>
                          <button onClick={() => setConfirmDelete(admin)} className="text-muted-foreground transition-colors hover:text-red-500"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
            {admins.length === 0 && !loading && (
              <tr><td colSpan={5} className="py-10 text-center italic text-muted-foreground">No hay administradores registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-2xl">
              <h3 className="mb-2 text-lg font-bold text-white">Eliminar administrador?</h3>
              <p className="mb-6 text-sm text-muted-foreground">Esta accion quitara el acceso de {confirmDelete.nombre || confirmDelete.email}.</p>
              <div className="flex gap-3">
                <button onClick={handleDelete} disabled={saving} className="flex-1 rounded-lg bg-red-600 py-2 font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50">{saving ? 'Eliminando...' : 'Eliminar'}</button>
                <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-lg bg-secondary py-2 text-white transition-colors hover:bg-muted">Cancelar</button>
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
export default AdminUsuarios;

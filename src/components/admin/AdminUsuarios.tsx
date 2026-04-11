import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
import { toast } from 'sonner';
import {
  createAdminUser,
  deleteAdminUser,
  listAdminUsers,
  type AdminUser,
  updateAdminUser,
} from '@/services/adminUsers';

// =====================================
// SECCION: USUARIOS
// =====================================

interface AdminFormState {
  email: string;
  nombre: string;
}

const EMPTY_FORM: AdminFormState = {
  email: '',
  nombre: '',
};

const AdminUsuarios = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AdminFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<AdminFormState & { password?: string }>( { ...EMPTY_FORM, password: '' });
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);

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

  useEffect(() => {
    void fetchAdmins();
  }, [fetchAdmins]);

  const closeForm = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
  };

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

  const startEdit = (admin: AdminUser) => {
    setEditingId(admin.id);
    setEditForm({
      email: admin.email,
      nombre: admin.nombre,
      password: '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ ...EMPTY_FORM, password: '' });
  };

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
          <Users className="h-5 w-5 text-[#D4AF37]" /> Gestion de Administradores
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-muted"
          >
            <Download className="h-4 w-4" /> Exportar
          </button>
          <button
            onClick={() => setShowForm((current) => !current)}
            className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black transition-all hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Nuevo Admin
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-[#D4AF37]/30 bg-card p-5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                placeholder="Nombre"
                value={form.nombre}
                onChange={(event) =>
                  setForm((current) => ({ ...current, nombre: event.target.value }))
                }
                className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
              <input
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-[#B8962E] disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Crear
              </button>
              <button
                onClick={closeForm}
                className="px-4 py-2 text-sm text-white transition-all hover:underline"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <tr>
                <td colSpan={5} className="py-10 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#D4AF37]" />
                </td>
              </tr>
            ) : (
              admins.map((admin) => {
                const isEditing = editingId === admin.id;

                return (
                  <tr key={admin.id} className="transition-colors hover:bg-secondary/30">
                    <td className="px-6 py-4 font-medium text-white">
                      {isEditing ? (
                        <input
                          value={editForm.nombre}
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              nombre: event.target.value,
                            }))
                          }
                          className="w-full rounded border border-[#D4AF37] bg-background px-2 py-1 text-white"
                        />
                      ) : (
                        admin.nombre || '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {isEditing ? (
                        <input
                          value={editForm.email}
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              email: event.target.value,
                            }))
                          }
                          className="w-full rounded border border-[#D4AF37] bg-background px-2 py-1 text-white"
                        />
                      ) : (
                        admin.email
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {admin.rol_codigo}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          admin.activo
                            ? 'bg-success/20 text-success'
                            : 'bg-destructive/20 text-destructive'
                        }`}
                      >
                        {admin.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <input
                            type="password"
                            placeholder="Nueva contrasena"
                            value={editForm.password}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                password: event.target.value,
                              }))
                            }
                            className="w-40 rounded border border-border bg-background px-2 py-1 text-white"
                          />
                          <button
                            onClick={() => handleEdit(admin)}
                            className="text-green-500 transition-transform hover:scale-110"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-red-500"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => startEdit(admin)}
                            className="text-muted-foreground transition-colors hover:text-[#D4AF37]"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(admin)}
                            className="text-muted-foreground transition-colors hover:text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
            {admins.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="py-10 text-center italic text-muted-foreground">
                  No hay administradores registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-2xl"
            >
              <h3 className="mb-2 text-lg font-bold text-white">Eliminar administrador?</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                Esta accion quitara el acceso de {confirmDelete.nombre || confirmDelete.email}.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex-1 rounded-lg bg-red-600 py-2 font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? 'Eliminando...' : 'Eliminar'}
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 rounded-lg bg-secondary py-2 text-white transition-colors hover:bg-muted"
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

export default AdminUsuarios;

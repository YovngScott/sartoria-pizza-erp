// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos hook de React para el manejo del estado local de edición
import { useState } from 'react';
// Importamos iconos de lucide-react para representar acciones de descarga y edición
import { Download, Pencil, Save, X } from 'lucide-react';
// Importamos la utilidad de notificaciones para feedback operativo
import { toast } from 'sonner';
// Importamos el cliente de Supabase para actualizaciones de registros en la BD
import { supabase } from '@/integrations/supabase/client';
// Importamos tipos de TypeScript para la tabla 'pizzas'
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';
// Importamos el contexto de la aplicación para acceder a los datos de pizzas y refresco
import { useApp } from '@/contexts/CartContext';
// Importamos el contexto de moneda para el formateo de valores financieros
import { useCurrency } from '@/contexts/CurrencyContext';

// ========================================== //
// TIPOS Y DEFINICIONES
// ========================================== //
/**
 * Tipo Pizza: Representa un registro individual de la tabla de pizzas.
 */
type Pizza = Tables<'pizzas'>;

// ========================================== //
// COMPONENTE PRINCIPAL (ADMINPRESUPUESTO)
// ========================================== //
/**
 * AdminPresupuesto: Panel especializado en el control de márgenes de beneficio y ajuste de precios de venta.
 */
const AdminPresupuesto = () => {
  // ========================================== //
  // ESTADO Y HOOKS
  // ========================================== //
  // Consumimos utilidades de moneda y datos del ERP
  const { format } = useCurrency();
  const { pizzas, refreshData } = useApp();

  // Estados para el manejo de la edición de precios en línea
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [saving, setSaving] = useState(false);

  // ========================================== //
  // FUNCIONES DE MANEJO DE EDICIÓN
  // ========================================== //
  /**
   * startEdit: Inicia el modo de edición de precio para una pizza específica.
   */
  const startEdit = (pizza: Pizza) => {
    setEditingId(pizza.id);
    setEditPrice(String(pizza.precio_venta_publico));
  };

  /**
   * cancelEdit: Aborta la edición y limpia los estados temporales.
   */
  const cancelEdit = () => {
    setEditingId(null);
    setEditPrice('');
  };

  /**
   * saveChanges: Persiste el nuevo precio de venta al público en la base de datos.
   */
  const saveChanges = async (pizza: Pizza) => {
    const precioVentaPublico = Number(editPrice);

    // Validación: el precio debe ser un número positivo válido
    if (Number.isNaN(precioVentaPublico) || precioVentaPublico <= 0) {
      toast.error('Ingresa un precio valido');
      return;
    }

    setSaving(true);

    const payload: TablesUpdate<'pizzas'> = {
      precio_venta_publico: precioVentaPublico,
    };

    // Actualizamos el registro en Supabase
    const { error } = await supabase.from('pizzas').update(payload).eq('id', pizza.id);

    if (error) {
      toast.error(`Error al actualizar: ${error.message}`);
      setSaving(false);
      return;
    }

    // Refrescamos los datos globales para recalcular márgenes automáticos
    await refreshData();
    cancelEdit();
    setSaving(false);
    toast.success(`Precio de "${pizza.nombre}" actualizado`);
  };

  // ========================================== //
  // EXPORTACIÓN DE DATOS
  // ========================================== //
  /**
   * exportCSV: Genera un reporte tabular de costos, precios y márgenes de utilidad.
   */
  const exportCSV = () => {
    const headers = ['Pizza', 'Costo', 'Precio Venta Publico', 'Margen', 'Margen %'];
    const rows = pizzas.map((pizza) => [
      pizza.nombre,
      Number(pizza.costo_teorico_actual).toFixed(2),
      Number(pizza.precio_venta_publico).toFixed(2),
      Number(pizza.margen_teorico_actual).toFixed(2),
      `${Number(pizza.porcentaje_margen_teorico).toFixed(2)}%`,
    ]);

    // Conversión a formato CSV plano
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `presupuesto_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Presupuesto exportado a CSV');
  };

  // ========================================== //
  // RENDERIZADO
  // ========================================== //
  return (
    <div className="space-y-4">
      {/* HEADER DE SECCIÓN */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Presupuesto y margenes
        </h2>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
        >
          <Download className="h-4 w-4" /> Exportar CSV
        </button>
      </div>

      {/* TABLA DE ANÁLISIS FINANCIERO */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 font-semibold text-muted-foreground">Pizza</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Costo</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Precio publico</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Margen</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">%</th>
              <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Accion</th>
            </tr>
          </thead>
          <tbody>
            {pizzas.map((pizza) => {
              const isEditing = editingId === pizza.id;

              return (
                <tr
                  key={pizza.id}
                  className="border-b border-border/50 transition-colors hover:bg-secondary/50"
                >
                  {/* Celda: Nombre del producto */}
                  <td className="px-4 py-3 font-medium text-foreground">{pizza.nombre}</td>
                  
                  {/* Celda: Costo de producción (Teórico) */}
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {format(Number(pizza.costo_teorico_actual))}
                  </td>

                  {/* Celda: Precio de venta (Editable) */}
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editPrice}
                        onChange={(event) => setEditPrice(event.target.value)}
                        className="w-28 rounded-md border border-primary bg-secondary px-2 py-1 text-right text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    ) : (
                      <span className="text-foreground">
                        {format(Number(pizza.precio_venta_publico))}
                      </span>
                    )}
                  </td>

                  {/* Celda: Margen nominal (Color condicional) */}
                  <td className={`px-4 py-3 text-right font-semibold ${Number(pizza.margen_teorico_actual) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {format(Number(pizza.margen_teorico_actual))}
                  </td>

                  {/* Celda: Margen porcentual (Color condicional) */}
                  <td className={`px-4 py-3 text-right font-semibold ${Number(pizza.porcentaje_margen_teorico) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {Number(pizza.porcentaje_margen_teorico).toFixed(2)}%
                  </td>

                  {/* Celda: Acciones de edición */}
                  <td className="px-4 py-3 text-center">
                    {isEditing ? (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => saveChanges(pizza)}
                          disabled={saving}
                          className="rounded-md bg-success/20 p-1.5 text-success transition-colors hover:bg-success/30 disabled:opacity-50"
                        >
                          <Save className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="rounded-md bg-destructive/20 p-1.5 text-destructive transition-colors hover:bg-destructive/30"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(pizza)}
                        className="rounded-md bg-primary/20 p-1.5 text-primary transition-colors hover:bg-primary/30"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
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
export default AdminPresupuesto;

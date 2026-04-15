// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos hooks de React para efectos, memorización de funciones y gestión de estado
import { useCallback, useEffect, useState } from 'react';
// Importamos funciones de formateo de fechas y localización en español
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
// Importamos motion y AnimatePresence para animaciones fluidas y transiciones de salida
import { motion, AnimatePresence } from 'framer-motion';
// Importamos una amplia gama de iconos de lucide-react para categorizar visualmente los logs
import { 
  Clock, 
  History, 
  Search, 
  FileText,
  ChevronRight,
  Database,
  Trash2,
  PlusCircle,
  RefreshCcw,
  Package,
  ShoppingCart,
  Tag,
  Users,
  Download
} from 'lucide-react';
// Importamos el cliente de Supabase para consultar los registros de auditoría
import { supabase } from '@/integrations/supabase/client';
// Importamos tipos definidos para la estructura de los logs de auditoría
import type { AuditoriaLog } from '@/lib/erp';
// Importamos la utilidad de notificaciones 'toast' para feedback al usuario
import { toast } from 'sonner';

// ========================================== //
// TIPOS Y DEFINICIONES
// ========================================== //
// Definición de tipos de acción permitidos para el filtrado
type ActionType = 'Todos' | 'Crear' | 'Actualizar' | 'Eliminar';
// Definición de los módulos del sistema disponibles para auditoría
type ModuleType = 'Todos' | 'Pedido' | 'Precio' | 'Inventario' | 'Usuario';

// ========================================== //
// COMPONENTE PRINCIPAL (ADMINAUDITORIA)
// ========================================== //
/**
 * AdminAuditoria: Interfaz de administración para visualizar y filtrar los logs de auditoría del sistema ERP.
 */
const AdminAuditoria = () => {
  // ========================================== //
  // ESTADO Y HOOKS
  // ========================================== //
  // Almacena la lista de registros de auditoría obtenidos
  const [logs, setLogs] = useState<AuditoriaLog[]>([]);
  // Controla el estado de carga de la interfaz
  const [loading, setLoading] = useState(true);
  // Almacena el filtro de acción seleccionado por el usuario
  const [filterAction, setFilterAction] = useState<ActionType>('Todos');
  // Almacena el filtro de módulo seleccionado por el usuario
  const [filterModule, setFilterModule] = useState<ModuleType>('Todos');
  // Almacena el término de búsqueda para filtrado por texto
  const [searchTerm, setSearchTerm] = useState('');

  // ========================================== //
  // FUNCIONES DE CARGA DE DATOS
  // ========================================== //
  /**
   * fetchLogs: Obtiene los últimos 200 registros de auditoría de la base de datos Supabase.
   */
  const fetchLogs = useCallback(async () => {
    // Activamos el estado de carga
    setLoading(true);
    try {
      // Realizamos la consulta a la tabla 'auditoria_logs' ordenada por fecha descendente
      const { data, error } = await supabase
        .from('auditoria_logs')
        .select('*')
        .order('fecha', { ascending: false })
        .limit(200);

      // Si hay error en la consulta, lanzamos una excepción
      if (error) throw error;
      // Actualizamos el estado con los datos obtenidos o un array vacío
      setLogs(data || []);
    } catch (error) {
      // Logueamos el error para depuración
      console.error('Error fetching logs:', error);
    } finally {
      // Desactivamos el estado de carga independientemente del resultado
      setLoading(false);
    }
  }, []);

  // ========================================== //
  // EFECTOS
  // ========================================== //
  /**
   * useEffect: Dispara la carga inicial de los logs al montar el componente.
   */
  useEffect(() => {
    // Invocamos la función de obtención de logs
    void fetchLogs();
  }, [fetchLogs]);

  // ========================================== //
  // LÓGICA DE VISUALIZACIÓN
  // ========================================== //
  /**
   * getLogVisuals: Determina la configuración visual (icono, color, mensaje) para cada tipo de log.
   */
  const getLogVisuals = (log: AuditoriaLog) => {
    // Parseamos los datos anteriores y posteriores para extraer información detallada
    const antes = log.datos_antes as any;
    const despues = log.datos_despues as any;
    
    // Configuración base por defecto
    let config = {
      icon: <FileText className="h-6 w-6" />,
      bgColor: 'bg-zinc-800',
      iconColor: 'text-zinc-400',
      badge: 'Acción',
      mensaje: `${log.accion} en ${log.tabla_afectada}`,
      modulo: 'Sistema' as ModuleType
    };

    // Mapeo de acciones SQL a etiquetas amigables
    const actionMap: Record<string, string> = {
      'INSERT': 'Crear',
      'UPDATE': 'Actualizar',
      'DELETE': 'Eliminar'
    };

    // Obtenemos la etiqueta de la acción o usamos el valor original
    const actionLabel = actionMap[log.accion] || log.accion;

    // LÓGICA ESPECÍFICA POR TABLA: INVENTARIO
    if (log.tabla_afectada === 'ingredientes' || log.tabla_afectada === 'inventario_movimientos') {
      config.modulo = 'Inventario';
      config.badge = actionLabel as any;
      if (log.accion === 'INSERT') {
        config.icon = <PlusCircle className="h-6 w-6" />;
        config.bgColor = 'bg-emerald-500/10'; config.iconColor = 'text-emerald-500';
        config.mensaje = `Nuevo ingrediente: "${despues?.nombre || 'S/N'}"`;
      } else if (log.accion === 'UPDATE') {
        config.icon = <RefreshCcw className="h-6 w-6" />;
        config.bgColor = 'bg-amber-500/10'; config.iconColor = 'text-amber-500';
        const cambios = [];
        // Detectamos cambios específicos en stock y costos para reportarlos en el mensaje
        if (antes?.stock_actual !== despues?.stock_actual) cambios.push(`stock: ${antes?.stock_actual || 0} → ${despues?.stock_actual || 0}`);
        if (antes?.costo_unitario_actual !== despues?.costo_unitario_actual) cambios.push(`costo: RD$${antes?.costo_unitario_actual || 0} → RD$${despues?.costo_unitario_actual || 0}`);
        config.mensaje = `Inventario "${despues?.nombre || antes?.nombre}" — ${cambios.join(', ') || 'Actualizado'}`;
      } else if (log.accion === 'DELETE') {
        config.icon = <Trash2 className="h-6 w-6" />;
        config.bgColor = 'bg-rose-500/10'; config.iconColor = 'text-rose-500';
        config.mensaje = `Eliminado: "${antes?.nombre || 'S/N'}"`;
      }
    } 
    // LÓGICA ESPECÍFICA POR TABLA: PRECIOS/PIZZAS
    else if (log.tabla_afectada === 'pizzas') {
      config.modulo = 'Precio';
      config.badge = actionLabel as any;
      config.icon = <Tag className="h-6 w-6" />;
      if (log.accion === 'INSERT') {
        config.bgColor = 'bg-emerald-500/10'; config.iconColor = 'text-emerald-500';
        config.mensaje = `Nueva pizza: "${despues?.nombre}" — RD$${despues?.precio_venta_publico}`;
      } else if (log.accion === 'UPDATE') {
        config.bgColor = 'bg-amber-500/10'; config.iconColor = 'text-amber-500';
        config.mensaje = `Precio de "${despues?.nombre}": RD$${antes?.precio_venta_publico} → RD$${despues?.precio_venta_publico}`;
      } else if (log.accion === 'DELETE') {
        config.bgColor = 'bg-rose-500/10'; config.iconColor = 'text-rose-500';
        config.mensaje = `Eliminada pizza: "${antes?.nombre}"`;
      }
    } 
    // LÓGICA ESPECÍFICA POR TABLA: PEDIDOS
    else if (log.tabla_afectada === 'pedidos') {
      config.modulo = 'Pedido';
      config.badge = actionLabel as any;
      config.icon = <ShoppingCart className="h-6 w-6" />;
      if (log.accion === 'INSERT') {
        config.bgColor = 'bg-emerald-500/10'; config.iconColor = 'text-emerald-500';
        config.mensaje = `Nuevo pedido #${log.entidad_id} de ${despues?.cliente_nombre_snapshot}`;
      } else if (log.accion === 'UPDATE') {
        config.bgColor = 'bg-amber-500/10'; config.iconColor = 'text-amber-500';
        config.mensaje = `Pedido #${log.entidad_id} cambió a ${despues?.estado}`;
      }
    } 
    // LÓGICA ESPECÍFICA POR TABLA: USUARIOS Y AUTENTICACIÓN
    else if (['perfiles', 'admin_autorizados', 'usuario_roles', 'auth'].includes(log.tabla_afectada)) {
      config.modulo = 'Usuario';
      config.badge = (log.accion === 'LOGIN' || log.accion === 'LOGOUT') ? log.accion : actionLabel as any;
      config.icon = <Users className="h-6 w-6" />;
      config.bgColor = log.accion === 'LOGIN' ? 'bg-blue-500/10' : 'bg-purple-500/10';
      config.iconColor = log.accion === 'LOGIN' ? 'text-blue-400' : 'text-purple-400';
      config.mensaje = `${log.accion === 'LOGIN' ? 'Sesión iniciada' : 'Ajuste de usuario'}: ${despues?.nombre || despues?.email || 'Personal'}`;
    }

    return config;
  };

  // ========================================== //
  // LÓGICA DE FILTRADO
  // ========================================== //
  /**
   * Filtrado de los logs en base a acción, módulo y término de búsqueda.
   */
  const filteredLogs = logs.filter(log => {
    const visuals = getLogVisuals(log);
    const matchesAction = filterAction === 'Todos' || visuals.badge === filterAction;
    const matchesModule = filterModule === 'Todos' || visuals.modulo === filterModule;
    const matchesSearch = visuals.mensaje.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesModule && matchesSearch;
  });

  // ========================================== //
  // EXPORTACIÓN A CSV
  // ========================================== //
  /**
   * exportExcel: Genera y descarga un archivo CSV con los logs actualmente filtrados.
   */
  const exportExcel = () => {
    // Si no hay logs para exportar, notificamos al usuario
    if (filteredLogs.length === 0) {
      toast.error('No hay registros para exportar');
      return;
    }

    // Definición de cabeceras para el CSV
    const headers = ["Fecha", "Modulo", "Accion", "Descripcion", "Usuario ID"];
    // Mapeo de los logs filtrados a filas de texto para el CSV
    const rows = filteredLogs.map(log => {
      const visuals = getLogVisuals(log);
      return [
        format(new Date(log.fecha), "yyyy-MM-dd HH:mm:ss"),
        visuals.modulo,
        visuals.badge,
        `"${visuals.mensaje.replace(/"/g, '""')}"`,
        log.usuario_id || 'Sistema'
      ];
    });

    // Combinación de cabeceras y filas con salto de línea
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    // Creación del Blob con codificación UTF-8 para soporte de caracteres especiales
    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_sartoria_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    // Liberamos la URL del objeto para evitar fugas de memoria
    URL.revokeObjectURL(url);
    toast.success('Auditoría exportada correctamente');
  };

  // ========================================== //
  // RENDERIZADO PRINCIPAL
  // ========================================== //
  return (
    <div className="flex flex-col h-[800px] w-full bg-[#0a0a0a] rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
      {/* SECCIÓN: HEADER Y CONTROLES */}
      <div className="p-6 border-b border-white/5 bg-zinc-900/30 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
          {/* Título y descripción del panel */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#D4AF37]/10 rounded-xl">
              <History className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Auditoría de Actividad</h2>
              <p className="text-xs text-zinc-500 font-medium">Panel de control y monitoreo de logs</p>
            </div>
          </div>
          
          {/* Barra de búsqueda y botón de exportación */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative group flex-1 lg:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Buscar por mensaje..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 w-full lg:w-64 transition-all"
              />
            </div>
            <button 
              onClick={exportExcel}
              className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 hover:bg-emerald-500/20 transition-all flex items-center gap-2"
              title="Exportar a Excel"
            >
              <Download className="h-4 w-4" />
              <span className="text-xs font-bold hidden sm:inline">Exportar</span>
            </button>
          </div>
        </div>

        {/* SELECTORES DE FILTRO (ACCIÓN Y MÓDULO) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtro por tipo de acción SQL */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Acción</span>
            <div className="flex items-center gap-1.5 bg-black/20 p-1.5 rounded-xl border border-white/5">
              {(['Todos', 'Crear', 'Actualizar', 'Eliminar'] as ActionType[]).map((act) => (
                <button
                  key={act}
                  onClick={() => setFilterAction(act)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    filterAction === act ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  {act}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por módulo funcional */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Módulo</span>
            <div className="flex items-center gap-1.5 bg-black/20 p-1.5 rounded-xl border border-white/5">
              {(['Todos', 'Pedido', 'Precio', 'Inventario', 'Usuario'] as ModuleType[]).map((mod) => (
                <button
                  key={mod}
                  onClick={() => setFilterModule(mod)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    filterModule === mod ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  {mod}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN: LISTADO DE LOGS */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
        {loading ? (
          {/* Estado de carga visual */}
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="h-10 w-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Cargando registros...</p>
          </div>
        ) : filteredLogs.length > 0 ? (
          {/* Lista de logs con animaciones de entrada/salida */}
          <AnimatePresence mode="popLayout">
            {filteredLogs.map((log, idx) => {
              const visuals = getLogVisuals(log);
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="flex items-center gap-5 p-4 bg-zinc-900/10 border border-white/5 rounded-2xl hover:bg-zinc-900/30 hover:border-white/10 transition-all group"
                >
                  {/* Icono de la acción/módulo con fondo de color suave */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${visuals.bgColor} flex items-center justify-center transition-all group-hover:scale-105`}>
                    <div className={visuals.iconColor}>
                      {visuals.icon}
                    </div>
                  </div>

                  {/* Contenido textual del log */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Badge de la acción (Crear, Actualizar, Eliminar, Login, etc.) */}
                      <span className={`px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-widest ${
                        visuals.badge === 'Crear' || visuals.badge === 'LOGIN' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        visuals.badge === 'Eliminar' || visuals.badge === 'LOGOUT' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                        'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {visuals.badge}
                      </span>
                      {/* Badge del módulo afectado */}
                      <span className="px-2 py-0.5 rounded-md border border-zinc-700/30 bg-zinc-800/30 text-zinc-500 text-[8px] font-black uppercase tracking-widest">
                        {visuals.modulo}
                      </span>
                    </div>

                    {/* Fecha y hora del registro */}
                    <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold mb-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(log.fecha), "d/M/yyyy, h:mm:ss a", { locale: es })}
                    </div>

                    {/* Mensaje descriptivo del evento */}
                    <p className="text-sm font-bold text-zinc-200 leading-tight truncate group-hover:text-white transition-colors">
                      {visuals.mensaje}
                    </p>
                  </div>

                  {/* ID del usuario responsable (o SISTEMA) */}
                  <div className="hidden sm:block">
                     <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-lg border border-white/5">
                        <Database className="h-3 w-3 text-zinc-700" />
                        <span className="text-[9px] font-mono text-zinc-500 tracking-tighter">
                          {log.usuario_id?.slice(0, 8) || 'SISTEMA'}
                        </span>
                     </div>
                  </div>
                  
                  {/* Indicador visual de interactividad */}
                  <ChevronRight className="h-4 w-4 text-zinc-800 group-hover:text-[#D4AF37] transition-colors" />
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          {/* Estado vacío cuando no hay resultados de filtrado */}
          <div className="flex flex-col items-center justify-center h-full opacity-20 text-center grayscale">
            <Package className="h-12 w-12 mb-3 text-zinc-500" />
            <p className="text-sm font-black uppercase tracking-widest text-zinc-400">Sin datos registrados</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ========================================== //
// EXPORTACIÓN
// ========================================== //
export default AdminAuditoria;

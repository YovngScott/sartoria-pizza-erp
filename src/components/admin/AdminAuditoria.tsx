import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
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
import { supabase } from '@/integrations/supabase/client';
import type { AuditoriaLog } from '@/lib/erp';
import { toast } from 'sonner';

type ActionType = 'Todos' | 'Crear' | 'Actualizar' | 'Eliminar';
type ModuleType = 'Todos' | 'Pedido' | 'Precio' | 'Inventario' | 'Usuario';

const AdminAuditoria = () => {
  const [logs, setLogs] = useState<AuditoriaLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<ActionType>('Todos');
  const [filterModule, setFilterModule] = useState<ModuleType>('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('auditoria_logs')
        .select('*')
        .order('fecha', { ascending: false })
        .limit(200);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const getLogVisuals = (log: AuditoriaLog) => {
    const antes = log.datos_antes as any;
    const despues = log.datos_despues as any;
    
    let config = {
      icon: <FileText className="h-6 w-6" />,
      bgColor: 'bg-zinc-800',
      iconColor: 'text-zinc-400',
      badge: 'Acción',
      mensaje: `${log.accion} en ${log.tabla_afectada}`,
      modulo: 'Sistema' as ModuleType
    };

    const actionMap: Record<string, string> = {
      'INSERT': 'Crear',
      'UPDATE': 'Actualizar',
      'DELETE': 'Eliminar'
    };

    const actionLabel = actionMap[log.accion] || log.accion;

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
        if (antes?.stock_actual !== despues?.stock_actual) cambios.push(`stock: ${antes?.stock_actual || 0} → ${despues?.stock_actual || 0}`);
        if (antes?.costo_unitario_actual !== despues?.costo_unitario_actual) cambios.push(`costo: RD$${antes?.costo_unitario_actual || 0} → RD$${despues?.costo_unitario_actual || 0}`);
        config.mensaje = `Inventario "${despues?.nombre || antes?.nombre}" — ${cambios.join(', ') || 'Actualizado'}`;
      } else if (log.accion === 'DELETE') {
        config.icon = <Trash2 className="h-6 w-6" />;
        config.bgColor = 'bg-rose-500/10'; config.iconColor = 'text-rose-500';
        config.mensaje = `Eliminado: "${antes?.nombre || 'S/N'}"`;
      }
    } else if (log.tabla_afectada === 'pizzas') {
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
    } else if (log.tabla_afectada === 'pedidos') {
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
    } else if (['perfiles', 'admin_autorizados', 'usuario_roles', 'auth'].includes(log.tabla_afectada)) {
      config.modulo = 'Usuario';
      config.badge = (log.accion === 'LOGIN' || log.accion === 'LOGOUT') ? log.accion : actionLabel as any;
      config.icon = <Users className="h-6 w-6" />;
      config.bgColor = log.accion === 'LOGIN' ? 'bg-blue-500/10' : 'bg-purple-500/10';
      config.iconColor = log.accion === 'LOGIN' ? 'text-blue-400' : 'text-purple-400';
      config.mensaje = `${log.accion === 'LOGIN' ? 'Sesión iniciada' : 'Ajuste de usuario'}: ${despues?.nombre || despues?.email || 'Personal'}`;
    }

    return config;
  };

  const filteredLogs = logs.filter(log => {
    const visuals = getLogVisuals(log);
    const matchesAction = filterAction === 'Todos' || visuals.badge === filterAction;
    const matchesModule = filterModule === 'Todos' || visuals.modulo === filterModule;
    const matchesSearch = visuals.mensaje.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesModule && matchesSearch;
  });

  const exportExcel = () => {
    if (filteredLogs.length === 0) {
      toast.error('No hay registros para exportar');
      return;
    }

    const headers = ["Fecha", "Modulo", "Accion", "Descripcion", "Usuario ID"];
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

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_sartoria_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Auditoría exportada correctamente');
  };

  return (
    <div className="flex flex-col h-[800px] w-full bg-[#0a0a0a] rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
      {/* HEADER & CONTROLS */}
      <div className="p-6 border-b border-white/5 bg-zinc-900/30 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#D4AF37]/10 rounded-xl">
              <History className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Auditoría de Actividad</h2>
              <p className="text-xs text-zinc-500 font-medium">Panel de control y monitoreo de logs</p>
            </div>
          </div>
          
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* LOG LIST */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="h-10 w-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Cargando registros...</p>
          </div>
        ) : filteredLogs.length > 0 ? (
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
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${visuals.bgColor} flex items-center justify-center transition-all group-hover:scale-105`}>
                    <div className={visuals.iconColor}>
                      {visuals.icon}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-widest ${
                        visuals.badge === 'Crear' || visuals.badge === 'LOGIN' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        visuals.badge === 'Eliminar' || visuals.badge === 'LOGOUT' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                        'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {visuals.badge}
                      </span>
                      <span className="px-2 py-0.5 rounded-md border border-zinc-700/30 bg-zinc-800/30 text-zinc-500 text-[8px] font-black uppercase tracking-widest">
                        {visuals.modulo}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold mb-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(log.fecha), "d/M/yyyy, h:mm:ss a", { locale: es })}
                    </div>

                    <p className="text-sm font-bold text-zinc-200 leading-tight truncate group-hover:text-white transition-colors">
                      {visuals.mensaje}
                    </p>
                  </div>

                  <div className="hidden sm:block">
                     <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-lg border border-white/5">
                        <Database className="h-3 w-3 text-zinc-700" />
                        <span className="text-[9px] font-mono text-zinc-500 tracking-tighter">
                          {log.usuario_id?.slice(0, 8) || 'SISTEMA'}
                        </span>
                     </div>
                  </div>
                  
                  <ChevronRight className="h-4 w-4 text-zinc-800 group-hover:text-[#D4AF37] transition-colors" />
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center h-full opacity-20 text-center grayscale">
            <Package className="h-12 w-12 mb-3 text-zinc-500" />
            <p className="text-sm font-black uppercase tracking-widest text-zinc-400">Sin datos registrados</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuditoria;

// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos hooks esenciales de React para el manejo de estado y efectos secundarios
import { useEffect, useState } from 'react';
// Importamos iconos de lucide-react para la representación visual de métricas y acciones
import { 
  TrendingUp, 
  ShoppingCart, 
  Download, 
  ArrowUpRight,
  Pizza as PizzaIcon,
  Truck,
  Store,
  Package
} from 'lucide-react';
// Importamos componentes de recharts para la visualización de datos mediante gráficos
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart as RePieChart, Pie, AreaChart, Area
} from 'recharts';
// Importamos el cliente de Supabase para la interacción con la base de datos
import { supabase } from '@/integrations/supabase/client';
// Importamos el contexto de moneda para formatear valores monetarios según la configuración local
import { useCurrency } from '@/contexts/CurrencyContext';
// Importamos motion de framer-motion para añadir animaciones a los componentes de la interfaz
import { motion } from 'framer-motion';
// Importamos cloneElement para manipular elementos React de forma dinámica
import { cloneElement } from 'react';

// ========================================== //
// CONFIGURACIÓN DE COLORES SARTORIA
// ========================================== //
/**
 * Definición de la paleta de colores oficial para mantener la consistencia visual en los gráficos
 */
const COLORS = {
  gold: '#D4AF37',    // Color dorado para resaltar elementos premium
  wine: '#800020',    // Color vino para representar la marca
  cardBg: '#1A1A1A',  // Fondo oscuro para las tarjetas
  zincText: '#a1a1aa', // Texto en gris zinc para menor jerarquía
  emerald: '#10b981', // Verde para tendencias positivas
  blue: '#3b82f6',    // Azul para delivery
  orange: '#f59e0b'   // Naranja para recogida local
};

// ========================================== //
// COMPONENTE PRINCIPAL (ADMINANALITICA)
// ========================================== //
/**
 * AdminAnalitica: Panel de control avanzado que muestra KPIs, gráficos de ventas y métricas de rendimiento.
 */
const AdminAnalitica = () => {
  // ========================================== //
  // ESTADO Y HOOKS
  // ========================================== //
  // Extraemos la función de formateo de moneda del contexto
  const { format } = useCurrency();
  // Estado para controlar la carga inicial de los datos
  const [loading, setLoading] = useState(true);
  // Estado para el filtro de tiempo actual (Día, Semana, Mes)
  const [timeFilter, setFilter] = useState('Semana');
  // Estado para almacenar los datos analíticos obtenidos de la base de datos
  const [data, setData] = useState<any>(null);

  // ========================================== //
  // EFECTOS
  // ========================================== //
  /**
   * useEffect: Se ejecuta al montar el componente para obtener los datos de la vista de analítica avanzada.
   */
  useEffect(() => {
    // Función asíncrona para realizar la petición a Supabase
    const fetchAnalytics = async () => {
      // Consultamos la vista 'v_analitica_avanzada_sartoria' que centraliza las métricas
      const { data: res } = await supabase.from('v_analitica_avanzada_sartoria').select('*').single();
      // Si recibimos datos, actualizamos el estado
      if (res) setData(res);
      // Finalizamos el estado de carga
      setLoading(false);
    };
    // Iniciamos la obtención de datos
    fetchAnalytics();
  }, []); // El array vacío asegura que solo se ejecute una vez al inicio

  // ========================================== //
  // FUNCIONES DE UTILIDAD
  // ========================================== //
  /**
   * exportCSV: Genera y descarga un archivo CSV con las métricas clave actuales.
   */
  const exportCSV = () => {
    // Definimos las cabeceras del archivo CSV
    const headers = ["Metrica", "Valor"];
    // Preparamos las filas con los datos actuales o valores por defecto
    const rows = [
      ["Ventas Totales", data?.ventas_totales || 19290],
      ["Ticket Promedio", data?.ticket_promedio || 1483.85],
      ["Delivery", data?.count_delivery || 46.2],
      ["Local", data?.count_recogida || 53.8]
    ];
    // Convertimos la estructura de datos a formato de texto CSV
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    // Creamos un blob con el contenido y el tipo MIME adecuado
    const blob = new Blob([csvContent], { type: 'text/csv' });
    // Generamos una URL temporal para el blob
    const url = window.URL.createObjectURL(blob);
    // Creamos un elemento de ancla invisible para forzar la descarga
    const a = document.createElement('a');
    a.href = url;
    // Definimos el nombre del archivo con la fecha actual
    a.download = `reporte_sartoria_${new Date().toISOString().split('T')[0]}.csv`;
    // Simulamos el clic para iniciar la descarga
    a.click();
  };

  // ========================================== //
  // RENDERIZADO CONDICIONAL (LOADING)
  // ========================================== //
  // Si los datos aún se están cargando, mostramos un spinner de carga centrado
  if (loading) return <div className="flex h-96 items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold" /></div>;

  // ========================================== //
  // PREPARACIÓN DE DATOS PARA GRÁFICOS
  // ========================================== //
  // Datos de las pizzas más vendidas (obtenidos de la DB o mock como fallback)
  const topPizzasData = data?.top_pizzas || [
    { nombre: 'Margherita Classica', cantidad: 38 },
    { nombre: 'Pesto Genovese', cantidad: 19 },
    { nombre: 'Capricciosa', cantidad: 19 },
    { nombre: 'Pizza al Tartufo', cantidad: 13 },
    { nombre: 'Napolitana DOC', cantidad: 13 }
  ];

  // Datos para el gráfico de distribución de canales de venta
  const deliveryData = [
    { name: 'Delivery', value: data?.count_delivery || 46.2, color: COLORS.blue },
    { name: 'Local', value: data?.count_recogida || 53.8, color: COLORS.orange }
  ];

  // ========================================== //
  // RENDERIZADO PRINCIPAL
  // ========================================== //
  return (
    <div className="space-y-6 bg-zinc-950 p-4 lg:p-8 rounded-[2.5rem]">
      {/* SECCIÓN: HEADER Y FILTROS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* Título principal con fuente serif para toque elegante */}
          <h1 className="font-serif text-3xl font-bold text-white">Analítica Avanzada</h1>
          {/* Subtítulo descriptivo */}
          <p className="text-zinc-500 text-sm font-medium">Monitoreo de rendimiento y KPIs</p>
        </div>
        {/* Controles de filtrado temporal y exportación */}
        <div className="flex items-center gap-2 bg-[#1A1A1A] p-1.5 rounded-2xl border border-white/5 shadow-xl">
          {['Día', 'Semana', 'Mes'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              {/* Estilo dinámico basado en el filtro seleccionado */}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${timeFilter === f ? 'bg-white text-black shadow-md' : 'text-zinc-500 hover:bg-white/5'}`}
            >
              {f}
            </button>
          ))}
          {/* Separador visual vertical */}
          <div className="w-px h-4 bg-white/10 mx-1" />
          {/* Botón para activar la exportación CSV */}
          <button onClick={exportCSV} className="p-2 text-zinc-400 hover:text-gold transition-colors">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* SECCIÓN: MÉTRICAS TOP (GRID) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tarjeta de Ventas Totales con tendencia positiva */}
        <MetricCard title="Ventas Totales" value={format(data?.ventas_totales || 19290)} icon={<TrendingUp />} trend="+8.2%" color="gold" />
        {/* Tarjeta de Ticket Promedio */}
        <MetricCard title="Ticket Promedio" value={format(data?.ticket_promedio || 1483.85)} icon={<ShoppingCart />} trend="+3.1%" color="zinc" />
        {/* Tarjeta de porcentaje Delivery */}
        <MetricCard title="Delivery" value={`${deliveryData[0].value}%`} icon={<Truck />} sub="Servicio a domicilio" color="blue" />
        {/* Tarjeta de porcentaje Local */}
        <MetricCard title="Local (Recogida)" value={`${deliveryData[1].value}%`} icon={<Store />} sub="Ventas en mostrador" color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SECCIÓN: GRÁFICO DE ÁREA - VENTAS VS COSTOS */}
        <div className="lg:col-span-2 bg-[#1A1A1A] p-8 rounded-[2rem] border border-white/5 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-serif text-xl font-bold text-white">Ventas vs Costos</h3>
            <div className="flex gap-4">
              {/* Leyendas personalizadas para el gráfico */}
              <LegendItem color={COLORS.wine} label="Ventas" />
              <LegendItem color={COLORS.gold} label="Costos" />
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {/* Gráfico de área para visualizar la evolución temporal */}
              <AreaChart data={[
                { name: '10:00', v: 4000, c: 2400 },
                { name: '13:00', v: 9000, c: 4800 },
                { name: '16:00', v: 7000, c: 3800 },
                { name: '19:00', v: 15000, c: 7000 },
                { name: '22:00', v: 19290, c: 8500 },
              ]}>
                <defs>
                  {/* Gradiente para el relleno del área de ventas */}
                  <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.wine} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.wine} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2a2a" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 12}} />
                <Tooltip contentStyle={{backgroundColor: '#1A1A1A', border: '1px solid #333', color: 'white'}} />
                {/* Línea de ventas con relleno de gradiente */}
                <Area type="monotone" dataKey="v" stroke={COLORS.wine} strokeWidth={3} fillOpacity={1} fill="url(#colorV)" />
                {/* Línea de costos punteada para diferenciación */}
                <Area type="monotone" dataKey="c" stroke={COLORS.gold} strokeWidth={3} fill="none" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SECCIÓN: GRÁFICO DE PIE - TOP PIZZAS */}
        <div className="bg-[#1A1A1A] p-8 rounded-[2.5rem] shadow-2xl border border-white/5 flex flex-col">
          <h3 className="text-white font-serif text-xl font-bold mb-6">Top Pizzas</h3>
          <div className="flex-1 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={topPizzasData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="cantidad"
                >
                  {/* Celdas de colores rotativos para cada porción del gráfico */}
                  {topPizzasData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={[COLORS.gold, COLORS.wine, '#4b5563', '#3f3f46', '#27272a'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{backgroundColor: '#1A1A1A', border: '1px solid #333'}} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          {/* Listado de las 3 pizzas más vendidas debajo del gráfico */}
          <div className="space-y-3 mt-4">
            {topPizzasData.slice(0, 3).map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{backgroundColor: [COLORS.gold, COLORS.wine, '#4b5563'][i]}} />
                  <span className="text-zinc-400 font-medium">{p.nombre}</span>
                </div>
                <span className="text-white font-bold">{p.cantidad}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECCIÓN: GRÁFICO DE BARRAS - CONSUMO DE INGREDIENTES */}
        <div className="bg-[#1A1A1A] p-8 rounded-[2rem] border border-white/5 shadow-2xl">
          <h3 className="font-serif text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Package className="h-5 w-5 text-gold" /> Consumo de Ingredientes
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              {/* Gráfico de barras horizontales para facilitar la lectura de etiquetas largas */}
              <BarChart data={[
                { n: 'Harina', v: 8000 },
                { n: 'Mozzarella', v: 6500 },
                { n: 'Tomate', v: 5800 },
                { n: 'Aceite', v: 2400 },
                { n: 'Parmigiano', v: 1800 },
              ]} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="n" type="category" axisLine={false} tickLine={false} width={80} tick={{fontSize: 11, fontWeight: 'bold', fill: '#71717a'}} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#1A1A1A', border: '1px solid #333'}} />
                <Bar dataKey="v" fill={COLORS.wine} radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SECCIÓN: FIDELIZACIÓN DE CLIENTES */}
        <div className="bg-[#1A1A1A] p-8 rounded-[2rem] border border-white/5 shadow-2xl">
          <h3 className="font-serif text-xl font-bold text-white mb-6">Fidelización de Clientes</h3>
          <div className="flex items-center gap-12">
            <div className="h-[180px] w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={[
                      { name: 'Nuevos', value: data?.clientes_nuevos || 100 },
                      { name: 'Recurrentes', value: data?.clientes_recurrentes || 0 }
                    ]}
                    dataKey="value"
                    innerRadius={50}
                    outerRadius={70}
                  >
                    {/* Colores fijos para nuevos vs recurrentes */}
                    <Cell fill={COLORS.wine} />
                    <Cell fill={COLORS.gold} />
                  </Pie>
                </RePieChart>
              </ResponsiveContainer>
            </div>
            {/* Etiquetas de datos numéricos grandes */}
            <div className="space-y-4">
              <div>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Nuevos</p>
                <p className="text-3xl font-black text-white">{data?.clientes_nuevos || 100}%</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Recurrentes</p>
                <p className="text-3xl font-black text-white">{data?.clientes_recurrentes || 0}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========================================== //
// SUBCOMPONENTES
// ========================================== //

/**
 * MetricCard: Tarjeta reutilizable para mostrar una métrica clave con icono y tendencia.
 */
const MetricCard = ({ title, value, icon, trend, sub, color }: any) => {
  // Mapeo de estilos basados en la clave de color proporcionada
  const colorMap: any = {
    gold: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    zinc: "text-white bg-white/5 border-white/10",
    blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    orange: "text-orange-400 bg-orange-400/10 border-orange-400/20"
  };

  return (
    // Componente animado al pasar el ratón
    <motion.div whileHover={{ y: -4 }} className="bg-[#1A1A1A] p-6 rounded-[2rem] shadow-2xl border border-white/5">
      <div className="flex justify-between items-start mb-4">
        {/* Contenedor del icono con estilo temático */}
        <div className={`p-3 rounded-2xl ${colorMap[color]} border`}>
          {cloneElement(icon, { size: 24 })}
        </div>
        {/* Indicador de tendencia si existe */}
        {trend && (
          <div className="flex items-center text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg border border-emerald-400/20">
            <ArrowUpRight size={12} /> {trend}
          </div>
        )}
      </div>
      {/* Título de la métrica en mayúsculas pequeñas */}
      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{title}</p>
      {/* Valor principal resaltado */}
      <h4 className="text-2xl font-black text-white mt-1">{value}</h4>
      {/* Subtexto descriptivo opcional */}
      {sub && <p className="text-[10px] text-zinc-500 mt-1 font-medium">{sub}</p>}
    </motion.div>
  );
};

/**
 * LegendItem: Elemento visual para la leyenda de los gráficos.
 */
const LegendItem = ({ color, label }: any) => (
  <div className="flex items-center gap-2">
    {/* Círculo de color que representa la serie de datos */}
    <div className="h-2 w-2 rounded-full" style={{backgroundColor: color}} />
    {/* Etiqueta de la leyenda */}
    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</span>
  </div>
);

// ========================================== //
// EXPORTACIÓN
// ========================================== //
export default AdminAnalitica;

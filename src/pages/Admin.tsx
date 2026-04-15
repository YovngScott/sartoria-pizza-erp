// ========================================== //
// --- IMPORTACIONES ---
// ========================================== //

// Importa hooks de React para el ciclo de vida, estado y definición de tipos de nodos.
// ¿Por qué?: Permiten manejar la lógica de autenticación, la pestaña activa y el renderizado condicional.
import { useEffect, useState, type ReactNode } from 'react';

// Importa 'motion' de framer-motion para animaciones de transición.
// ¿Por qué?: Suaviza el cambio entre las diferentes pestañas del panel de administración.
import { motion } from 'framer-motion';

// Importa una colección de iconos de 'lucide-react' para la barra de navegación lateral/superior.
// ¿Por qué?: Proporciona una identidad visual clara a cada módulo del ERP.
import {
  AlertTriangle,
  BarChart3,
  FileText,
  LogOut,
  Package,
  Pizza,
  ShoppingCart,
  User,
  Users,
} from 'lucide-react';

// Importa 'Link' de react-router-dom para la navegación interna.
// ¿Por qué?: Permite al administrador regresar al menú principal de la pizzería.
import { Link } from 'react-router-dom';

// Importa los componentes de cada módulo administrativo.
// ¿Por qué?: Cada componente encapsula la lógica específica de una sección del ERP (Inventario, Pedidos, etc.).
import AdminAnalitica from '@/components/admin/AdminAnalitica';
import AdminAuditoria from '@/components/admin/AdminAuditoria';
import AdminClientes from '@/components/admin/AdminClientes';
import AdminInventario from '@/components/admin/AdminInventario';
import AdminPedidos from '@/components/admin/AdminPedidos';
import AdminPizzas from '@/components/admin/AdminPizzas';
import AdminPresupuesto from '@/components/admin/AdminPresupuesto';
import AdminUsuarios from '@/components/admin/AdminUsuarios';

// Importa el hook global de la aplicación.
// ¿Por qué?: Se utiliza para refrescar los datos globales tras el inicio de sesión.
import { useApp } from '@/contexts/CartContext';

// Importa el cliente de Supabase para la gestión de la sesión.
// ¿Por qué?: Permite verificar si el usuario tiene una sesión activa y es administrador.
import { supabase } from '@/integrations/supabase/client';

// Importa funciones de auditoría.
// ¿Por qué?: Registra eventos importantes como el acceso a módulos y el cierre de sesión.
import { registrarAccesoModulo, registrarLogout } from '@/lib/auditUsuario';

// Importa el componente de login para administradores.
// ¿Por qué?: Se muestra cuando el usuario no está autenticado o no tiene permisos.
import AdminLogin from './AdminLogin';

// ========================================== //
// --- TIPOS / INTERFACES ---
// ========================================== //

// Define las pestañas disponibles en el panel de administración.
// ¿Por qué?: Proporciona seguridad de tipos al cambiar entre módulos.
type Tab =
  | 'presupuesto'
  | 'inventario'
  | 'pizzas'
  | 'clientes'
  | 'pedidos'
  | 'usuarios'
  | 'auditoria'
  | 'analitica';

// ========================================== //
// --- COMPONENTE PRINCIPAL ---
// ========================================== //

// Define el componente 'Admin' que actúa como el contenedor principal del ERP.
const Admin = () => {
  // --- ESTADOS LOCALES ---

  // Indica si el usuario ha superado la autenticación de administrador.
  const [authed, setAuthed] = useState(false);

  // Estado de carga inicial mientras se verifica la sesión en Supabase.
  const [checking, setChecking] = useState(true);

  // Almacena el identificador de la pestaña (módulo) actualmente visible.
  const [tab, setTab] = useState<Tab>('presupuesto');

  // Función para refrescar los datos globales desde el contexto.
  const { refreshData } = useApp();

  // --- EFECTOS (CICLO DE VIDA) ---

  // Efecto que verifica la sesión del usuario al montar el componente.
  // ¿Por qué?: Protege la ruta de administración asegurando que solo usuarios autorizados entren.
  useEffect(() => {
    const checkSession = async () => {
      // Obtiene la sesión actual de Supabase.
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // Llama a una función de la base de datos para verificar el rol de administrador.
        const { data: isAdmin } = await supabase.rpc('is_admin_user');
        if (isAdmin) {
          setAuthed(true);
          // Actualiza los datos globales tras confirmar acceso.
          await refreshData();
        }
      }

      // Finaliza el estado de verificación.
      setChecking(false);
    };

    // Ejecuta la verificación de sesión.
    void checkSession();
  }, [refreshData]);

  // --- MANEJADORES DE EVENTOS ---

  // Gestiona el cierre de sesión del administrador.
  const handleLogout = async () => {
    // Registra el evento de logout en la auditoría antes de cerrar sesión.
    await registrarLogout({
      modulo_actual: tab,
    });
    // Llama a Supabase para invalidar la sesión.
    await supabase.auth.signOut();
    // Actualiza el estado local para mostrar el login.
    setAuthed(false);
  };

  // Callback ejecutado tras un inicio de sesión exitoso en AdminLogin.
  const handleLogin = async () => {
    setAuthed(true);
    // Refresca los datos para asegurar que el ERP tenga info actualizada.
    await refreshData();
  };

  // --- RENDERIZADO CONDICIONAL (CARGA / AUTH) ---

  // Muestra un spinner mientras se verifica la identidad del usuario.
  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        {/* Spinner animado con Tailwind. */}
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Si no está autenticado, renderiza el componente de Login en su lugar.
  if (!authed) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  // --- CONFIGURACIÓN DE NAVEGACIÓN ---

  // Define la lista de módulos disponibles para generar los botones de navegación.
  const tabs: { id: Tab; icon: ReactNode; label: string }[] = [
    { id: 'presupuesto', label: 'Presupuesto', icon: <FileText className="h-4 w-4" /> },
    { id: 'inventario', label: 'Inventario', icon: <Package className="h-4 w-4" /> },
    { id: 'pizzas', label: 'Pizzas', icon: <Pizza className="h-4 w-4" /> },
    { id: 'clientes', label: 'Clientes', icon: <User className="h-4 w-4" /> },
    { id: 'pedidos', label: 'Pedidos', icon: <ShoppingCart className="h-4 w-4" /> },
    { id: 'usuarios', label: 'Usuarios', icon: <Users className="h-4 w-4" /> },
    { id: 'auditoria', label: 'Auditoria', icon: <AlertTriangle className="h-4 w-4" /> },
    { id: 'analitica', label: 'Analitica', icon: <BarChart3 className="h-4 w-4" /> },
  ];

  // --- RENDERIZADO PRINCIPAL ---
  return (
    // Contenedor principal del ERP.
    <main className="container mx-auto px-4 py-8">
      {/* Cabecera del Panel de Administración. */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          {/* Título principal con gradiente dorado. */}
          <h1 className="font-display text-3xl font-bold gold-text-gradient">
            Panel de Administracion
          </h1>
          {/* Subtítulo informativo. */}
          <p className="text-sm text-muted-foreground">
            Sartoria della Pizza - ERP Dashboard
          </p>
        </div>

        {/* Acciones de cabecera: volver al menú o cerrar sesión. */}
        <div className="flex gap-3">
          {/* Enlace para regresar a la vista de cliente. */}
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
            ← Menu
          </Link>
          {/* Botón para cerrar la sesión administrativa. */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Salir
          </button>
        </div>
      </div>

      {/* Barra de pestañas para navegar entre módulos. */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {/* Genera un botón por cada pestaña definida en el array 'tabs'. */}
        {tabs.map((currentTab) => (
          <button
            key={currentTab.id}
            onClick={() => setTab(currentTab.id)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              tab === currentTab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-foreground hover:bg-muted'
            } flex items-center gap-2`}
          >
            {/* Icono y etiqueta de la pestaña. */}
            {currentTab.icon}
            {currentTab.label}
          </button>
        ))}
      </div>

      {/* 
        Contenedor animado para el contenido del módulo activo.
        Utiliza 'key={tab}' para que Framer Motion detecte el cambio de contenido y ejecute la animación.
      */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Renderizado condicional del componente correspondiente al módulo seleccionado. */}
        {tab === 'presupuesto' && <AdminPresupuesto />}
        {tab === 'inventario' && <AdminInventario />}
        {tab === 'pizzas' && <AdminPizzas />}
        {tab === 'clientes' && <AdminClientes />}
        {tab === 'pedidos' && <AdminPedidos />}
        {tab === 'usuarios' && <AdminUsuarios />}
        {tab === 'auditoria' && <AdminAuditoria />}
        {tab === 'analitica' && <AdminAnalitica />}
      </motion.div>
    </main>
  );
};

// Exporta el componente para su uso en las rutas de la aplicación.
export default Admin;

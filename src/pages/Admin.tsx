import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
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
import { Link } from 'react-router-dom';
import AdminAnalitica from '@/components/admin/AdminAnalitica';
import AdminAuditoria from '@/components/admin/AdminAuditoria';
import AdminClientes from '@/components/admin/AdminClientes';
import AdminInventario from '@/components/admin/AdminInventario';
import AdminPedidos from '@/components/admin/AdminPedidos';
import AdminPizzas from '@/components/admin/AdminPizzas';
import AdminPresupuesto from '@/components/admin/AdminPresupuesto';
import AdminUsuarios from '@/components/admin/AdminUsuarios';
import { useApp } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { registrarAccesoModulo, registrarLogout } from '@/lib/auditUsuario';
import AdminLogin from './AdminLogin';

// === TIPOS ===

type Tab =
  | 'presupuesto'
  | 'inventario'
  | 'pizzas'
  | 'clientes'
  | 'pedidos'
  | 'usuarios'
  | 'auditoria'
  | 'analitica';

const Admin = () => {
  // === ESTADOS ===

  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<Tab>('presupuesto');
  const { refreshData } = useApp();

  // === SESION ===

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const { data: isAdmin } = await supabase.rpc('is_admin_user');
        if (isAdmin) {
          setAuthed(true);
          await refreshData();
        }
      }

      setChecking(false);
    };

    void checkSession();
  }, [refreshData]);

  const handleLogout = async () => {
    await registrarLogout({
      modulo_actual: tab,
    });
    await supabase.auth.signOut();
    setAuthed(false);
  };

  const handleLogin = async () => {
    setAuthed(true);
    await refreshData();
  };

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!authed) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  // === NAVEGACION ===

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

  // === RENDERIZADO ===

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold gold-text-gradient">
            Panel de Administracion
          </h1>
          <p className="text-sm text-muted-foreground">
            Sartoria della Pizza - ERP Dashboard
          </p>
        </div>

        <div className="flex gap-3">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
            ← Menu
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Salir
          </button>
        </div>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
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
            {currentTab.icon}
            {currentTab.label}
          </button>
        ))}
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
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

export default Admin;

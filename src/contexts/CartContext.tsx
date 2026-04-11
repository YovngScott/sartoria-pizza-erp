import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AuditoriaLog, Cliente, Ingrediente, Pedido, Pizza, Receta, UnidadMedida } from '@/lib/erp';
import { calculateOrderTotals, type OrderDraftItem } from '@/lib/erp';
import { ensureClient, loadDashboardData, savePedido } from '@/services/erpService';

export interface CartItem {
  cantidad: number;
  pizza: Pizza;
}

interface AppState {
  addToCart: (pizza: Pizza) => void;
  auditLogs: AuditoriaLog[];
  cart: CartItem[];
  clearCart: () => void;
  clearInvoice: () => void;
  clientes: Cliente[];
  getCartItbis: () => number;
  getCartSubtotal: () => number;
  getCartTotal: () => number;
  ingredientes: Ingrediente[];
  isAdminSession: boolean;
  lastInvoice: Pedido | null;
  loading: boolean;
  pedidos: Pedido[];
  pizzas: Pizza[];
  processOrder: (
    nombre: string,
    email: string | undefined,
    tipo: 'Delivery' | 'Recogida',
    direccion: string,
    telefono?: string
  ) => Promise<Pedido>;
  recetas: Receta[];
  refreshData: () => Promise<void>;
  removeFromCart: (pizzaId: number) => void;
  unidadesMedida: UnidadMedida[];
  updateQuantity: (pizzaId: number, cantidad: number) => void;
}

const CartContext = createContext<AppState | null>(null);

export const useApp = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useApp must be inside CartProvider');
  return ctx;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [auditLogs, setAuditLogs] = useState<AuditoriaLog[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [isAdminSession, setIsAdminSession] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);

  const refreshData = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      let nextIsAdmin = false;
      if (session) {
        const { data } = await supabase.rpc('is_admin_user');
        nextIsAdmin = Boolean(data);
      }

      const data = await loadDashboardData(nextIsAdmin);

      setAuditLogs(data.auditLogs);
      setClientes(data.clientes);
      setIngredientes(data.ingredientes);
      setIsAdminSession(nextIsAdmin);
      setPedidos(data.pedidos);
      setPizzas(data.pizzas);
      setRecetas(data.recetas);
      setUnidadesMedida(data.unidadesMedida);
    } catch (error) {
      console.error('Error al refrescar datos del ERP:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshData();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshData]);

  const addToCart = useCallback((pizza: Pizza) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.pizza.id === pizza.id);
      if (existing) {
        return prev.map((item) =>
          item.pizza.id === pizza.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prev, { pizza, cantidad: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((pizzaId: number) => {
    setCart((prev) => prev.filter((item) => item.pizza.id !== pizzaId));
  }, []);

  const updateQuantity = useCallback(
    (pizzaId: number, cantidad: number) => {
      if (cantidad <= 0) {
        removeFromCart(pizzaId);
        return;
      }

      setCart((prev) =>
        prev.map((item) =>
          item.pizza.id === pizzaId ? { ...item, cantidad } : item
        )
      );
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getCartTotal = useCallback(() => {
    return calculateOrderTotals(
      cart.map((item) => ({ cantidad: item.cantidad, pizza: item.pizza }))
    ).total;
  }, [cart]);

  const getCartSubtotal = useCallback(() => {
    return calculateOrderTotals(
      cart.map((item) => ({ cantidad: item.cantidad, pizza: item.pizza }))
    ).subtotal;
  }, [cart]);

  const getCartItbis = useCallback(() => {
    return calculateOrderTotals(
      cart.map((item) => ({ cantidad: item.cantidad, pizza: item.pizza }))
    ).impuestoTotal;
  }, [cart]);

  const processOrder = useCallback(
    async (
      nombre: string,
      email: string,
      tipo: 'Delivery' | 'Recogida',
      direccion: string,
      telefono = ''
    ) => {
      const clienteNombre = nombre.trim();
      const direccionEntrega = direccion.trim();
      const clienteEmail = email?.trim().toLowerCase() || '';

      if (!clienteNombre) {
        throw new Error('El nombre del cliente es obligatorio');
      }

      if (cart.length === 0) {
        throw new Error('El carrito esta vacio');
      }

      const orderItems: OrderDraftItem[] = cart.map((item) => ({
        cantidad: item.cantidad,
        pizza: item.pizza,
      }));

      const cliente = await ensureClient(
        {
          direccion: tipo === 'Delivery' ? direccionEntrega : '',
          email: clienteEmail,
          nombre: clienteNombre,
          telefono,
        },
        true
      );

      const pedido = await savePedido({
        cliente,
        direccionEntrega,
        estado: 'pendiente',
        ingredientes,
        items: orderItems,
        recetas,
        tipo: tipo === 'Delivery' ? 'delivery' : 'recogida',
        unidadesMedida,
        usePublicClient: true,
        usuarioId: null,
      });

      setLastInvoice(pedido);
      setCart([]);
      await refreshData();

      return pedido;
    },
    [cart, ingredientes, recetas, refreshData, unidadesMedida]
  );

  const clearInvoice = useCallback(() => {
    setLastInvoice(null);
  }, []);

  return (
    <CartContext.Provider
      value={{
        addToCart,
        auditLogs,
        cart,
        clearCart,
        clearInvoice,
        clientes,
        getCartItbis,
        getCartSubtotal,
        getCartTotal,
        ingredientes,
        isAdminSession,
        lastInvoice,
        loading,
        pedidos,
        pizzas,
        processOrder,
        recetas,
        refreshData,
        removeFromCart,
        unidadesMedida,
        updateQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

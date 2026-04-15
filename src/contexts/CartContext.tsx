// ========================================== //
//      GESTOR DEL ESTADO GLOBAL DEL CARRITO    //
// ========================================== //

/**
 * ARCHIVO: CartContext.tsx
 * DESCRIPCIÓN: Este es el motor de la lógica de negocio. Controla el carrito de compras,
 * la comunicación con la base de datos (Supabase) y la gestión de pedidos, clientes e inventario.
 */

// --- IMPORTACIONES DE REACT Y HOOKS --- //
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

// --- IMPORTACIONES DE INTEGRACIONES Y TIPOS --- //
// supabase: Cliente para interactuar con la base de datos.
import { supabase } from '@/integrations/supabase/client';
// Tipos: Definiciones de cómo son los datos (Pedido, Pizza, Cliente, etc.).
import type { AuditoriaLog, Cliente, Ingrediente, Pedido, Pizza, Receta, UnidadMedida } from '@/lib/erp';
// Funciones de utilidad para cálculos de totales.
import { calculateOrderTotals, type OrderDraftItem } from '@/lib/erp';
// Servicios para cargar datos y guardar pedidos.
import { ensureClient, loadDashboardData, savePedido } from '@/services/erpService';

// ========================================== //
//         DEFINICIÓN DE INTERFACES           //
// ========================================== //

// CartItem: Representa un producto individual dentro del carrito.
export interface CartItem {
  cantidad: number; // Cuántas unidades de esta pizza se llevan.
  pizza: Pizza;     // Los datos de la pizza (nombre, precio, etc.).
}

// AppState: Define todo lo que el contexto ofrece a los componentes.
interface AppState {
  addToCart: (pizza: Pizza) => void; // Función para añadir pizzas.
  auditLogs: AuditoriaLog[];        // Registros de auditoría (quién hizo qué).
  cart: CartItem[];                 // La lista actual de pizzas en el carrito.
  clearCart: () => void;            // Vacía el carrito por completo.
  clearInvoice: () => void;         // Limpia la factura de la pantalla.
  clientes: Cliente[];              // Lista de clientes registrados.
  getCartItbis: () => number;       // Calcula el impuesto total (ITBIS).
  getCartSubtotal: () => number;    // Calcula el total sin impuestos.
  getCartTotal: () => number;       // Calcula el total final a pagar.
  ingredientes: Ingrediente[];      // Lista de ingredientes disponibles.
  isAdminSession: boolean;          // Indica si el usuario actual es administrador.
  lastInvoice: Pedido | null;       // Guarda la última factura generada.
  loading: boolean;                 // Indica si se están cargando datos.
  pedidos: Pedido[];                // Historial de todos los pedidos.
  pizzas: Pizza[];                  // El menú de pizzas disponibles.
  processOrder: (                   // Función para finalizar la compra.
    nombre: string,
    email: string | undefined,
    tipo: 'Delivery' | 'Recogida',
    direccion: string,
    telefono?: string
  ) => Promise<Pedido>;
  recetas: Receta[];                // Recetas de las pizzas.
  refreshData: () => Promise<void>; // Fuerza la actualización de todos los datos.
  removeFromCart: (pizzaId: number) => void; // Quita una pizza del carrito.
  unidadesMedida: UnidadMedida[];   // Unidades como gramos, unidades, etc.
  updateQuantity: (pizzaId: number, cantidad: number) => void; // Cambia la cantidad de una pizza.
}

// ========================================== //
//        CREACIÓN DEL CONTEXTO Y HOOK        //
// ========================================== //

// Creamos el contenedor del contexto.
const CartContext = createContext<AppState | null>(null);

/**
 * useApp: Hook personalizado para acceder fácilmente a los datos del carrito
 * desde cualquier componente sin tener que pasar "props" manualmente.
 */
export const useApp = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useApp debe estar dentro de CartProvider');
  return ctx;
};

// ========================================== //
//            PROVEEDOR DEL CONTEXTO          //
// ========================================== //

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // --- ESTADOS INTERNOS (MEMORIA DEL COMPONENTE) --- //
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

  // --- LÓGICA DE CARGA DE DATOS --- //
  /**
   * refreshData: Se conecta a Supabase, verifica si eres admin y baja
   * toda la información necesaria (pizzas, pedidos, ingredientes, etc.).
   */
  const refreshData = useCallback(async () => {
    setLoading(true);

    try {
      // Obtenemos la sesión actual del usuario.
      const {
        data: { session },
      } = await supabase.auth.getSession();

      let nextIsAdmin = false;
      if (session) {
        // Llamamos a una función especial en la base de datos para saber si es admin.
        const { data } = await supabase.rpc('is_admin_user');
        nextIsAdmin = Boolean(data);
      }

      // Cargamos todos los datos del ERP (Enterprise Resource Planning).
      const data = await loadDashboardData(nextIsAdmin);

      // Guardamos todo en los estados de React.
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

  // --- EFECTOS (ACCIONES AUTOMÁTICAS) --- //
  useEffect(() => {
    // Al cargar la app por primera vez, traemos los datos.
    void refreshData();

    // Si el usuario inicia o cierra sesión, volvemos a cargar los datos para actualizar permisos.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshData();
    });

    // Limpiamos la suscripción al destruir el componente.
    return () => {
      subscription.unsubscribe();
    };
  }, [refreshData]);

  // --- FUNCIONES DE MANIPULACIÓN DEL CARRITO --- //

  // Añade una pizza al carrito o aumenta su cantidad si ya existe.
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

  // Elimina una pizza específica del carrito.
  const removeFromCart = useCallback((pizzaId: number) => {
    setCart((prev) => prev.filter((item) => item.pizza.id !== pizzaId));
  }, []);

  // Cambia la cantidad de una pizza (ej. pasar de 1 a 3 unidades).
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

  // Vacía el carrito (usado después de comprar o al cancelar).
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // --- CÁLCULOS DE TOTALES --- //

  // Suma total de lo que debe pagar el cliente.
  const getCartTotal = useCallback(() => {
    return calculateOrderTotals(
      cart.map((item) => ({ cantidad: item.cantidad, pizza: item.pizza }))
    ).total;
  }, [cart]);

  // Total antes de impuestos.
  const getCartSubtotal = useCallback(() => {
    return calculateOrderTotals(
      cart.map((item) => ({ cantidad: item.cantidad, pizza: item.pizza }))
    ).subtotal;
  }, [cart]);

  // Solo el valor de los impuestos.
  const getCartItbis = useCallback(() => {
    return calculateOrderTotals(
      cart.map((item) => ({ cantidad: item.cantidad, pizza: item.pizza }))
    ).impuestoTotal;
  }, [cart]);

  // --- PROCESAMIENTO DE LA ORDEN --- //
  /**
   * processOrder: Esta es la función más importante. Valida los datos,
   * registra al cliente si es nuevo, guarda el pedido en la base de datos
   * y limpia el carrito.
   */
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

      // Validaciones básicas antes de enviar.
      if (!clienteNombre) {
        throw new Error('El nombre del cliente es obligatorio');
      }

      if (cart.length === 0) {
        throw new Error('El carrito esta vacio');
      }

      // Preparamos los items para el formato que espera el ERP.
      const orderItems: OrderDraftItem[] = cart.map((item) => ({
        cantidad: item.cantidad,
        pizza: item.pizza,
      }));

      // Nos aseguramos de que el cliente exista en la base de datos.
      const cliente = await ensureClient(
        {
          direccion: tipo === 'Delivery' ? direccionEntrega : '',
          email: clienteEmail,
          nombre: clienteNombre,
          telefono,
        },
        true
      );

      // Guardamos el pedido real.
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

      // Guardamos la factura generada para mostrarla al cliente.
      setLastInvoice(pedido);
      // Limpiamos el carrito local.
      setCart([]);
      // Refrescamos datos para actualizar stock/inventario.
      await refreshData();

      return pedido;
    },
    [cart, ingredientes, recetas, refreshData, unidadesMedida]
  );

  // Limpia la factura de la pantalla.
  const clearInvoice = useCallback(() => {
    setLastInvoice(null);
  }, []);

  // --- RENDERIZADO DEL PROVEEDOR --- //
  return (
    /* Compartimos todos los estados y funciones con el resto de la aplicación */
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
      {/* children representa a todos los componentes que están dentro de CartProvider en App.tsx */}
      {children}
    </CartContext.Provider>
  );
};

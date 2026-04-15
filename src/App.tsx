// ========================================== //
//        ESTRUCTURA RAÍZ DE LA APLICACIÓN     //
// ========================================== //

/**
 * ARCHIVO: App.tsx
 * DESCRIPCIÓN: Este archivo actúa como el "esqueleto" de la aplicación.
 * Define qué páginas existen, qué contextos globales están disponibles (Carrito, Moneda, etc.)
 * y cómo se navega entre ellos.
 */

// --- IMPORTACIONES DE HERRAMIENTAS Y LIBRERÍAS --- //
// QueryClient permite manejar peticiones de datos de forma eficiente (caché, estados de carga).
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// BrowserRouter permite la navegación entre páginas sin recargar el navegador.
import { BrowserRouter, Route, Routes } from "react-router-dom";
// Sonner es una librería para mostrar notificaciones flotantes (toasts).
import { Toaster as Sonner } from "@/components/ui/sonner";
// TooltipProvider permite usar etiquetas de ayuda flotantes en los elementos.
import { TooltipProvider } from "@/components/ui/tooltip";

// --- IMPORTACIONES DE CONTEXTOS (ESTADOS GLOBALES) --- //
// Estos componentes "envuelven" la app para que cualquier página pueda acceder a sus datos.
import { CartProvider } from "@/contexts/CartContext"; // Maneja los productos en el carrito.
import { CurrencyProvider } from "@/contexts/CurrencyContext"; // Maneja el tipo de moneda (USD/EUR/etc).

// --- IMPORTACIONES DE COMPONENTES DE LA INTERFAZ --- //
import Header from "@/components/Header"; // La barra de navegación superior.

// --- IMPORTACIONES DE PÁGINAS (VISTAS) --- //
import Index from "./pages/Index"; // Página de inicio (menú de pizzas).
import CartPage from "./pages/CartPage"; // Página del carrito de compras.
import Admin from "./pages/Admin"; // Panel de administración.
import NotFound from "./pages/NotFound"; // Página de error 404.

// ========================================== //
//       CONFIGURACIÓN DE CLIENTE DE DATOS     //
// ========================================== //

// Creamos una instancia para gestionar las consultas a la base de datos o APIs.
const queryClient = new QueryClient();

// ========================================== //
//       COMPONENTE PRINCIPAL (APP)            //
// ========================================== //

const App = () => (
  /* --- PROVEEDORES DE DATOS Y ESTADOS --- */
  /* Envolvemos todo con QueryClientProvider para que funcionen las peticiones de datos */
  <QueryClientProvider client={queryClient}>
    /* Habilitamos los tooltips en toda la aplicación */
    <TooltipProvider>
      /* Componente que renderiza las notificaciones flotantes */
      <Sonner />
      
      /* --- CONTEXTOS DE NEGOCIO --- */
      /* El CartProvider permite que cualquier parte de la app sepa qué hay en el carrito */
      <CartProvider>
        /* El CurrencyProvider permite que todos los precios se actualicen según la moneda */
        <CurrencyProvider>
          
          /* --- ENRUTAMIENTO (NAVEGACIÓN) --- */
          /* BrowserRouter activa el sistema de navegación por URLs */
          <BrowserRouter>
            /* El Header se muestra en TODAS las páginas ya que está fuera de <Routes> */
            <Header />
            
            /* Aquí definimos qué componente se muestra según la dirección en la barra del navegador */
            <Routes>
              {/* Ruta Principal: Carga la página de inicio */}
              <Route path="/" element={<Index />} />
              
              {/* Ruta del Carrito: Muestra los productos seleccionados */}
              <Route path="/cart" element={<CartPage />} />
              
              {/* Ruta de Administración: Acceso al panel de control */}
              <Route path="/admin" element={<Admin />} />
              
              {/* Ruta Comodín (*): Si la URL no coincide con ninguna anterior, muestra el error 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          
        </CurrencyProvider>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

// Exportamos el componente para que "main.tsx" pueda usarlo.
export default App;

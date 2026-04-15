// ========================================== //
// --- IMPORTACIONES ---
// ========================================== //

// Importa iconos de 'lucide-react' para la interfaz de usuario.
// ¿Por qué?: Proporciona representaciones visuales del carrito y el reloj de estado.
import { ShoppingCart, Clock } from 'lucide-react';

// Importa componentes y hooks de 'react-router-dom'.
// ¿Por qué?: 'Link' gestiona la navegación y 'useLocation' permite saber en qué ruta estamos para ocultar elementos.
import { Link, useLocation } from 'react-router-dom';

// Importa el hook del carrito para mostrar la cantidad de items.
// ¿Por qué?: Permite actualizar el contador del carrito en tiempo real.
import { useApp } from '@/contexts/CartContext';

// Importa el contexto de moneda.
// ¿Por qué?: Permite al usuario cambiar la moneda de visualización en todo el sitio.
import { useCurrency } from '@/contexts/CurrencyContext';

// Importa tipos de datos definidos.
import { Currency } from '@/data/mockData';

// Importa 'motion' para animaciones.
// ¿Por qué?: Añade interactividad visual al presionar el botón del carrito.
import { motion } from 'framer-motion';

// ========================================== //
// --- COMPONENTE PRINCIPAL ---
// ========================================== //

// Define el componente 'Header' que representa la barra de navegación superior.
const Header = () => {
  // --- LÓGICA Y ESTADO ---

  // Obtiene el estado del carrito desde el contexto global.
  const { cart } = useApp();

  // Obtiene la moneda actual y la función para cambiarla.
  const { currency, setCurrency } = useCurrency();

  // Obtiene la ruta actual del navegador.
  const location = useLocation();

  // Calcula el número total de productos en el carrito sumando las cantidades.
  // ¿Por qué?: Para mostrarlo en el badge rojo sobre el icono del carrito.
  const totalItems = cart.reduce((s, i) => s + i.cantidad, 0);

  // Verifica si la tienda está abierta llamando a la función auxiliar.
  const isOpen = isStoreOpen();

  // --- RENDERIZADO ---
  return (
    // Contenedor principal del header con efecto de desenfoque y posición pegajosa (sticky).
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      {/* Contenedor alineado al centro con espaciado lateral. */}
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        
        {/* Logo de la pizzería que redirige al inicio. */}
        <Link to="/" className="flex items-center gap-3">
          {/* Nombre de la marca con gradiente dorado. */}
          <span className="font-display text-2xl font-bold gold-text-gradient">Sartoria della Pizza</span>
        </Link>

        {/* Sección de acciones a la derecha del header. */}
        <div className="flex items-center gap-4">
          
          {/* Indicador de estado de la tienda (Abierto/Cerrado). visible solo en pantallas >= sm. */}
          <div className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
            <Clock className="h-4 w-4" />
            <span className={isOpen ? 'text-success' : 'text-destructive'}>
              {/* Muestra texto dinámico según 'isOpen'. */}
              {isOpen ? 'Abierto' : 'Cerrado'}
            </span>
          </div>

          {/* Selector de moneda (DOP, USD, EUR). */}
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value as Currency)}
            className="rounded-md border border-border bg-secondary px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="DOP">RD$ DOP</option>
            <option value="USD">US$ USD</option>
            <option value="EUR">€ EUR</option>
          </select>

          {/* 
            Renderizado condicional del botón del carrito.
            Se oculta si ya estamos en la página del carrito para evitar redundancia.
          */}
          {location.pathname !== '/cart' && (
            <Link to="/cart" className="relative">
              {/* Botón animado con efecto al hacer clic. */}
              <motion.div whileTap={{ scale: 0.9 }} className="rounded-full border border-border bg-secondary p-2.5 transition-colors hover:border-primary">
                <ShoppingCart className="h-5 w-5 text-foreground" />
                {/* 
                  Badge de conteo de items.
                  Solo se muestra si hay al menos un item en el carrito.
                */}
                {totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </motion.div>
            </Link>
          )}

          {/* Enlace rápido al panel de administración. visible solo en pantallas >= md. */}
          <Link
            to="/admin"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-primary md:block"
          >
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
};

// ========================================== //
// --- FUNCIONES AUXILIARES ---
// ========================================== //

/**
 * Determina si la tienda está abierta actualmente.
 * NOTA: Implementación actual simplificada para desarrollo.
 * @returns boolean
 */
export function isStoreOpen(): boolean {
  // Retorna true por defecto para facilitar pruebas fuera de horario.
  return true; // siempre abierto (pruebas)
}

// Exportación por defecto del componente Header.
export default Header;

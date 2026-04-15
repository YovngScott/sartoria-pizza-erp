// ========================================== //
// --- IMPORTACIONES ---
// ========================================== //

// Importa 'motion' de framer-motion para animaciones de entrada.
// ¿Por qué?: Permite que las tarjetas aparezcan con un efecto de cascada (stagger) al cargar el menú.
import { motion } from 'framer-motion';

// Importa el icono 'Plus' de lucide-react.
// ¿Por qué?: Se utiliza en el botón de añadir al carrito para indicar la acción de agregar.
import { Plus } from 'lucide-react';

// Importa el mapeo local de imágenes de pizza.
// ¿Por qué?: Proporciona imágenes por defecto si no hay una URL de imagen en la base de datos.
import { pizzaImages } from '@/data/pizzaImages';

// Importa el hook de moneda para formatear el precio de la pizza.
// ¿Por qué?: Asegura que el precio se muestre en la moneda seleccionada por el usuario (DOP, USD, etc.).
import { useCurrency } from '@/contexts/CurrencyContext';

// Importa el hook del contexto de la aplicación para acceder a la función de añadir al carrito.
import { useApp } from '@/contexts/CartContext';

// Importa la función de verificación de estado de la tienda.
// ¿Por qué?: Determina si el botón de compra debe estar habilitado o deshabilitado.
import { isStoreOpen } from './Header';

// Importa tipos generados por Supabase.
import type { Tables } from '@/integrations/supabase/types';

// Importa la utilidad de normalización para claves de imágenes.
import { normalizePizzaImageKey } from '@/lib/erp';

// ========================================== //
// --- TIPOS / INTERFACES ---
// ========================================== //

// Alias para el tipo de datos de una pizza según la tabla de la base de datos.
type Pizza = Tables<'pizzas'>;

// Define las propiedades que recibe el componente.
interface Props {
  pizza: Pizza;   // Objeto con la información de la pizza.
  index: number;  // Posición en la lista (usado para el retraso de la animación).
}

// ========================================== //
// --- COMPONENTE PRINCIPAL ---
// ========================================== //

// Define el componente 'PizzaCard' que renderiza la tarjeta individual de cada pizza.
const PizzaCard = ({ pizza, index }: Props) => {
  // --- LÓGICA Y ESTADO ---

  // Obtiene la función de formateo de moneda.
  const { format } = useCurrency();

  // Obtiene la función para agregar productos al carrito global.
  const { addToCart } = useApp();

  // Comprueba si la tienda está abierta.
  const open = isStoreOpen();

  // Determina la fuente de la imagen a mostrar.
  // Lógica: 1. URL de la DB -> 2. Imagen local mapeada -> 3. Placeholder genérico.
  const imgSrc =
    pizza.imagen_url ||
    pizzaImages[normalizePizzaImageKey(pizza)] ||
    '/placeholder.svg';

  // --- RENDERIZADO ---
  return (
    // Contenedor animado que aparece desde abajo con opacidad gradual.
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      // El retraso aumenta según el índice para crear el efecto visual de cascada.
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/40"
    >
      {/* Sección superior de la tarjeta: Imagen y Precio. */}
      <div className="relative aspect-square overflow-hidden">
        {/* Imagen del producto con efecto de zoom al pasar el ratón (hover). */}
        <img
          src={imgSrc}
          alt={pizza.nombre}
          // Carga perezosa (lazy) para todas las imágenes excepto las primeras 4 (LCP optimization).
          loading={index < 4 ? undefined : 'lazy'}
          width={512}
          height={512}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Superposición de gradiente oscuro en la parte inferior para mejorar legibilidad del precio. */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        {/* Etiqueta de precio posicionada sobre la imagen. */}
        <span className="absolute bottom-3 left-3 font-display text-lg font-semibold text-foreground">
          {format(Number(pizza.precio_venta_publico))}
        </span>
      </div>

      {/* Sección inferior de la tarjeta: Información y Botón de Acción. */}
      <div className="p-4">
        {/* Nombre de la pizza. */}
        <h3 className="font-display text-lg font-semibold text-foreground">{pizza.nombre}</h3>
        {/* Descripción breve (truncada a 2 líneas). */}
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{pizza.descripcion}</p>

        {/* 
          Botón para añadir al carrito.
          - Se deshabilita si la tienda está cerrada ('open' es false).
          - Llama a 'addToCart' al hacer clic.
        */}
        <button
          onClick={() => open && addToCart(pizza)}
          disabled={!open}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {/* Icono de suma. */}
          <Plus className="h-4 w-4" />
          {/* Texto dinámico según el estado de apertura. */}
          {open ? 'Añadir al Carrito' : 'No disponible'}
        </button>
      </div>
    </motion.div>
  );
};

// Exportación por defecto para su uso en el componente Index.
export default PizzaCard;

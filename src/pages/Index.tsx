// ========================================== //
// --- IMPORTACIONES ---
// ========================================== //

// Importa el hook personalizado 'useApp' para acceder al estado global del carrito y las pizzas.
// ¿Por qué?: Permite obtener la lista de pizzas y el estado de carga desde el contexto global.
import { useApp } from '@/contexts/CartContext';

// Importa el componente 'PizzaCard' para mostrar cada pizza individualmente.
// ¿Por qué?: Es el componente reutilizable encargado de renderizar la información de una pizza.
import PizzaCard from '@/components/PizzaCard';

// Importa el componente 'ClosedBanner' para mostrar un aviso cuando la tienda está cerrada.
// ¿Por qué?: Informa al usuario que no se pueden realizar pedidos en el horario actual.
import ClosedBanner from '@/components/ClosedBanner';

// Importa la función 'isStoreOpen' del componente Header.
// ¿Por qué?: Se utiliza para verificar si la pizzería está abierta según el horario establecido.
import { isStoreOpen } from '@/components/Header';

// Importa 'motion' de framer-motion para añadir animaciones a los elementos del DOM.
// ¿Por qué?: Mejora la experiencia de usuario con transiciones suaves al cargar la página.
import { motion } from 'framer-motion';

// ========================================== //
// --- COMPONENTE PRINCIPAL ---
// ========================================== //

// Define el componente funcional 'Index' que representa la página de inicio (Menú).
const Index = () => {
  // --- LÓGICA Y ESTADO ---

  // Obtiene el estado actual de apertura de la tienda llamando a 'isStoreOpen()'.
  // ¿Por qué?: Determina si se debe mostrar el banner de tienda cerrada.
  const open = isStoreOpen();

  // Desestructura 'pizzas' (lista de pizzas) y 'loading' (estado de carga) desde el contexto de la aplicación.
  // ¿Por qué?: Proporciona los datos necesarios para renderizar el menú y manejar el estado de carga inicial.
  const { pizzas, loading } = useApp();

  // --- RENDERIZADO ---
  return (
    // Etiqueta principal que contiene todo el contenido de la página de inicio.
    <main className="container mx-auto px-4 py-8">
      {/* 
        Contenedor animado para el encabezado de la página.
        Se desplaza desde abajo (y: 20) hacia su posición original mientras aumenta la opacidad.
      */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        {/* Título principal del menú con gradiente dorado. */}
        <h1 className="font-display text-4xl font-bold gold-text-gradient md:text-5xl">
          Il Nostro Menu
        </h1>
        {/* Subtítulo descriptivo sobre la elaboración de las pizzas. */}
        <p className="mt-3 text-muted-foreground">
          Pizzas artesanales horneadas en horno de leña a 450°C
        </p>
      </motion.div>

      {/* 
        Renderizado condicional del banner de tienda cerrada.
        Solo se muestra si 'open' es falso.
      */}
      {!open && <ClosedBanner />}

      {/* 
        Manejo del estado de carga.
        Si 'loading' es verdadero, muestra un spinner de carga.
        De lo contrario, renderiza la cuadrícula de pizzas.
      */}
      {loading ? (
        <div className="flex justify-center py-12">
          {/* Spinner animado creado con clases de Tailwind CSS. */}
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        /* Cuadrícula responsiva para mostrar las tarjetas de pizza. */
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* 
            Itera sobre el array de pizzas para generar un componente PizzaCard por cada una.
            Se pasa 'pizza' como prop y 'index' para animaciones secuenciales.
          */}
          {pizzas.map((pizza, i) => (
            <PizzaCard key={pizza.id} pizza={pizza} index={i} />
          ))}
        </div>
      )}
    </main>
  );
};

// Exporta el componente Index por defecto para ser utilizado en el enrutado de la aplicación.
export default Index;

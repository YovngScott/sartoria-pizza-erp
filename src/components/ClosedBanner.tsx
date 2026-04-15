// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos motion de framer-motion para añadir animaciones suaves de entrada y salida
import { motion } from 'framer-motion';
// Importamos el icono Clock de lucide-react para representar visualmente el horario
import { Clock } from 'lucide-react';

// ========================================== //
// COMPONENTE PRINCIPAL (CLOSEDBANNER)
// ========================================== //
/**
 * ClosedBanner: Componente visual que informa al usuario que el establecimiento está cerrado.
 * Muestra el horario de apertura y utiliza animaciones para una mejor experiencia de usuario.
 */
const ClosedBanner = () => {
  // ========================================== //
  // RENDERIZADO
  // ========================================== //
  return (
    <motion.div
      {/* Estado inicial de la animación: invisible y ligeramente desplazado hacia arriba */}
      initial={{ opacity: 0, y: -10 }}
      {/* Estado final de la animación: totalmente visible y en su posición original */}
      animate={{ opacity: 1, y: 0 }}
      {/* Clases de Tailwind CSS para el diseño: centrado, margen inferior, bordes redondeados, colores temáticos */}
      className="mx-auto mb-8 max-w-2xl rounded-xl border border-primary/30 bg-secondary p-5 text-center"
    >
      {/* Icono de reloj centrado con el color principal de la marca */}
      <Clock className="mx-auto mb-2 h-8 w-8 text-primary" />
      
      {/* Título informativo con fuente de display y peso seminegrita */}
      <h3 className="font-display text-lg font-semibold text-foreground">
        {/* Texto que indica el estado actual */}
        Cerrado en este momento
      </h3>
      
      {/* Párrafo con detalles sobre el horario de atención */}
      <p className="mt-1 text-sm text-muted-foreground">
        {/* Información específica del horario de apertura y cierre */}
        Volvemos a las 12:00 PM. Nuestro horario es de 12:00 PM a 11:00 PM.
      </p>
    </motion.div>
  );
};

// ========================================== //
// EXPORTACIÓN
// ========================================== //
// Exportamos el componente por defecto para que sea fácilmente importable
export default ClosedBanner;
